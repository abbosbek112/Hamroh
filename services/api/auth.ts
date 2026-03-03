import type { User } from '../../types';
import { FREE_BADGES } from '../../constants';
import { logger } from '../../utils/logger';
import { supabase } from '../supabaseClient';
import { mapDbUserToUser } from './mappers';

export const authApi = {
  getSession: async (): Promise<User | null> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session?.user?.id) return null;

      await new Promise(resolve => setTimeout(resolve, 500));

      let userData: any;
      let retries = 3;

      while (retries > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileData) {
          userData = profileData;
          break;
        }

        if (profileError && (profileError as any).code !== 'PGRST116') {
          logger.warn('Profile fetch error:', profileError);
        }

        retries--;
        if (retries > 0) await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!userData) {
        const metadata = session.user.user_metadata || {};
        const email = session.user.email || '';
        const name = (metadata as any).full_name || (metadata as any).name || email.split('@')[0] || 'User';
        const avatar =
          (metadata as any).avatar_url ||
          (metadata as any).picture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

        const baseUsername = name
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/\s+/g, '_')
          .substring(0, 30);
        let username = baseUsername || 'user';
        let counter = 1;

        for (let i = 0; i < 10; i++) {
          const { data: existing } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .maybeSingle();
          if (!existing) break;
          username = `${baseUsername}_${counter}`;
          counter++;
        }

        const { data: inserted, error: insertError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email,
            name,
            username,
            avatar,
            role: 'user',
            xp: 0,
            level: 1,
            streak: 0,
            focus_minutes: 0,
            badges: FREE_BADGES,
            status: 'Active',
          })
          .select()
          .maybeSingle();

        if (insertError) {
          if ((insertError as any).code === '23503' || (insertError as any).message?.includes('foreign key constraint')) {
            logger.warn('Foreign key constraint error - auth user may not exist in auth.users:', insertError);
          }
          // If the profile was already created (e.g., by the on_auth_user_created trigger), just get it
          if ((insertError as any).code === '23505' || (insertError as any).message?.includes('duplicate key')) {
            const { data: fetched } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
            if (fetched) {
              userData = fetched;
            } else {
              logger.error('Profile exists but could not be fetched:', insertError);
            }
          } else {
            logger.error('Failed to create user profile in getSession:', insertError);
          }
        } else if (inserted) {
          userData = inserted;
        }

        // CRITICAL FALLBACK: If still no userData but we HAVE a session, return a minimal User object
        // This prevents the app from kicking the user out to Landing Page just because of a DB fetch error
        if (!userData) {
          logger.warn('Returning fallback user object from session metadata');
          return {
            id: session.user.id,
            email: email,
            name: name,
            username: username,
            avatar: avatar,
            role: 'user',
            xp: 0,
            level: 1,
            streak: 0,
            inventory: [],
            badges: FREE_BADGES,
            language: (metadata as any).language || 'uz',
          } as User;
        }
      }

      if (!userData) return null;

      const currentBadges: string[] = Array.isArray(userData.badges) ? userData.badges : [];
      const missingFreeBadges = FREE_BADGES.filter(badge => !currentBadges.includes(badge));

      if (missingFreeBadges.length > 0) {
        const updatedBadges = [...currentBadges, ...missingFreeBadges];
        try {
          await supabase.from('users').update({ badges: updatedBadges }).eq('id', session.user.id);
          userData.badges = updatedBadges;
          logger.info(`Added ${missingFreeBadges.length} free badges to user ${session.user.id}`);
        } catch (updateError) {
          logger.warn('Failed to add free badges to existing user:', updateError);
        }
      }

      let platform: any = 'web';
      if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('android')) platform = 'mobile_android';
        else if (ua.includes('iphone') || ua.includes('ipad')) platform = 'mobile_ios';
        else if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) platform = 'desktop';
      }

      if (userData.platform !== platform) {
        supabase.from('users').update({ platform }).eq('id', session.user.id).then(({ error }) => {
          if (error) logger.warn('Error updating user platform:', error);
        });
        userData.platform = platform;
      }

      return mapDbUserToUser(userData);
    } catch (error: unknown) {
      logger.error('getSession error:', error);
      return null;
    }
  },

  login: async (email: string, password?: string): Promise<User> => {
    try {
      if (!password) throw new Error("Parol kiritilishi shart.");

      const normalizedInput = email.toLowerCase().trim();

      const isAuthDisabled = import.meta.env.VITE_AUTH_DISABLED === 'true';
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (isAuthDisabled || !supabaseUrl || !supabaseAnonKey) {
        throw new Error("Backend sozlanmagan. Demo rejimda faqat UI ni ko'rishingiz mumkin.");
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && (!(session as any).access_token || !(session as any).user)) {
          await supabase.auth.signOut();
        }
      } catch (e) {
        logger.warn('Session check error during login:', e);
      }

      let authData: any = null;
      let authError: any = null;

      const { data: emailAuthData, error: emailAuthError } = await supabase.auth.signInWithPassword({
        email: normalizedInput,
        password,
      });

      if (!emailAuthError && emailAuthData?.user && emailAuthData?.session) {
        authData = emailAuthData;
      } else {
        const { data: userByUsername } = await supabase
          .from('users')
          .select('email')
          .ilike('username', normalizedInput)
          .maybeSingle();

        if (userByUsername?.email) {
          const { data: usernameAuthData, error: usernameAuthError } = await supabase.auth.signInWithPassword({
            email: userByUsername.email,
            password,
          });

          if (!usernameAuthError && usernameAuthData?.user && usernameAuthData?.session) authData = usernameAuthData;
          else authError = usernameAuthError || emailAuthError;
        } else {
          authError = emailAuthError;
        }
      }

      if (authError || !authData?.user || !authData?.session) {
        if (authError?.message?.includes('Backend not configured')) {
          throw new Error("Backend sozlanmagan. Demo rejimda faqat UI ni ko'rishingiz mumkin.");
        }
        if (authError?.message?.includes('Invalid login credentials') || authError?.message?.includes('invalid_credentials')) {
          throw new Error("Email yoki parol noto'g'ri. Iltimos, tekshirib qayta urinib ko'ring.");
        }
        if (authError?.message?.includes('Email not confirmed') || authError?.message?.includes('email_not_confirmed')) {
          throw new Error(
            "Email tasdiqlanmagan. Email'ingizga yuborilgan tasdiqlash havolasini bosing. " +
            "Agar email kelmagan bo'lsa, spam papkasini tekshiring yoki qayta ro'yxatdan o'ting."
          );
        }
        if (authError?.message?.includes('User not found') || authError?.message?.includes('user_not_found')) {
          throw new Error("Bu email bilan foydalanuvchi topilmadi. Iltimos, avval ro'yxatdan o'ting.");
        }

        const errorMessage = authError?.message?.toLowerCase() || '';
        const errorCode = authError?.status || authError?.code || '';
        const errorString = String(errorMessage + ' ' + errorCode).toLowerCase();

        if (
          errorString.includes('rate limit') ||
          errorString.includes('rate_limit') ||
          errorString.includes('too many') ||
          errorString.includes('too_many') ||
          errorString.includes('429') ||
          errorCode === 429 ||
          authError?.status === 429 ||
          errorMessage.includes('exceeded') ||
          errorMessage.includes('quota') ||
          errorMessage.includes('limit')
        ) {
          logger.warn('Rate limit detected in login:', {
            message: authError?.message,
            status: authError?.status,
            code: authError?.code,
          });
          throw new Error("Juda ko'p urinishlar. Iltimos, 2-3 daqiqa kutib, keyin qayta urinib ko'ring.");
        }

        if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('failed to fetch')) {
          throw new Error("Internet bilan bog'lanishda muammo. Iltimos, internetni tekshiring va qayta urinib ko'ring.");
        }

        throw new Error(authError?.message || "Login muvaffaqiyatsiz. Email va parolni tekshiring.");
      }

      let userData: any;
      let retries = 3;
      while (retries > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profileData) {
          userData = profileData;
          break;
        }

        if (profileError && (profileError as any).code !== 'PGRST116') logger.warn('Profile fetch error:', profileError);
        retries--;
        if (retries > 0) await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!userData) {
        logger.error('User profile not found during login:', {
          userId: authData.user.id,
          email: authData.user.email || normalizedInput,
        });
        throw new Error(
          "Foydalanuvchi profili topilmadi. Iltimos, qayta ro'yxatdan o'ting yoki texnik yordam so'rang. " +
          "Agar siz yangi foydalanuvchi bo'lsangiz, 'Ro'yxatdan o'tish' tugmasini bosing."
        );
      }

      return mapDbUserToUser(userData);
    } catch (error: unknown) {
      logger.error('login error:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (
        errorMessage &&
        (errorMessage.includes("noto'g'ri") ||
          errorMessage.includes('tasdiqlanmagan') ||
          errorMessage.includes('topilmadi') ||
          errorMessage.includes("ko'p urinishlar"))
      ) {
        throw error instanceof Error ? error : new Error(errorMessage);
      }
      throw new Error(errorMessage || "Login muvaffaqiyatsiz. Email va parolni tekshiring.");
    }
  },

  register: async (
    name: string,
    email: string,
    password?: string,
    verifiedSession?: { session: any; user: any } | null
  ): Promise<User> => {
    try {
      logger.info('Register function called with:', {
        name,
        email: email.substring(0, 5) + '***',
        hasPassword: !!password,
        hasVerifiedSession: !!verifiedSession,
      });

      const isAuthDisabled = import.meta.env.VITE_AUTH_DISABLED === 'true';
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (isAuthDisabled || !supabaseUrl || !supabaseAnonKey) {
        throw new Error("Backend sozlanmagan. Demo rejimda ro'yxatdan o'tish mumkin emas.");
      }

      if (!password || password.length < 6) throw new Error("Parol kamida 6 belgidan iborat bo'lishi kerak.");
      if (!name || name.trim().length < 2) throw new Error("Ism kamida 2 belgidan iborat bo'lishi kerak.");

      const normalizedEmail = email.toLowerCase().trim();
      if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error("To'g'ri email kiriting.");

      if (verifiedSession?.user && verifiedSession?.session) {
        logger.info('Using verified session from OTP verification');
        const authUser = verifiedSession.user;

        if (password) {
          try {
            await supabase.auth.updateUser({ password });
            logger.info('Password updated for verified user');
          } catch (updateError: unknown) {
            logger.warn('Password update error (non-critical):', updateError);
          }
        }

        const { data: existingProfileFromTrigger } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (existingProfileFromTrigger) {
          logger.info('Profile exists from trigger (created before code verification), deleting to recreate properly');
          const { error: deleteError } = await supabase.from('users').delete().eq('id', authUser.id);
          if (deleteError) logger.warn('Error deleting profile from trigger:', deleteError);
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        const baseUsername = name
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/\s+/g, '_')
          .substring(0, 30);
        let username = baseUsername || 'user';
        let counter = 1;

        for (let i = 0; i < 10; i++) {
          const { data: existing } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .maybeSingle();
          if (!existing) break;
          username = `${baseUsername}_${counter}`;
          counter++;
        }

        let userData: any;

        const { data: existingProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (existingProfile) {
          const { data: updated, error: updateError } = await supabase
            .from('users')
            .update({
              email: normalizedEmail,
              name,
              username,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
            })
            .eq('id', authUser.id)
            .select()
            .maybeSingle();

          if (updateError) {
            logger.error('Failed to update existing profile:', updateError);
            throw new Error(`Foydalanuvchi profili yangilashda xatolik: ${(updateError as any).message}`);
          }
          if (updated) userData = updated;
        }

        if (!userData) {
          const { data: inserted, error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: normalizedEmail,
              name,
              username,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
              role: 'user',
              xp: 0,
              level: 1,
              streak: 0,
              focus_minutes: 0,
              badges: FREE_BADGES,
              status: 'Active',
            })
            .select()
            .maybeSingle();

          if (insertError) {
            if ((insertError as any).code === '23505') {
              await new Promise(resolve => setTimeout(resolve, 500));
              const { data: fetched } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
              if (!fetched) throw new Error("Foydalanuvchi profili yaratishda xatolik yuz berdi.");
              userData = fetched;
            } else {
              logger.error('Insert error:', insertError);
              throw new Error(`Foydalanuvchi profili yaratishda xatolik: ${(insertError as any).message}`);
            }
          } else {
            userData = inserted;
          }
        }

        if (!userData) throw new Error('Foydalanuvchi profili yaratilmadi.');

        try {
          await supabase.auth.updateUser({ data: { name, username } });
        } catch (updateError) {
          logger.warn('Auth metadata update error (non-critical):', updateError);
        }

        await supabase.auth.signOut();
        return mapDbUserToUser(userData);
      }

      const isDevelopment =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      const skipEmailVerificationEnv = import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === 'true';
      const skipEmailVerification = isDevelopment && skipEmailVerificationEnv;

      if (!skipEmailVerification) {
        throw new Error("Email tasdiqlash talab qilinadi. Iltimos, email'ingizga yuborilgan kodni kiriting.");
      }

      logger.info('Clearing existing session...');
      await supabase.auth.signOut();

      logger.info('Checking if email already exists...');
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (checkError && (checkError as any).code !== 'PGRST116') {
        logger.warn('Error checking existing user:', checkError);
      }
      if (existingUser) throw new Error("Bu email allaqachon ro'yxatdan o'tgan.");

      const baseUsername = name
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 30);
      let username = baseUsername || 'user';
      let counter = 1;

      for (let i = 0; i < 10; i++) {
        const { data: existing } = await supabase.from('users').select('username').eq('username', username).maybeSingle();
        if (!existing) break;
        username = `${baseUsername}_${counter}`;
        counter++;
      }

      logger.info('Signing up with Supabase Auth...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { name, username },
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) {
        logger.error('Supabase Auth signup error:', authError);
        const errorMessage = authError.message?.toLowerCase() || '';
        const errorCode = (authError as any).status || (authError as any).code || '';
        const errorString = String(errorMessage + ' ' + errorCode).toLowerCase();

        if (
          errorCode === 'over_email_send_rate_limit' ||
          errorMessage.includes('email rate limit') ||
          errorMessage.includes('email_send_rate_limit')
        ) {
          logger.warn('Email rate limit detected:', { message: authError.message, status: (authError as any).status, code: (authError as any).code });
          throw new Error("Email yuborish limitiga yetildi. Iltimos, 5-10 daqiqa kutib, keyin qayta urinib ko'ring.");
        }
        if (authError?.message?.includes('Backend not configured')) {
          throw new Error("Backend sozlanmagan. Demo rejimda ro'yxatdan o'tish mumkin emas.");
        }
        if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('failed to fetch')) {
          throw new Error("Internet bilan bog'lanishda muammo. Iltimos, internetni tekshiring va qayta urinib ko'ring.");
        }
        if (
          errorString.includes('rate limit') ||
          errorString.includes('rate_limit') ||
          errorString.includes('too many') ||
          errorString.includes('too_many') ||
          errorString.includes('429') ||
          errorCode === 429 ||
          (authError as any).status === 429 ||
          errorMessage.includes('exceeded') ||
          errorMessage.includes('quota') ||
          errorMessage.includes('limit')
        ) {
          logger.warn('Rate limit detected:', { message: authError.message, status: (authError as any).status, code: (authError as any).code });
          throw new Error("Juda ko'p urinishlar. Iltimos, 2-3 daqiqa kutib, keyin qayta urinib ko'ring.");
        }
        if (
          authError.message?.includes('already registered') ||
          authError.message?.includes('already exists') ||
          authError.message?.includes('User already registered')
        ) {
          throw new Error("Bu email allaqachon ro'yxatdan o'tgan.");
        }
        if (authError.message?.includes('invalid email')) throw new Error("Email formati noto'g'ri.");
        throw new Error(authError.message || "Ro'yxatdan o'tishda xatolik yuz berdi.");
      }

      if (!authData?.user) throw new Error("Ro'yxatdan o'tishda xatolik yuz berdi - foydalanuvchi yaratilmadi.");

      const needsEmailConfirmation = !authData.session && authData.user && !(authData.user as any).email_confirmed_at;

      await new Promise(resolve => setTimeout(resolve, 1500));

      let userData: any;
      let retries = 3;
      while (retries > 0) {
        const { data: existingProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (existingProfile) {
          userData = existingProfile;
          break;
        }

        if (profileError && (profileError as any).code !== 'PGRST116') logger.warn('Profile fetch error:', profileError);
        retries--;
        if (retries > 0) await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!userData) {
        const { data: inserted, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: normalizedEmail,
            name,
            username,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
            role: 'user',
            xp: 0,
            level: 1,
            streak: 0,
            focus_minutes: 0,
            badges: FREE_BADGES,
            status: 'Active',
          })
          .select()
          .maybeSingle();

        if (insertError) {
          if ((insertError as any).code === '23505') {
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: fetched } = await supabase.from('users').select('*').eq('id', authData.user.id).maybeSingle();
            if (!fetched) throw new Error("Foydalanuvchi profili yaratishda xatolik yuz berdi.");
            userData = fetched;
          } else {
            logger.error('Insert error:', insertError);
            throw new Error(`Foydalanuvchi profili yaratishda xatolik: ${(insertError as any).message}`);
          }
        } else {
          userData = inserted;
        }
      } else {
        const { data: updated } = await supabase
          .from('users')
          .update({
            email: normalizedEmail,
            name,
            username,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
          })
          .eq('id', authData.user.id)
          .select()
          .maybeSingle();
        if (updated) userData = updated;
      }

      if (!userData) throw new Error('Foydalanuvchi profili yaratilmadi.');

      if (needsEmailConfirmation && !authData.session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: password!,
        });

        if (signInError) {
          const signInErrorMessage = signInError.message?.toLowerCase() || '';
          const signInErrorCode = (signInError as any).status || (signInError as any).code || '';
          const signInErrorString = String(signInErrorMessage + ' ' + signInErrorCode).toLowerCase();
          if (
            signInErrorString.includes('rate limit') ||
            signInErrorString.includes('rate_limit') ||
            signInErrorString.includes('too many') ||
            signInErrorString.includes('429') ||
            signInErrorCode === 429 ||
            (signInError as any).status === 429
          ) {
            logger.warn('Rate limit detected in auto sign-in after registration:', signInError);
            throw new Error("Juda ko'p urinishlar. Iltimos, 2-3 daqiqa kutib, keyin qayta urinib ko'ring.");
          }
          if (signInError.message?.includes('Email not confirmed') || signInError.message?.includes('email_not_confirmed')) {
            throw new Error(
              "Email tasdiqlash talab qilinadi. Email'ingizga yuborilgan tasdiqlash havolasini bosing. " +
              "Agar email kelmagan bo'lsa, spam papkasini tekshiring."
            );
          }
          logger.warn('Auto sign-in failed after registration:', signInError);
        } else if (signInData?.session) {
          logger.info('Auto sign-in successful after registration');
        }
      }

      logger.info('Registration completed successfully, user ID:', userData.id);
      return mapDbUserToUser(userData);
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const errorWithProps = error as { message?: string; code?: string | number; status?: number };
      logger.error('register error:', {
        message: errorObj.message,
        code: (errorWithProps as any)?.code,
        status: (errorWithProps as any)?.status,
        error,
      });

      const errorMessage = errorObj.message;
      if (
        errorMessage &&
        (errorMessage.includes("noto'g'ri") ||
          errorMessage.includes('tasdiqlash') ||
          errorMessage.includes('topilmadi') ||
          errorMessage.includes("ko'p urinishlar") ||
          errorMessage.includes("allaqachon ro'yxatdan o'tgan") ||
          errorMessage.includes('kamida') ||
          errorMessage.includes('yaratilmadi') ||
          errorMessage.includes('yaratishda xatolik'))
      ) {
        throw errorObj;
      }

      const errorMessageLower = (errorWithProps as any)?.message?.toLowerCase() || errorMessage?.toLowerCase() || '';
      const errorCode = (errorWithProps as any)?.status || (errorWithProps as any)?.code || '';
      const errorString = String(errorMessageLower + ' ' + errorCode).toLowerCase();

      if (
        errorString.includes('rate limit') ||
        errorString.includes('rate_limit') ||
        errorString.includes('too many') ||
        errorString.includes('too_many') ||
        errorString.includes('429') ||
        errorCode === 429 ||
        (errorWithProps as any)?.status === 429 ||
        errorMessageLower.includes('exceeded') ||
        errorMessageLower.includes('quota') ||
        errorMessageLower.includes('limit')
      ) {
        logger.warn('Rate limit detected in register catch:', {
          message: (errorWithProps as any)?.message,
          status: (errorWithProps as any)?.status,
          code: (errorWithProps as any)?.code,
        });
        throw new Error("Juda ko'p urinishlar. Iltimos, 2-3 daqiqa kutib, keyin qayta urinib ko'ring.");
      }
      if (
        (errorWithProps as any)?.message?.includes('already registered') ||
        (errorWithProps as any)?.message?.includes('already exists') ||
        (errorWithProps as any)?.message?.includes('User already registered') ||
        (errorWithProps as any)?.message?.includes('duplicate') ||
        (errorWithProps as any)?.code === '23505'
      ) {
        throw new Error("Bu email allaqachon ro'yxatdan o'tgan.");
      }
      if ((errorWithProps as any)?.message?.includes('invalid email') || (errorWithProps as any)?.message?.includes('email format')) {
        throw new Error("Email formati noto'g'ri.");
      }
      if ((errorWithProps as any)?.message?.includes('Email tasdiqlash') || (errorWithProps as any)?.message?.includes('email not confirmed')) {
        throw errorObj;
      }

      const finalMessage =
        (errorWithProps as any)?.message ||
        errorObj.message ||
        "Ro'yxatdan o'tishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
      logger.error('Throwing generic register error:', finalMessage);
      throw new Error(finalMessage);
    }
  },

  loginWithGoogle: async (): Promise<void> => {
    try {
      logger.info('Starting Google OAuth login...');
      // Get the correct current URL where the user is accessing the app from
      // This ensures mobile devices/LAN devices get redirected back to their local IP/domain
      let redirectTo = window.location.origin;

      // If we're strictly on localhost and have a specific env var, we could use it, 
      // but usually window.location.origin is the safest bet for LAN testing (like 192.168.x.x:3000)
      if (import.meta.env.VITE_OAUTH_REDIRECT_URL && window.location.hostname === 'localhost') {
        redirectTo = import.meta.env.VITE_OAUTH_REDIRECT_URL;
      }

      logger.info('OAuth redirect URL:', redirectTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

      if (error) {
        logger.error('Google OAuth error:', error);
        throw new Error(error.message || "Google orqali kirishda xatolik yuz berdi.");
      }
    } catch (error: unknown) {
      logger.error('loginWithGoogle error:', error);
      const errorMessage = error instanceof Error ? error.message : "Google orqali kirishda xatolik yuz berdi.";
      throw new Error(errorMessage);
    }
  },

  logout: async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: unknown) {
      logger.error('logout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      throw new Error(errorMessage);
    }
  },

  checkUsername: async (username: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();
      return !data && username.toLowerCase() !== 'admin';
    } catch (error: unknown) {
      logger.debug('checkUsername error (non-critical):', error);
      return username.toLowerCase() !== 'admin';
    }
  },

  checkEmail: async (email: string): Promise<boolean> => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const { data } = await supabase.from('users').select('email').eq('email', normalizedEmail).maybeSingle();
      if (data) return false;
      return true;
    } catch (error: unknown) {
      logger.error('checkEmail error:', error);
      return true;
    }
  },
};

