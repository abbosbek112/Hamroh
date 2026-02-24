
import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2, ArrowRight, User as UserIcon, Lock, Sparkles, Zap, Shield, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { logger } from '../utils/logger';
import { supabase } from '../services/supabaseClient';
import { validateEmail, validatePassword } from '../utils/validation';

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';
type ForgotStep = 'EMAIL' | 'CODE' | 'NEW_PASSWORD';
type RegisterStep = 'FORM' | 'CODE' | 'COMPLETE';

export const Auth: React.FC<AuthProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('EMAIL');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('FORM');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Use same state for both password fields - when one is toggled, both change
  const showConfirmPassword = showPassword;

  const { t } = useLanguage();
  const { notify } = useToast();

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Serves as Username/Email
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot Password States
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Registration Email Verification States
  const [registerCode, setRegisterCode] = useState('');
  const [isSendingRegisterCode, setIsSendingRegisterCode] = useState(false);

  if (!isOpen) return null;

  const resetForms = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setForgotCode('');
    setNewPassword('');
    setForgotStep('EMAIL');
    setRegisterStep('FORM');
    setRegisterCode('');
    setIsSendingRegisterCode(false);
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    resetForms();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      // Note: Session clearing is handled in api.login and api.register functions
      // No need to clear here to avoid race conditions

      if (mode === 'LOGIN') {
        // Validate email format using validation utility
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
          notify(emailValidation.error || "Email kiriting.", "error");
          setIsLoading(false);
          return;
        }

        // Validate password using validation utility
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          notify(passwordValidation.error || "Parol kiriting.", "error");
          setIsLoading(false);
          return;
        }

        const user = await api.login(email.trim().toLowerCase(), password);
        onLoginSuccess(user);
        onClose();
        notify(`Xush kelibsiz, ${user.name}!`, "success");
      }
      else if (mode === 'REGISTER') {
        // Email verification doim yoqilishi kerak (production uchun)
        // Faqat development mode'da (localhost + explicit env variable) skip qilish mumkin
        const isLocalhost = window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1';
        const env = (import.meta as any).env as Record<string, string | undefined>;
        const skipEmailVerificationEnv = env.VITE_SKIP_EMAIL_VERIFICATION === 'true';

        // Production'da doim email verification yoqilishi kerak
        // Faqat localhost'da va explicit SKIP_EMAIL_VERIFICATION='true' bo'lsa skip qilish
        const skipEmailVerification = isLocalhost && skipEmailVerificationEnv;

        // Step 1: FORM - Send verification code (or skip if development)
        if (registerStep === 'FORM') {
          // Validate all fields
          if (!name || name.trim().length < 2) {
            notify("Ism kamida 2 belgidan iborat bo'lishi kerak.", "error");
            setIsLoading(false);
            return;
          }
          if (name.trim().length > 50) {
            notify("Ism juda uzun (maksimum 50 belgi).", "error");
            setIsLoading(false);
            return;
          }

          // Validate email format using validation utility
          const emailValidation = validateEmail(email);
          if (!emailValidation.valid) {
            notify(emailValidation.error || "Email kiriting.", "error");
            setIsLoading(false);
            return;
          }

          // Validate password using validation utility
          const passwordValidation = validatePassword(password);
          if (!passwordValidation.valid) {
            notify(passwordValidation.error || "Parol kiriting.", "error");
            setIsLoading(false);
            return;
          }

          if (password !== confirmPassword) {
            notify(t('settings.password_mismatch') || "Parollar mos kelmadi.", "error");
            setIsLoading(false);
            return;
          }

          // Check if email already exists BEFORE sending code
          try {
            const emailAvailable = await api.checkEmail(email.trim().toLowerCase());
            if (!emailAvailable) {
              notify("Bu email allaqachon ro'yxatdan o'tgan. Login qilish uchun 'Kirish' tugmasini bosing.", "error");
              setIsLoading(false);
              return;
            }
          } catch (error: any) {
            logger.error('Email check error:', error);
            // Continue anyway, let sendVerificationCode handle it
          }

          // Skip email verification in development mode
          if (skipEmailVerification) {
            // Directly proceed to registration without email verification
            logger.info('Skipping email verification (development mode)');
            try {
              const registeredEmail = email.trim().toLowerCase();
              logger.info('Starting registration for:', registeredEmail);

              await api.register(name.trim(), registeredEmail, password);

              logger.info('Registration successful, now logging in...');

              // After registration, automatically log in
              const loggedInUser = await api.login(registeredEmail, password);

              logger.info('Auto-login successful for:', loggedInUser.id);

              notify(`Xush kelibsiz, ${loggedInUser.name}!`, "success");

              // Clear form fields
              setPassword('');
              setConfirmPassword('');
              setName('');
              setRegisterStep('FORM');

              // Automatically log in the user and close modal
              onLoginSuccess(loggedInUser);
              onClose();
            } catch (error: any) {
              logger.error('Registration error in Auth component:', error);
              throw error;
            }
            return;
          }

          // Send verification code (production mode)
          setIsSendingRegisterCode(true);
          try {
            await api.sendVerificationCode(email.trim().toLowerCase());
            setRegisterStep('CODE');
            notify("Tasdiqlash kodi emailga yuborildi. Email'ingizni tekshiring.", "info");
          } catch (error: any) {
            logger.error('Send verification code error:', error);
            // Show detailed error message
            let errorMsg = error.message || "Kod yuborishda xatolik yuz berdi";
            if (errorMsg.includes('limitiga yetib') || errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
              errorMsg = "Juda ko'p urinishlar. Iltimos, bir necha daqiqadan keyin qayta urinib ko'ring.";
            } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
              errorMsg = "Internet bilan bog'lanishda muammo. Iltimos, internetni tekshiring.";
            }
            notify(errorMsg, "error");
          } finally {
            setIsSendingRegisterCode(false);
            setIsLoading(false);
          }
          return;
        }

        // Step 2: CODE - Verify code and complete registration
        if (registerStep === 'CODE') {
          if (!registerCode || registerCode.trim().length === 0) {
            notify("Tasdiqlash kodini kiriting", "error");
            setIsLoading(false);
            return;
          }

          // Verify code and get session
          let verifiedSession = null;
          try {
            verifiedSession = await api.verifyEmailCode(email.trim().toLowerCase(), registerCode.trim());
            if (!verifiedSession) {
              notify("Kod noto'g'ri. Iltimos, tekshirib qayta urinib ko'ring.", "error");
              setIsLoading(false);
              return;
            }
          } catch (error: any) {
            logger.error('Verify code error:', error);
            notify(error.message || "Kod noto'g'ri yoki muddati o'tgan", "error");
            setIsLoading(false);
            return;
          }

          // Code verified, proceed with registration using verified session
          try {
            const registeredEmail = email.trim().toLowerCase();
            logger.info('Starting registration with verified session for:', registeredEmail);

            await api.register(name.trim(), registeredEmail, password, verifiedSession);

            logger.info('Registration successful, now logging in...');

            // After registration, automatically log in (api.register calls signOut, so we need to login again)
            const loggedInUser = await api.login(registeredEmail, password);

            logger.info('Auto-login successful for:', loggedInUser.id);

            notify(`Xush kelibsiz, ${loggedInUser.name}!`, "success");

            // Clear form fields
            setPassword('');
            setConfirmPassword('');
            setName('');
            setRegisterCode('');
            setRegisterStep('FORM');

            // Automatically log in the user and close modal
            onLoginSuccess(loggedInUser);
            onClose();
          } catch (error: any) {
            // Log the error for debugging
            logger.error('Registration error in Auth component:', error);

            // Error is already handled in api.register with user-friendly messages
            // Just re-throw to be caught by outer catch
            throw error;
          }
        }
      }
    } catch (error: any) {
      logger.error("Auth error", error);
      // Show user-friendly error message
      let errorMessage = error.message || t('common.error') || "Xatolik yuz berdi";

      // Make error messages more user-friendly
      if (errorMessage.includes("Email tasdiqlash") || errorMessage.includes("email not confirmed") || errorMessage.includes("email_not_confirmed")) {
        errorMessage = errorMessage + " Keyin login qilishingiz mumkin.";
      } else if (errorMessage.includes("noto'g'ri") || errorMessage.includes("Invalid login credentials") || errorMessage.includes("invalid_credentials")) {
        // Already user-friendly, but ensure it's clear
        if (mode === 'LOGIN') {
          errorMessage = "Email yoki parol noto'g'ri. Iltimos, tekshirib qayta urinib ko'ring.";
        }
      } else if (errorMessage.includes("topilmadi") || errorMessage.includes("User not found") || errorMessage.includes("user_not_found")) {
        if (mode === 'LOGIN') {
          errorMessage = "Bu email bilan foydalanuvchi topilmadi. Iltimos, avval ro'yxatdan o'ting.";
        }
      } else if (errorMessage.includes("ko'p urinishlar") || errorMessage.includes("rate limit") || errorMessage.includes("Too many") || errorMessage.includes("429")) {
        errorMessage = "Juda ko'p urinishlar. Iltimos, 2-3 daqiqa kutib, keyin qayta urinib ko'ring.";
      } else if (errorMessage.includes("allaqachon ro'yxatdan o'tgan") || errorMessage.includes("already registered") || errorMessage.includes("already exists")) {
        if (mode === 'REGISTER') {
          errorMessage = "Bu email allaqachon ro'yxatdan o'tgan. Login qilish uchun 'Kirish' tugmasini bosing.";
        }
      } else if (errorMessage.includes("Email formati") || errorMessage.includes("invalid email")) {
        errorMessage = "Email formati noto'g'ri. To'g'ri email kiriting.";
      }

      notify(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (forgotStep === 'EMAIL') {
        // Send Code
        await api.sendVerificationCode(email);
        setForgotStep('CODE');
        notify("Kod emailga yuborildi", "info");
      }
      else if (forgotStep === 'CODE') {
        // Verify Code
        const isValid = await api.verifyEmailCode(email, forgotCode);
        if (isValid) {
          setForgotStep('NEW_PASSWORD');
        } else {
          notify("Kod noto'g'ri. Iltimos, tekshirib qayta urinib ko'ring.", "error");
        }
      }
      else if (forgotStep === 'NEW_PASSWORD') {
        // Reset Password
        if (newPassword.length < 6) {
          notify("Parol qisqa!", "error");
          setIsLoading(false);
          return;
        }
        await api.resetPassword(email, newPassword);
        notify(t('settings.password_success'), "success");
        handleModeSwitch('LOGIN');
      }
    } catch (error: unknown) {
      logger.error("Forgot password error:", error);
      notify("Xatolik yuz berdi", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-200/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Main Card */}
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#0f172a] rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col md:flex-row h-auto md:h-[600px] max-h-[95vh] md:max-h-none">

        <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 backdrop-blur-md transition-colors">
          <X size={18} className="text-slate-500 dark:text-slate-400 sm:w-5 sm:h-5" />
        </button>

        {/* LEFT SIDE - Branding */}
        <div className="w-full md:w-[45%] bg-gradient-to-br from-[#f0f3ff] to-[#f5f0ff] dark:from-slate-900 dark:to-slate-900 p-6 sm:p-10 md:p-14 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#0f172a] dark:bg-white rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-8 shadow-lg shadow-slate-900/10">
              <Sparkles className="text-white dark:text-black sm:hidden" size={18} strokeWidth={2} />
              <Sparkles className="text-white dark:text-black hidden sm:block" size={28} strokeWidth={2} />
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight mb-0.5 sm:mb-2 tracking-tight">
              Hamroh
            </h1>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 leading-tight mb-2 sm:mb-6 tracking-tight">
              AI
            </h1>

            <p className="hidden sm:block text-slate-600 dark:text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed font-medium max-w-sm">
              {t('auth.branding_slogan')}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 sm:gap-4 mt-6 sm:mt-8 md:mt-0">
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl shadow-sm">
              <Zap size={16} className="text-yellow-500 fill-yellow-500 sm:w-[18px] sm:h-[18px]" />
              <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">{t('auth.feature_speed')}</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl shadow-sm">
              <Shield size={16} className="text-green-500 fill-green-500 sm:w-[18px] sm:h-[18px]" />
              <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">{t('auth.feature_secure')}</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Form */}
        <div className="w-full md:w-[55%] bg-white dark:bg-[#0f172a] p-6 sm:p-10 md:p-14 flex flex-col justify-center overflow-y-auto custom-scrollbar">
          <div className="max-w-md mx-auto w-full">

            {/* Header Text */}
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {mode === 'LOGIN' ? t('auth.welcome') : mode === 'REGISTER' ? t('auth.create_account') : t('auth.forgot_title')}
            </h2>
            <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 mb-4 sm:mb-8 font-medium">
              {mode === 'LOGIN' ? t('auth.login_desc') : mode === 'REGISTER' ? t('auth.register_desc') : t('auth.forgot_desc')}
            </p>

            {/* --- FORGOT PASSWORD FLOW --- */}
            {mode === 'FORGOT_PASSWORD' ? (
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                {forgotStep === 'EMAIL' && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('auth.email_label')}</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 sm:py-4 bg-yellow-50 dark:bg-slate-800/50 border-none rounded-xl sm:rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 transition-all font-semibold"
                        placeholder="mail@example.com"
                      />
                    </div>
                  </div>
                )}

                {forgotStep === 'CODE' && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('auth.code_label')}</label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-3.5 text-slate-400" size={20} />
                      <input
                        type="text"
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        required
                        className="w-full pl-12 pr-4 py-3 sm:py-4 bg-yellow-50 dark:bg-slate-800/50 border-none rounded-xl sm:rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 transition-all font-semibold text-center text-xl sm:text-2xl tracking-widest"
                        placeholder="00000000"
                        maxLength={8}
                        autoComplete="one-time-code"
                      />
                    </div>
                    <p className="text-xs text-green-500 pl-2">{t('auth.code_sent')}</p>
                  </div>
                )}

                {forgotStep === 'NEW_PASSWORD' && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('auth.new_password_label')}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-yellow-50 dark:bg-slate-800/50 border-none rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 transition-all font-semibold"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => handleModeSwitch('LOGIN')} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300">
                    <ArrowLeft size={20} />
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 py-4 bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl ${isLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:opacity-90 active:scale-[0.98] cursor-pointer'
                      }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        <span>Kutilmoqda...</span>
                      </>
                    ) : (
                      <>
                        {forgotStep === 'EMAIL' ? t('auth.get_code') : forgotStep === 'CODE' ? t('auth.verify') : t('auth.save')} <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* --- LOGIN / REGISTER FORM --- */
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

                {/* REGISTER CODE STEP */}
                {mode === 'REGISTER' && registerStep === 'CODE' && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                        Tasdiqlash kodi <span className="font-bold">{email.trim().toLowerCase()}</span> email manziliga yuborildi
                      </p>
                    </div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('auth.code_label') || 'Tasdiqlash kodi'}</label>
                    <div className="relative">
                      <Shield className="absolute left-4 top-3.5 text-slate-400" size={20} />
                      <input
                        type="text"
                        value={registerCode}
                        onChange={(e) => setRegisterCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        required
                        className="w-full pl-12 pr-4 py-3 sm:py-4 bg-yellow-50 dark:bg-slate-800/50 border-none rounded-xl sm:rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 transition-all font-semibold text-center text-xl sm:text-2xl tracking-widest"
                        placeholder="00000000"
                        maxLength={8}
                        autoComplete="one-time-code"
                      />
                    </div>
                    <p className="text-xs text-green-500 pl-2">Email'ingizni tekshiring</p>
                    <button
                      type="button"
                      onClick={async () => {
                        if (isSendingRegisterCode) return;
                        setIsSendingRegisterCode(true);
                        try {
                          await api.sendVerificationCode(email.trim().toLowerCase());
                          notify("Kod qayta yuborildi", "info");
                        } catch (error: any) {
                          const errorMsg = error.message || "Kod yuborishda xatolik";
                          // Check for rate limit / 15 seconds error
                          if (errorMsg.includes('45 seconds') || errorMsg.includes('security purposes') || errorMsg.includes('15 soniya')) {
                            notify("Xavfsizlik uchun, kodni qayta yuborishdan oldin 15 soniya kutish kerak. Iltimos, biroz kutib qayta urinib ko'ring.", "error");
                          } else if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
                            notify("Juda ko'p urinishlar. Iltimos, bir necha daqiqadan keyin qayta urinib ko'ring.", "error");
                          } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
                            notify("Internet bilan bog'lanishda muammo. Iltimos, internetni tekshiring.", "error");
                          } else {
                            notify(errorMsg, "error");
                          }
                        } finally {
                          setIsSendingRegisterCode(false);
                        }
                      }}
                      disabled={isSendingRegisterCode}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold"
                    >
                      {isSendingRegisterCode ? 'Yuborilmoqda...' : "Kodni qayta yuborish"}
                    </button>
                  </div>
                )}

                {/* REGISTER FORM STEP */}
                {mode === 'REGISTER' && registerStep === 'FORM' && (
                  <>
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('auth.name')}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <UserIcon size={20} className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="w-full pl-12 pr-4 py-3 sm:py-4 bg-yellow-50 dark:bg-slate-800/50 border-none rounded-xl sm:rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all font-semibold"
                          placeholder={t('auth.name')}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Mail size={20} className="text-slate-400" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-12 pr-12 py-3 sm:py-4 bg-yellow-50 dark:bg-slate-800/50 border-none rounded-xl sm:rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all font-semibold tracking-widest"
                          placeholder="example@gmail.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('auth.password')}</label>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Lock size={20} className="text-slate-400" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full pl-12 pr-12 py-3 sm:py-4 bg-yellow-50 dark:bg-slate-800/50 border-none rounded-xl sm:rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all font-semibold tracking-widest"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    {/* CONFIRM PASSWORD FOR REGISTER */}
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">{t('auth.confirm_label')}</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Lock size={20} className="text-slate-400" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className={`w-full pl-12 pr-12 py-3 sm:py-4 bg-yellow-50 dark:bg-slate-800/50 border-2 rounded-xl sm:rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all font-semibold tracking-widest
                          ${confirmPassword && confirmPassword !== password ? 'border-red-400' : confirmPassword && confirmPassword === password ? 'border-green-400' : 'border-transparent'}
                        `}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      {confirmPassword && confirmPassword === password && (
                        <p className="text-[10px] text-green-500 font-bold flex items-center gap-1 pl-2"><CheckCircle size={10} /> {t('auth.match_success')}</p>
                      )}
                    </div>
                  </>
                )}

                {/* LOGIN FORM */}
                {mode === 'LOGIN' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Mail size={20} className="text-slate-400" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-12 pr-12 py-3 sm:py-4 bg-yellow-50 dark:bg-slate-800/50 border-none rounded-xl sm:rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all font-semibold tracking-widest"
                          placeholder="example@gmail.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t('auth.password')}</label>
                        <button type="button" onClick={() => handleModeSwitch('FORGOT_PASSWORD')} className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                          {t('auth.forgot_password')}
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Lock size={20} className="text-slate-400" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full pl-12 pr-12 py-4 bg-yellow-50 dark:bg-slate-800/50 border-none rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all font-semibold tracking-widest"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Back button for register code step */}
                {mode === 'REGISTER' && registerStep === 'CODE' && (
                  <button
                    type="button"
                    onClick={() => setRegisterStep('FORM')}
                    className="w-full mb-3 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={18} /> Ortga qaytish
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isLoading || (mode === 'REGISTER' && registerStep === 'CODE' && !registerCode)}
                  className={`w-full py-3 sm:py-4 mt-4 sm:mt-6 bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 ${isLoading || (mode === 'REGISTER' && registerStep === 'CODE' && !registerCode)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:opacity-90 active:scale-[0.98] cursor-pointer'
                    }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      <span>
                        {mode === 'LOGIN' ? 'Kirilmoqda...' :
                          mode === 'REGISTER' && registerStep === 'FORM' ? 'Kod yuborilmoqda...' :
                            mode === 'REGISTER' && registerStep === 'CODE' ? "Ro'yxatdan o'tilmoqda..." :
                              t('common.loading')}
                      </span>
                    </>
                  ) : (
                    <>
                      {mode === 'LOGIN' ? t('auth.login_btn') :
                        mode === 'REGISTER' && registerStep === 'FORM' ? 'Kod yuborish' :
                          mode === 'REGISTER' && registerStep === 'CODE' ? t('auth.register_btn') :
                            t('auth.register_btn')} <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Footer Links */}
            {mode !== 'FORGOT_PASSWORD' && (
              <>
                <div className="relative my-4 sm:my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-[#0f172a] px-4 text-slate-500 font-bold tracking-widest">{t('auth.or') || 'YOKI'}</span>
                  </div>
                </div>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={async () => {
                    if (isLoading) return;
                    setIsLoading(true);
                    try {
                      await api.loginWithGoogle();
                      // User will be redirected to Google, so we don't need to do anything else here
                      // After OAuth callback, getSession() will be called automatically in App.tsx
                    } catch (error: any) {
                      logger.error('Google OAuth error:', error);
                      notify(error.message || "Google orqali kirishda xatolik yuz berdi.", "error");
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className={`w-full py-3.5 sm:py-4 mt-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg ${isLoading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] cursor-pointer'
                    }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Kutilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Google bilan kirish</span>
                    </>
                  )}
                </button>

                <p className="mt-4 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {mode === 'LOGIN' ? t('auth.no_account') : t('auth.have_account')}{' '}
                  <button
                    onClick={() => handleModeSwitch(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                    className="text-slate-900 dark:text-white hover:underline decoration-2 underline-offset-4"
                  >
                    {mode === 'LOGIN' ? t('auth.register_link') : t('auth.login_link')}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
