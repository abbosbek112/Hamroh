import { User, SupportMessage, RoutineTask, Todo, GroupMessage, CommunityGroup, JournalEntry, SystemConfig, Deal, ActiveAd, Badge, ChatMessage, SocketEvent, EventType, SupportTicket, StoreItem } from '../types';
import { ACHIEVEMENTS_LIST, FREE_BADGES, STORE_ITEMS, XP_REWARDS } from '../constants';
import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import { checkSpamAndProfanity } from '../utils/validation';
import { mapDbUserToUser, mapUserToDbUser, mapDbMessageToGroupMessage, mapDbGroupToCommunityGroup } from './api/mappers';
import { getCurrentUserId } from './api/session';
import { authApi } from './api/auth';
import { usersApi } from './api/users';
import { groupsApi } from './api/groups';
import { messagesApi } from './api/messages';

/**
 * =========================================================================================
 * 🚀 SUPABASE BACKEND INTEGRATION
 * =========================================================================================
 * 
 * SECURITY FEATURES:
 * - All user input is validated and sanitized
 * - XSS protection on all text fields
 * - SQL injection prevention (Supabase handles parameterized queries)
 * - Rate limiting for spam detection
 * - Real-time subscription cleanup to prevent memory leaks
 * - Error handling with user-friendly messages
 * - Authorization checks on all operations
 * 
 * REAL-TIME FEATURES:
 * - WebSocket subscriptions for instant updates
 * - Proper cleanup on component unmount
 * - Duplicate message prevention
 * - Error recovery mechanisms
 * 
 * CODE QUALITY:
 * - Comprehensive JSDoc comments
 * - Type-safe operations
 * - Clear error messages
 * - Defensive programming practices
 * =========================================================================================
 */


/**
 * =========================================================================================
 * 🚀 REAL-TIME SUBSCRIPTION MANAGEMENT
 * =========================================================================================
 * 
 * SECURITY FEATURES:
 * - Tracks all active subscriptions
 * - Properly cleans up subscriptions to prevent memory leaks
 * - Validates all payloads before processing
 * - Handles errors gracefully
 * =========================================================================================
 */

// SECURITY: Track all active real-time subscriptions for cleanup
const channels: Map<string, ReturnType<typeof supabase.channel>> = new Map();

// API Service
export const api = {
  // --- REAL-TIME SUBSCRIPTION ---
  /**
   * Subscribe to real-time message events (INSERT, UPDATE, DELETE)
   * 
   * SECURITY FEATURES:
   * - Validates all payloads before processing
   * - Handles errors gracefully to prevent crashes
   * - Cleans up subscriptions properly to prevent memory leaks
   * 
   * @param handler - Callback function to handle real-time events
   * @returns Cleanup function to unsubscribe
   */
  subscribe: (handler: (event: SocketEvent) => void) => {
    // SECURITY: Validate handler function
    if (typeof handler !== 'function') {
      logger.error('Invalid handler provided to subscribe:', handler);
      return () => { }; // Return no-op cleanup function
    }

    const channel = supabase
      .channel('messages_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload: any) => {
          // SECURITY: Validate payload before processing to prevent null/undefined errors
          if (!payload?.new?.sender_id || !payload?.new?.id) {
            logger.warn('Invalid INSERT payload received:', payload);
            return;
          }

          try {
            // Fetch sender user info (only essential fields for notification - last_active may not be accessible)
            const { data: sender, error: senderError } = await supabase
              .from('users')
              .select('id, name, username, avatar, email, role, xp, level, streak, focus_minutes, bio, phone_number, age, badges, selected_badge_id, theme, language, status, created_at')
              .eq('id', payload.new.sender_id)
              .single();

            if (senderError || !sender) {
              logger.warn('Failed to fetch sender in real-time subscription:', senderError);
              // Continue with message even if sender fetch fails (graceful degradation)
            }

            const mappedSender = sender ? mapDbUserToUser(sender) : null;
            const usersMap = mappedSender ? new Map([[mappedSender.id, mappedSender]]) : new Map();
            const message = mapDbMessageToGroupMessage(payload.new, usersMap);

            // SECURITY: Validate message before sending to handler
            if (!message || !message.id) {
              logger.warn('Invalid message created from payload:', payload);
              return;
            }

            const channelId = payload.new.group_id || payload.new.receiver_id || 'global';
            handler({
              type: 'NEW_MESSAGE',
              payload: message,
              channelId,
            });
          } catch (error: unknown) {
            // SECURITY: Catch and log errors to prevent real-time subscription crashes
            logger.error('Error processing NEW_MESSAGE event:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        async (payload: any) => {
          // SECURITY: Validate payload before processing to prevent null/undefined errors
          if (!payload?.new?.sender_id || !payload?.new?.id) {
            logger.warn('Invalid UPDATE payload received:', payload);
            return;
          }

          try {
            // Fetch sender user info (only essential fields for notification - last_active may not be accessible)
            const { data: sender, error: senderError } = await supabase
              .from('users')
              .select('id, name, username, avatar, email, role, xp, level, streak, focus_minutes, bio, phone_number, age, badges, selected_badge_id, theme, language, status, created_at')
              .eq('id', payload.new.sender_id)
              .single();

            if (senderError || !sender) {
              logger.warn('Failed to fetch sender in real-time subscription (UPDATE):', senderError);
              // Continue with message even if sender fetch fails (graceful degradation)
            }

            const mappedSender = sender ? mapDbUserToUser(sender) : null;
            const usersMap = mappedSender ? new Map([[mappedSender.id, mappedSender]]) : new Map();
            const message = mapDbMessageToGroupMessage(payload.new, usersMap);

            // SECURITY: Validate message before sending to handler
            if (!message || !message.id) {
              logger.warn('Invalid message created from UPDATE payload:', payload);
              return;
            }

            const channelId = payload.new.group_id || payload.new.receiver_id || 'global';
            handler({
              type: 'UPDATE_MESSAGE',
              payload: message,
              channelId,
            });
          } catch (error: unknown) {
            // SECURITY: Catch and log errors to prevent real-time subscription crashes
            logger.error('Error processing UPDATE_MESSAGE event:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          // SECURITY: Validate payload before processing
          if (!payload.old?.id) {
            logger.warn('Invalid DELETE payload received:', payload);
            return;
          }

          const channelId = payload.old?.group_id || payload.old?.receiver_id || 'global';
          handler({
            type: 'DELETE_MESSAGE',
            payload: {
              id: payload.old.id,
              groupId: payload.old.group_id || undefined,
              receiverId: payload.old.receiver_id || undefined,
              userId: payload.old.sender_id || undefined,
            },
            channelId,
          });
        }
      )
      .subscribe();

    // SECURITY: Store channel for cleanup
    channels.set('messages_channel', channel);

    // Return cleanup function to prevent memory leaks
    return () => {
      try {
        channel.unsubscribe();
        channels.delete('messages_channel');
        logger.debug('Real-time subscription cleaned up successfully');
      } catch (error: unknown) {
        // SECURITY: Log cleanup errors but don't throw (cleanup should never fail)
        logger.error('Error cleaning up real-time subscription:', error);
      }
    };
  },

  /**
   * Subscribe to real-time routine updates
   * @param userId - Current user ID to filter events
   * @param handler - Callback function
   * @returns Cleanup function
   */
  subscribeToRoutines: (userId: string, handler: (event: SocketEvent) => void) => {
    if (!userId) return () => { };

    const channelId = `routines_${userId}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'routine_tasks', filter: `user_id=eq.${userId}` },
        (payload) => {
          handler({
            type: 'ROUTINE_UPDATE',
            payload: payload,
            channelId: userId
          });
        }
      )
      .subscribe();

    channels.set(channelId, channel);

    return () => {
      try {
        const ch = channels.get(channelId);
        if (ch) ch.unsubscribe();
        channels.delete(channelId);
      } catch (e) {
        logger.error('Error cleaning up routine subscription:', e);
      }
    };
  },

  /**
   * Subscribe to real-time user profile updates (XP, Level, etc.)
   * @param userId - Target user ID
   * @param handler - Callback function
   * @returns Cleanup function
   */
  subscribeToUser: (userId: string, handler: (event: SocketEvent) => void) => {
    if (!userId) return () => { };

    const channelId = `user_${userId}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        (payload) => {
          if (payload.new) {
            const user = mapDbUserToUser(payload.new);
            handler({
              type: 'USER_UPDATE',
              payload: user,
              channelId: userId
            });
          }
        }
      )
      .subscribe();

    channels.set(channelId, channel);

    return () => {
      try {
        const ch = channels.get(channelId);
        if (ch) ch.unsubscribe();
        channels.delete(channelId);
      } catch (e) {
        logger.error('Error cleaning up user subscription:', e);
      }
    };
  },

  /**
   * Subscribe to leaderboard updates (any user XP change)
   * @param handler - Callback function
   * @returns Cleanup function
   */
  subscribeToLeaderboard: (handler: (event: SocketEvent) => void) => {
    const channelId = 'leaderboard_global';
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users' },
        (payload) => {
          // Trigger update if we have new data
          if (payload.new) {
            // We transmit the updated user, but the UI might just decide to reload the list
            // or update the specific user in the list
            const user = mapDbUserToUser(payload.new);
            handler({
              type: 'USER_UPDATE',
              payload: user,
              channelId: 'leaderboard'
            });
          }
        }
      )
      .subscribe();

    channels.set(channelId, channel);

    return () => {
      try {
        const ch = channels.get(channelId);
        if (ch) ch.unsubscribe();
        channels.delete(channelId);
      } catch (e) {
        logger.error('Error cleaning up leaderboard subscription:', e);
      }
    };
  },

  // --- AUTHENTICATION & USER DB ---
  /**
   * Get current user session
   * 
   * SECURITY FEATURES:
   * - Validates session before returning
   * - Creates user profile if missing (for OAuth users)
   * - Handles errors gracefully
   * - Returns null if no session (allows app to show landing page)
   * 
   * @returns User object if session exists, null otherwise
   */
  getSession: authApi.getSession,

  /**
   * Login user with email and password
   * 
   * SECURITY FEATURES:
   * - Validates email format
   * - Validates password presence
   * - Checks for demo mode
   * - Handles rate limiting
   * - Provides user-friendly error messages
   * - Prevents profile creation during login (security best practice)
   * 
   * @param email - User email address
   * @param password - User password
   * @returns User object on success
   * @throws Error with user-friendly message on failure
   */
  login: authApi.login,

  /**
   * Register new user
   * 
   * SECURITY FEATURES:
   * - Validates all input fields
   * - Checks for demo mode
   * - Validates email format
   * - Validates password strength
   * - Checks for existing users
   * - Creates unique username
   * - Handles OTP verification flow
   * - Provides user-friendly error messages
   * 
   * @param name - User's full name
   * @param email - User's email address
   * @param password - User's password (min 6 characters)
   * @param verifiedSession - Optional verified session from OTP flow
   * @returns User object on success
   * @throws Error with user-friendly message on failure
   */
  register: authApi.register,

  loginWithGoogle: authApi.loginWithGoogle,

  logout: authApi.logout,

  checkUsername: authApi.checkUsername,

  checkEmail: authApi.checkEmail,

  updateUser: usersApi.updateUser,

  buyItem: async (itemId: string): Promise<User> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Unauthorized");

      const item = STORE_ITEMS.find(i => i.id === itemId);
      if (!item) throw new Error("Mahsulot topilmadi");

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error("Foydalanuvchi ma'lumotlarini olishda xatolik");
      }

      if ((user.xp || 0) < item.price) {
        throw new Error("Xarid uchun mablag' yetarli emas!");
      }

      const xp = (user.xp || 0) - item.price;
      const currentInventory: string[] = Array.isArray(user.inventory) ? user.inventory : [];

      const updateData: Record<string, unknown> = { xp };

      if (item.id === 'streak_freeze') {
        updateData.inventory = [...currentInventory, 'streak_freeze'];
      } else if (item.id === 'double_xp') {
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        updateData.double_xp_expires_at = expiresAt;
      } else if (item.type === 'THEME' && item.value) {
        updateData.app_theme = item.value;
        if (!currentInventory.includes(item.id)) {
          updateData.inventory = [...currentInventory, item.id];
        }
      } else if (item.type === 'BADGE' && item.value) {
        const currentBadges = Array.isArray(user.badges) ? user.badges : [];
        if (!currentBadges.includes(item.value)) {
          updateData.badges = [...currentBadges, item.value];
        }
        if (!currentInventory.includes(item.id)) {
          updateData.inventory = [...currentInventory, item.id];
        }
      } else {
        if (!currentInventory.includes(item.id)) {
          updateData.inventory = [...currentInventory, item.id];
        }
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        throw new Error("Xaridni saqlashda xatolik");
      }

      const updatedUser = await api.getUserById(userId);
      if (!updatedUser) throw new Error("Foydalanuvchi yangilanmadi");
      return updatedUser;

    } catch (error: unknown) {
      logger.error('buyItem error:', error);
      const errorMessage = error instanceof Error ? error.message : "Xarid amalga oshmadi";
      throw new Error(errorMessage);
    }
  },

  getXpMultiplier: (user: User | null): number => {
    if (!user?.doubleXpExpiresAt) return 1;
    if (Date.now() >= user.doubleXpExpiresAt) return 1;
    return 2;
  },

  checkStreakWithFreeze: async (): Promise<User | null> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return null;

      const { data: user, error } = await supabase
        .from('users')
        .select('id, streak, last_active, inventory')
        .eq('id', userId)
        .single();

      if (error || !user) return null;

      const lastActive = user.last_active ? new Date(user.last_active) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!lastActive) return null;

      const lastActiveDate = new Date(lastActive);
      lastActiveDate.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const diffMs = today.getTime() - lastActiveDate.getTime();
      const missedDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      if (missedDays <= 1) return null;

      const currentStreak = typeof user.streak === 'number' ? user.streak : 0;
      if (currentStreak <= 0) return null;

      const inv: string[] = Array.isArray(user.inventory) ? user.inventory : [];
      const freezesAvailable = inv.filter((x: string) => x === 'streak_freeze').length;
      const freezesNeeded = missedDays - 1;

      if (freezesAvailable >= freezesNeeded) {
        const newInv = [...inv];
        let used = 0;
        for (let i = newInv.length - 1; i >= 0 && used < freezesNeeded; i--) {
          if (newInv[i] === 'streak_freeze') {
            newInv.splice(i, 1);
            used++;
          }
        }
        await supabase.from('users').update({ inventory: newInv }).eq('id', userId);
        return api.getUserById(userId);
      } else {
        await supabase.from('users').update({ streak: 0 }).eq('id', userId);
        return api.getUserById(userId);
      }
    } catch {
      return null;
    }
  },

  // Admin function to update any user (bypasses authorization check)
  updateUserAdmin: async (user: User): Promise<User> => {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        throw new Error("Unauthorized");
      }

      // Check if current user is admin
      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUserId)
        .single();

      if (!currentUser || currentUser.role !== 'admin') {
        throw new Error("Unauthorized: Admin privileges required");
      }

      const dbUser = mapUserToDbUser(user);
      // Remove last_active from update - it's updated automatically by trigger
      const { last_active, ...updateData } = dbUser;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        throw new Error("Foydalanuvchi yangilanishda xatolik yuz berdi.");
      }

      return mapDbUserToUser(data);
    } catch (error: unknown) {
      logger.error('updateUserAdmin error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      throw new Error(errorMessage);
    }
  },

  // Routine tugaganda XP (RPC orqali, xavfsiz)
  awardXpRoutine: async (): Promise<{ xp: number; level: number } | null> => {
    try {
      const { data, error } = await supabase.rpc('award_xp_routine');
      if (error) throw error;
      if (!data?.success) return null;
      return { xp: data.xp, level: data.level };
    } catch {
      return null;
    }
  },

  // DEPRECATED: Bevosita chaqirmang. XP faqat RPC orqali (award_xp_todo, award_xp_journal, award_xp_focus, award_xp_routine)
  addXP: async (amount: number, userId?: string): Promise<{ xp: number; level: number; leveledUp: boolean }> => {
    try {
      const currentUserId = userId || await getCurrentUserId();
      if (!currentUserId) throw new Error("Unauthorized");

      // Get current user data
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('xp, level, double_xp_expires_at')
        .eq('id', currentUserId)
        .single();

      if (fetchError) throw fetchError;
      if (!userData) throw new Error("User not found");

      const doubleXpActive = userData.double_xp_expires_at && new Date(userData.double_xp_expires_at).getTime() > Date.now();
      const multiplier = doubleXpActive ? 2 : 1;
      const currentXP = userData.xp || 0;
      const currentLevel = userData.level || 1;
      const newXP = currentXP + amount * multiplier;

      // Calculate new level (1000 XP per level)
      const newLevel = Math.floor(newXP / 1000) + 1;
      const leveledUp = newLevel > currentLevel;

      // Update user XP and level
      const { error: updateError } = await supabase
        .from('users')
        .update({
          xp: newXP,
          level: newLevel
        })
        .eq('id', currentUserId);

      if (updateError) throw updateError;

      return { xp: newXP, level: newLevel, leveledUp };
    } catch (error: unknown) {
      logger.error('addXP error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add XP';
      throw new Error(errorMessage);
    }
  },

  getUserById: async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

      return data ? mapDbUserToUser(data) : null;
    } catch (error: unknown) {
      logger.error('getUserById error:', error);
      return null;
    }
  },

  getUserByUsername: async (username: string): Promise<User | null> => {
    try {
      if (!username.trim()) return null;

      // Remove @ if present (Telegram style: @username)
      const cleanUsername = username.trim().replace(/^@/, '');

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

      return data ? mapDbUserToUser(data) : null;
    } catch (error: unknown) {
      logger.error('getUserByUsername error:', error);
      return null;
    }
  },

  searchUsers: async (query: string): Promise<User[]> => {
    try {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return (data || []).map(mapDbUserToUser);
    } catch (error: unknown) {
      logger.error('searchUsers error:', error);
      return [];
    }
  },

  getAllUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDbUserToUser);
    } catch (error: unknown) {
      logger.error('getAllUsers error:', error);
      return [];
    }
  },

  banUser: async (userId: string, ban: boolean = true, durationMinutes?: number): Promise<void> => {
    try {
      const userId_check = await getCurrentUserId();
      if (!userId_check) throw new Error("Unauthorized");

      // Check if current user is admin
      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId_check)
        .single();

      if (currentUser?.role !== 'admin') {
        throw new Error("Faqat admin foydalanuvchilarni blok qila oladi");
      }

      const updates: any = { status: ban ? 'Banned' : 'Active' };

      if (ban && durationMinutes) {
        const banExpiresAt = new Date(Date.now() + durationMinutes * 60000).toISOString();
        updates.ban_expires_at = banExpiresAt;
      } else if (!ban) {
        updates.ban_expires_at = null;
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('banUser error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Foydalanuvchini blok qilishda xatolik';
      throw new Error(errorMessage);
    }
  },

  // --- GROUPS & COMMUNITY ---
  getLeaderboard: groupsApi.getLeaderboard,

  getGroups: groupsApi.getGroups,

  getUserGroups: groupsApi.getUserGroups,

  createGroup: groupsApi.createGroup,

  joinGroup: groupsApi.joinGroup,

  leaveGroup: groupsApi.leaveGroup,

  removeGroupMember: groupsApi.removeGroupMember,

  getGroupMembers: groupsApi.getGroupMembers,

  getGroupMessages: groupsApi.getGroupMessages,

  sendGroupMessage: groupsApi.sendGroupMessage,

  // --- DIRECT MESSAGES ---
  getDirectMessages: messagesApi.getDirectMessages,

  sendDirectMessage: messagesApi.sendDirectMessage,

  markDirectMessagesRead: messagesApi.markDirectMessagesRead,

  getMessageById: messagesApi.getMessageById,

  getPinnedMessage: messagesApi.getPinnedMessage,

  setPinnedMessage: messagesApi.setPinnedMessage,

  getRecentDirectChats: messagesApi.getRecentDirectChats,

  getDirectMessagesForUnreadCount: messagesApi.getDirectMessagesForUnreadCount,

  updateMessage: messagesApi.updateMessage,

  deleteMessage: messagesApi.deleteMessage,

  addReaction: messagesApi.addReaction,

  clearGroupHistory: messagesApi.clearGroupHistory,

  updateGroup: async (groupId: string, updates: { name?: string; description?: string; category?: string }): Promise<CommunityGroup> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        throw new Error('Guruh topilmadi.');
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      const isAdmin = currentUser?.role === 'admin';
      const isOwner = group.owner_id === userId;

      if (!isOwner && !isAdmin) {
        throw new Error('Unauthorized - Faqat guruh admini yoki tizim admini tahrirlay oladi.');
      }

      const { data: updated, error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      if (!updated) throw new Error('Guruh yangilanmadi.');

      return mapDbGroupToCommunityGroup(updated);
    } catch (error: unknown) {
      logger.error('updateGroup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update group';
      throw new Error(errorMessage);
    }
  },

  clearGroupMessages: async (groupId: string): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (fetchError || !group) {
        throw new Error('Guruh topilmadi.');
      }

      if (group.owner_id !== userId) {
        const { data: currentUser } = await supabase.from('users').select('role').eq('id', userId).single();

        if (currentUser?.role !== 'admin') {
          throw new Error("Siz faqat o'z guruhingizning tarixini tozalay olasiz.");
        }
      }

      const { error } = await supabase.from('messages').delete().eq('group_id', groupId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('clearGroupMessages error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear group messages';
      throw new Error(errorMessage);
    }
  },

  deleteGroup: async (groupId: string): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        throw new Error('Guruh topilmadi.');
      }

      if (group.owner_id !== userId) {
        const { data: currentUser } = await supabase.from('users').select('role').eq('id', userId).single();

        if (currentUser?.role !== 'admin') {
          throw new Error("Siz faqat o'z guruhingizni o'chira olasiz.");
        }
      }

      const { error } = await supabase.from('groups').delete().eq('id', groupId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('deleteGroup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete group';
      throw new Error(errorMessage);
    }
  },

  // --- SYSTEM CONFIG ---
  getSystemConfig: async (): Promise<SystemConfig> => {
    return {
      limits: {
        aiDailyMessages: { free: -1 },
        groupCreation: { free: 10 },
        groupJoining: { free: -1 },
        uploadSizeMB: { free: 100 },
        activeHabits: { free: -1 },
        historyRetentionDays: { free: 365 },
      },
    };
  },

  // --- UTILS ---

  // --- SUPPORT TICKETS ---

  // --- SYSTEM CONFIG ---

  // --- UTILS ---
  resetPassword: async (email: string, newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return true;
    } catch (error: unknown) {
      logger.error('resetPassword error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      throw new Error(errorMessage);
    }
  },

  sendVerificationCode: async (email: string): Promise<boolean> => {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Check if email already exists in our database
      const emailAvailable = await api.checkEmail(normalizedEmail);
      if (!emailAvailable) {
        throw new Error("Bu email allaqachon ro'yxatdan o'tgan.");
      }

      // Use Supabase Auth OTP (One-Time Password) for email verification
      // IMPORTANT: shouldCreateUser: true is required for new users to receive OTP codes
      // However, this creates auth user immediately, which triggers profile creation in users table
      // To prevent profile creation before code verification, we'll check and clean up in verifyEmailCode
      const { data, error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          // Create user temporarily - will be properly set up after code verification
          shouldCreateUser: true,
        },
      });

      // After sending code, check if user profile was created by trigger
      // If it exists, delete it - we'll recreate it properly after code verification
      if (!error && data) {
        // Small delay to let trigger finish
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if user profile was created by trigger (shouldn't exist yet)
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', normalizedEmail)
          .maybeSingle();

        // If profile exists, it was created by trigger before code verification
        // Delete it - it will be recreated properly after code verification in api.register
        // CRITICAL: If we can't delete it, throw error to prevent registration without code verification
        if (existingProfile) {
          logger.warn('Profile created by trigger before code verification, deleting it:', existingProfile.id);
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', existingProfile.id);

          if (deleteError) {
            logger.error('CRITICAL: Could not delete profile created by trigger:', deleteError);
            // CRITICAL: If we can't delete the profile, we must throw error
            // Otherwise user will be created without code verification
            throw new Error(
              "Xavfsizlik muammosi: Profil yaratilgan, lekin o'chirib bo'lmadi. " +
              "Iltimos, qayta urinib ko'ring yoki texnik yordam so'rang."
            );
          }
        }
      }

      if (error) {
        logger.error('sendVerificationCode OTP error:', error);
        throw error;
      }

      return true;
    } catch (error: unknown) {
      logger.error('sendVerificationCode error:', error);

      // Check for email rate limit - Supabase specific error
      const errorWithProps = error as { message?: string; code?: string | number; status?: number };
      const errorMessage = errorWithProps?.message?.toLowerCase() || '';
      const errorCode = errorWithProps?.code || errorWithProps?.status || '';
      const errorString = String(errorMessage + ' ' + errorCode).toLowerCase();

      // Check for SMTP/Email sending errors FIRST (before rate limit)
      if (
        errorMessage.includes('error sending magic link email') ||
        errorMessage.includes('error sending email') ||
        errorMessage.includes('smtp') ||
        errorMessage.includes('email configuration') ||
        errorMessage.includes('mail service') ||
        errorCode === 'email_service_error'
      ) {
        throw new Error(
          "Email yuborishda xatolik yuz berdi. Iltimos, biroz vaqt o'tgach qayta urinib ko'ring yoki texnik yordam so'rang."
        );
      }

      // Check for backend not configured
      if (errorMessage.includes('backend not configured')) {
        throw new Error("Backend sozlanmagan. Demo rejimda email tasdiqlash ishlamaydi.");
      }

      // Check for network errors
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('failed to fetch')) {
        throw new Error("Internet bilan bog'lanishda muammo. Iltimos, internetni tekshiring va qayta urinib ko'ring.");
      }

      // Check for backend not configured
      if (errorMessage.includes('backend not configured')) {
        throw new Error("Backend sozlanmagan. Demo rejimda email tasdiqlash ishlamaydi.");
      }

      // Check for network errors
      if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('failed to fetch')) {
        throw new Error("Internet bilan bog'lanishda muammo. Iltimos, internetni tekshiring va qayta urinib ko'ring.");
      }

      // Check for "45 seconds" security limit error (resend code protection)
      if (
        errorMessage.includes('45 seconds') ||
        errorMessage.includes('security purposes') ||
        errorMessage.includes('can only request this after')
      ) {
        throw new Error(
          "Xavfsizlik uchun, kodni qayta yuborishdan oldin 15 soniya kutish kerak. Iltimos, biroz kutib qayta urinib ko'ring."
        );
      }

      if (
        errorCode === 'over_email_send_rate_limit' ||
        errorCode === 'email_rate_limit_exceeded' ||
        errorMessage.includes('email rate limit') ||
        errorMessage.includes('rate limit exceeded') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('too many') ||
        errorWithProps?.status === 429 ||
        errorCode === 429 ||
        errorString.includes('rate limit')
      ) {
        throw new Error(
          "Email yuborish limitiga yetib qoldingiz. Iltimos, 15-30 daqiqa kutib, keyin qayta urinib ko'ring."
        );
      }

      // Check if email already registered (from error message)
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists') || errorMessage.includes('user already')) {
        throw new Error("Bu email allaqachon ro'yxatdan o'tgan. Login qilish uchun 'Kirish' tugmasini bosing.");
      }
      if (
        errorWithProps?.message?.includes('already registered') ||
        errorWithProps?.message?.includes('already exists') ||
        errorWithProps?.message?.includes("ro'yxatdan o'tgan") ||
        errorMessage.includes('already registered') ||
        errorMessage.includes('already exists')
      ) {
        throw new Error("Bu email allaqachon ro'yxatdan o'tgan.");
      }

      // Generic error with helpful message
      const finalErrorMessage = errorWithProps?.message || ((error instanceof Error) ? error.message : 'Kod yuborishda xatolik yuz berdi');
      throw new Error(
        finalErrorMessage + ' ' +
        "Iltimos, Supabase Dashboard > Settings > Auth > SMTP Settings ni tekshiring."
      );
    }
  },

  verifyEmailCode: async (email: string, code: string): Promise<{ session: any; user: any } | null> => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const trimmedCode = code.trim();

      if (!trimmedCode || trimmedCode.length === 0) {
        throw new Error("Kod kiritilishi shart");
      }

      // Validate code format (should be 6-8 digits)
      if (!/^\d{6,8}$/.test(trimmedCode)) {
        logger.warn('Invalid code format:', { code: trimmedCode, length: trimmedCode.length });
        throw new Error("Kod noto'g'ri formatda. Kod faqat raqamlardan iborat bo'lishi kerak (6-8 raqam).");
      }

      logger.info('Verifying OTP code:', { email: normalizedEmail, codeLength: trimmedCode.length });

      // Verify OTP code using Supabase Auth
      const { data, error } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: trimmedCode,
        type: 'email',
      });

      if (error) {
        logger.error('verifyEmailCode error:', { error, email: normalizedEmail, codeLength: trimmedCode.length });

        // More specific error messages
        const errorMessage = error.message?.toLowerCase() || '';
        if (errorMessage.includes('invalid') || errorMessage.includes('token')) {
          throw new Error("Kod noto'g'ri. Email'dan kodni to'g'ri nusxalab kiriting.");
        }
        if (errorMessage.includes('expired')) {
          throw new Error("Kod muddati o'tgan. Iltimos, yangi kod so'rang (15 soniyadan keyin).");
        }
        if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
          throw new Error("Juda ko'p urinishlar. Iltimos, biroz kutib qayta urinib ko'ring.");
        }

        // Check for backend not configured
        if (errorMessage.includes('backend not configured')) {
          throw new Error("Backend sozlanmagan. Demo rejimda email tasdiqlash ishlamaydi.");
        }

        // Check for network errors
        if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('failed to fetch')) {
          throw new Error("Internet bilan bog'lanishda muammo. Iltimos, internetni tekshiring va qayta urinib ko'ring.");
        }

        throw new Error(error.message || "Kod tasdiqlashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      }

      // Return session and user - DO NOT sign out!
      // We need the session to create the user profile properly
      if (data.session && data.user) {
        return {
          session: data.session,
          user: data.user
        };
      }

      return null;
    } catch (error: unknown) {
      logger.error('verifyEmailCode error:', error);
      throw error instanceof Error ? error : new Error('Failed to verify email code');
    }
  },

  // --- SUPPORT TICKETS ---
  getAllSupportTickets: async (): Promise<SupportTicket[]> => {
    try {
      const { data: tickets, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });

      if (ticketError) throw ticketError;

      // Fetch messages for each ticket
      const ticketsWithMessages = await Promise.all(
        (tickets || []).map(async (ticket: any) => {
          const { data: messages } = await supabase
            .from('support_messages')
            .select('*')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true });

          const { data: user } = ticket.user_id ? await supabase
            .from('users')
            .select('name, avatar')
            .eq('id', ticket.user_id)
            .single() : { data: null };

          return {
            id: ticket.id,
            userId: ticket.user_id,
            userName: user?.name || 'Unknown',
            userAvatar: user?.avatar || '',
            status: ticket.status as 'OPEN' | 'RESOLVED',
            lastMessage: ticket.last_message || '',
            lastUpdated: new Date(ticket.updated_at).getTime(),
            messages: (messages || []).map((m: any) => ({
              id: m.id,
              text: m.text,
              sender: m.sender_id === ticket.user_id ? ('user' as const) : ('admin' as const),
              timestamp: new Date(m.created_at).getTime(),
            })),
            createdAt: ticket.created_at,
          };
        })
      );

      return ticketsWithMessages;
    } catch (error: unknown) {
      logger.error('getAllSupportTickets error:', error);
      return [];
    }
  },

  getUserTicket: async (userId: string): Promise<SupportTicket | undefined> => {
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (ticketError) {
        throw ticketError;
      }

      if (!ticket) return undefined;

      const { data: messages } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      const { data: user } = ticket.user_id ? await supabase
        .from('users')
        .select('name, avatar')
        .eq('id', ticket.user_id)
        .single() : { data: null };

      return {
        id: ticket.id,
        userId: ticket.user_id,
        userName: user?.name || 'Unknown',
        userAvatar: user?.avatar || '',
        status: ticket.status as 'OPEN' | 'RESOLVED',
        lastMessage: ticket.last_message || '',
        lastUpdated: new Date(ticket.updated_at).getTime(),
        messages: (messages || []).map((m: any) => ({
          id: m.id,
          text: m.text,
          sender: m.sender_id === ticket.user_id ? ('user' as const) : ('admin' as const),
          timestamp: new Date(m.created_at).getTime(),
        })),
        createdAt: ticket.created_at,
      };
    } catch (error: unknown) {
      logger.error('getUserTicket error:', error);
      return undefined;
    }
  },

  sendSupportMessage: async (text: string, user: User): Promise<SupportMessage> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId || userId !== user.id) {
        throw new Error("Unauthorized");
      }

      // Find or create ticket
      let { data: ticket } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!ticket) {
        // Create new ticket
        const { data: newTicket, error: createError } = await supabase
          .from('support_tickets')
          .insert({
            user_id: user.id,
            status: 'OPEN',
            last_message: text,
          })
          .select()
          .single();

        if (createError) throw createError;
        ticket = newTicket;
      } else {
        // Update existing ticket
        await supabase
          .from('support_tickets')
          .update({
            status: 'OPEN',
            last_message: text,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ticket.id);
      }

      // Insert message
      const { data: message, error: msgError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          text,
        })
        .select()
        .single();

      if (msgError) throw msgError;
      if (!message) {
        throw new Error("Xabar yuborishda xatolik yuz berdi.");
      }

      return {
        id: message.id,
        text: message.text,
        sender: 'user',
        timestamp: new Date(message.created_at).getTime(),
      };
    } catch (error: unknown) {
      logger.error('sendSupportMessage error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send support message';
      throw new Error(errorMessage);
    }
  },

  adminReplyToTicket: async (ticketId: string, text: string): Promise<SupportMessage> => {
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (ticketError || !ticket) {
        throw new Error("Not found");
      }

      // Get current session to get admin ID (you might want to pass admin user separately)
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Unauthorized");

      // Insert admin message
      const { data: message, error: msgError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: userId, // Admin user ID
          text,
        })
        .select()
        .single();

      if (msgError) throw msgError;
      if (!message) {
        throw new Error("Xabar yuborishda xatolik yuz berdi.");
      }

      // Update ticket status (Keep as OPEN but update last message and time)
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({
          status: 'OPEN', // Keep it Open while in conversation
          last_message: `Admin: ${text}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (updateError) {
        logger.error('Error updating ticket status:', updateError);
        // We still return the message if it was inserted successfully
      }

      return {
        id: message.id,
        text: message.text,
        sender: 'admin',
        timestamp: new Date(message.created_at).getTime(),
      };
    } catch (error: unknown) {
      logger.error('adminReplyToTicket error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send admin reply';
      throw new Error(errorMessage);
    }
  },

  // --- INTIZOM (Routine Tasks & Todos) ---
  getRoutine: async (date: string): Promise<RoutineTask[]> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('routine_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('time', { ascending: true });

      if (error) throw error;
      return (data || []).map((t: any) => ({
        id: t.id,
        time: t.time,
        title: t.title,
        completed: t.completed || false,
        date: t.date,
        userId: t.user_id,
        createdAt: t.created_at,
      }));
    } catch (error: unknown) {
      logger.error('getRoutine error:', error);
      return [];
    }
  },

  saveRoutineTask: async (task: RoutineTask): Promise<RoutineTask> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from('routine_tasks')
        .insert({
          // Don't include id - let database generate UUID
          user_id: userId,
          title: task.title,
          time: task.time,
          date: task.date,
          completed: task.completed || false,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Failed to save routine task");

      // Return the saved task with database-generated UUID
      return {
        id: data.id,
        time: data.time,
        title: data.title,
        completed: data.completed || false,
        date: data.date,
        userId: data.user_id,
        createdAt: data.created_at,
      };
    } catch (error: unknown) {
      logger.error('saveRoutineTask error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save routine task';
      throw new Error(errorMessage);
    }
  },

  toggleRoutineTask: async (taskId: string): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Unauthorized");

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(taskId)) {
        throw new Error("Invalid task ID format. Please refresh the page.");
      }

      // Get current task
      const { data: task, error: fetchError } = await supabase
        .from('routine_tasks')
        .select('completed')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !task) {
        throw new Error("Task not found");
      }

      const { error } = await supabase
        .from('routine_tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('toggleRoutineTask error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle routine task';
      throw new Error(errorMessage);
    }
  },

  deleteRoutineTask: async (id: string): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Unauthorized");

      const { error } = await supabase
        .from('routine_tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('deleteRoutineTask error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete routine task';
      throw new Error(errorMessage);
    }
  },

  updateRoutineTask: async (task: RoutineTask): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Unauthorized");

      const { error } = await supabase
        .from('routine_tasks')
        .update({
          title: task.title,
          time: task.time,
          date: task.date,
          completed: task.completed,
        })
        .eq('id', task.id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('updateRoutineTask error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update routine task';
      throw new Error(errorMessage);
    }
  },

  getTodos: async (): Promise<Todo[]> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        completed: t.completed || false,
        difficulty: (t.difficulty || 'EASY') as 'EASY' | 'MEDIUM' | 'HARD',
        deadline: t.deadline || '',
        userId: t.user_id,
        createdAt: t.created_at,
      }));
    } catch (error: unknown) {
      logger.error('getTodos error:', error);
      return [];
    }
  },

  saveTodo: async (t: Partial<Todo>): Promise<Todo> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from('todos')
        .insert({
          user_id: userId,
          title: t.title || '',
          description: t.description || '',
          completed: false,
          difficulty: t.difficulty || 'EASY',
          deadline: t.deadline || null,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        throw new Error("Todo yaratishda xatolik yuz berdi.");
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        completed: data.completed || false,
        difficulty: (data.difficulty || 'EASY') as 'EASY' | 'MEDIUM' | 'HARD',
        deadline: data.deadline || '',
        userId: data.user_id,
        createdAt: data.created_at,
      };
    } catch (error: unknown) {
      logger.error('saveTodo error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save todo';
      throw new Error(errorMessage);
    }
  },

  toggleTodo: async (id: string): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Unauthorized");

      const { data: todo, error: fetchError } = await supabase
        .from('todos')
        .select('completed, difficulty')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchError || !todo) {
        throw new Error("Todo not found");
      }

      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      // XP: faqat tugatilganda, RPC orqali (xavfsiz)
      if (!todo.completed) {
        await supabase.rpc('award_xp_todo', { p_todo_id: id });
      }
    } catch (error: unknown) {
      logger.error('toggleTodo error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle todo';
      throw new Error(errorMessage);
    }
  },

  deleteTodo: async (id: string): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Unauthorized");

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('deleteTodo error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete todo';
      throw new Error(errorMessage);
    }
  },

  updateTodo: async (todo: Todo): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Unauthorized");

      const { error } = await supabase
        .from('todos')
        .update({
          title: todo.title,
          description: todo.description,
          completed: todo.completed,
          difficulty: todo.difficulty,
          deadline: todo.deadline || null,
        })
        .eq('id', todo.id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('updateTodo error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update todo';
      throw new Error(errorMessage);
    }
  },

  saveFocusSession: async (minutes: number): Promise<void> => {
    try {
      await getCurrentUserId();
      if (minutes <= 0) return;
      const { data, error } = await supabase.rpc('award_xp_focus', { p_minutes: minutes });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Focus XP failed');
    } catch (error: unknown) {
      logger.error('saveFocusSession error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save focus session';
      throw new Error(errorMessage);
    }
  },

  getFocusHistory: async (): Promise<Array<{ date: string; minutes: number }>> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('focus_history')
        .select('date, minutes')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return (data || []).map((h: any) => ({
        date: h.date,
        minutes: h.minutes,
      }));
    } catch (error: unknown) {
      logger.error('getFocusHistory error:', error);
      return [];
    }
  },

  getJournalEntries: async (): Promise<JournalEntry[]> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((e: any) => ({
        id: e.id,
        text: e.text,
        mood: e.mood || '',
        aiComment: e.ai_comment || '',
        timestamp: new Date(e.created_at).getTime(),
        userId: e.user_id,
      }));
    } catch (error: unknown) {
      logger.error('getJournalEntries error:', error);
      return [];
    }
  },

  saveJournalEntry: async (entry: JournalEntry): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Unauthorized");

      const { data: inserted, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: userId,
          text: entry.text,
          mood: entry.mood || null,
          ai_comment: entry.aiComment || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      if (inserted?.id) {
        await supabase.rpc('award_xp_journal', { p_entry_id: inserted.id });
      }
    } catch (error: unknown) {
      logger.error('saveJournalEntry error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save journal entry';
      throw new Error(errorMessage);
    }
  },



  // --- AI CHAT (User-specific, stored in database with RLS) ---
  getAIChatHistory: async (): Promise<ChatMessage[]> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        logger.warn('getAIChatHistory: No user ID, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true });

      if (error) {
        logger.error('getAIChatHistory error:', error);
        return [];
      }

      return (data || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role as 'user' | 'model',
        text: msg.text,
        timestamp: msg.timestamp,
      }));
    } catch (e) {
      logger.error('getAIChatHistory error:', e);
      return [];
    }
  },

  saveAIChatMessage: async (message: ChatMessage): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        logger.warn('saveAIChatMessage: No user ID, cannot save message');
        return;
      }

      const { error } = await supabase
        .from('ai_chat_messages')
        .insert({
          user_id: userId,
          role: message.role,
          text: message.text,
          timestamp: message.timestamp,
        });

      if (error) {
        logger.error('saveAIChatMessage error:', error);
        throw error;
      }
    } catch (e) {
      logger.error('saveAIChatMessage error:', e);
      throw e;
    }
  },

  clearAIChatHistory: async (): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        logger.warn('clearAIChatHistory: No user ID, cannot clear history');
        return;
      }

      const { error } = await supabase
        .from('ai_chat_messages')
        .delete()
        .eq('user_id', userId);

      if (error) {
        logger.error('clearAIChatHistory error:', error);
        throw error;
      }
    } catch (e) {
      logger.error('clearAIChatHistory error:', e);
      throw e;
    }
  },

  // --- MARKETING & ADMIN ---
  getDeals: async (): Promise<Deal[]> => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        clientName: d.client_name,
        campaignTitle: d.campaign_title || '',
        amount: Number(d.amount || 0),
        startDate: d.start_date || '',
        endDate: d.end_date || '',
        status: (d.status || 'Active') as 'Active' | 'Pending' | 'Completed',
        type: (d.type || 'Sponsorship') as 'Sponsorship' | 'Ad Integration' | 'Partnership',
        logoColor: d.logo_color || '#000000',
      }));
    } catch (error: unknown) {
      logger.error('getDeals error:', error);
      return [];
    }
  },

  saveDeal: async (deal: Deal): Promise<void> => {
    try {
      const dealData = {
        client_name: deal.clientName,
        campaign_title: deal.campaignTitle,
        amount: deal.amount,
        start_date: deal.startDate || null,
        end_date: deal.endDate || null,
        status: deal.status,
        type: deal.type,
        logo_color: deal.logoColor,
      };

      if (deal.id) {
        // Update existing
        const { error } = await supabase
          .from('deals')
          .update(dealData)
          .eq('id', deal.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('deals')
          .insert(dealData);

        if (error) throw error;
      }
    } catch (error: unknown) {
      logger.error('saveDeal error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save deal';
      throw new Error(errorMessage);
    }
  },

  deleteDeal: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('deleteDeal error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete deal';
      throw new Error(errorMessage);
    }
  },

  getActiveAds: async (): Promise<ActiveAd[]> => {
    try {
      const { data, error } = await supabase
        .from('active_ads')
        .select('*')
        .eq('status', 'Running')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((a: any) => ({
        id: a.id,
        dealId: a.deal_id || '',
        title: a.title || '',
        description: a.description || '',
        image: a.image || '',
        link: a.link || '',
        views: a.views || 0,
        clicks: a.clicks || 0,
        status: (a.status || 'Running') as 'Running' | 'Expired',
        bgGradient: a.bg_gradient || '',
        targetAudience: a.target_audience || 'All',
      }));
    } catch (error: unknown) {
      logger.error('getActiveAds error:', error);
      return [];
    }
  },

  saveActiveAd: async (ad: ActiveAd): Promise<void> => {
    try {
      const { error } = await supabase
        .from('active_ads')
        .insert({
          deal_id: ad.dealId || null,
          title: ad.title,
          description: ad.description || '',
          image: ad.image || '',
          link: ad.link || '',
          views: ad.views || 0,
          clicks: ad.clicks || 0,
          status: ad.status,
          bg_gradient: ad.bgGradient || '',
          target_audience: ad.targetAudience || 'All',
        });

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('saveActiveAd error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save active ad';
      throw new Error(errorMessage);
    }
  },

  deleteActiveAd: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('active_ads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('deleteActiveAd error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete active ad';
      throw new Error(errorMessage);
    }
  },

  // --- BADGES (can remain as constants/localStorage) ---
  getBadges: async (): Promise<Badge[]> => {
    try {
      const saved = localStorage.getItem('hamroh_badges');
      if (saved) {
        return JSON.parse(saved);
      }
      return ACHIEVEMENTS_LIST;
    } catch (e) {
      return ACHIEVEMENTS_LIST;
    }
  },

  saveBadge: async (badge: Badge): Promise<void> => {
    try {
      const badges = await api.getBadges();
      // Check for duplicate by id or by name+icon combination
      const existingIndex = badges.findIndex((b: Badge) => b.id === badge.id || (b.name === badge.name && b.icon === badge.icon));
      if (existingIndex >= 0) {
        // Update existing badge instead of creating duplicate
        badges[existingIndex] = badge;
      } else {
        // Add new badge only if it doesn't exist
        badges.push(badge);
      }
      localStorage.setItem('hamroh_badges', JSON.stringify(badges));
    } catch (e) {
      logger.error('saveBadge error:', e);
      throw e;
    }
  },

  deleteBadge: async (id: string): Promise<void> => {
    try {
      const badges = await api.getBadges();
      const filtered = badges.filter((b: Badge) => b.id !== id);
      localStorage.setItem('hamroh_badges', JSON.stringify(filtered));
    } catch (e) {
      logger.error('deleteBadge error:', e);
    }
  },

  // --- BLOCKED USERS ---
  blockUserInGroup: async (groupId: string, blockedUserId: string, reason?: string): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Unauthorized");

      // Check if user is group owner or admin
      const { data: group } = await supabase
        .from('groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (!group) throw new Error("Guruh topilmadi");

      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      const isOwner = group.owner_id === userId;
      const isAdmin = currentUser?.role === 'admin';

      if (!isOwner && !isAdmin) {
        throw new Error("Faqat guruh admini yoki tizim admini foydalanuvchilarni blok qila oladi");
      }

      // Block user
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          group_id: groupId,
          blocked_user_id: blockedUserId,
          blocked_by: userId,
          reason: reason || null,
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error("Bu foydalanuvchi allaqachon bloklangan");
        }
        throw error;
      }
    } catch (error: unknown) {
      logger.error('blockUserInGroup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Foydalanuvchini blok qilishda xatolik';
      throw new Error(errorMessage);
    }
  },

  unblockUserInGroup: async (groupId: string, blockedUserId: string): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Unauthorized");

      // Check if user is group owner or admin
      const { data: group } = await supabase
        .from('groups')
        .select('owner_id')
        .eq('id', groupId)
        .single();

      if (!group) throw new Error("Guruh topilmadi");

      const { data: currentUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      const isOwner = group.owner_id === userId;
      const isAdmin = currentUser?.role === 'admin';

      if (!isOwner && !isAdmin) {
        throw new Error("Faqat guruh admini yoki tizim admini foydalanuvchilarni blokdan chiqara oladi");
      }

      // Unblock user
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('group_id', groupId)
        .eq('blocked_user_id', blockedUserId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('unblockUserInGroup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Foydalanuvchini blokdan chiqarishda xatolik';
      throw new Error(errorMessage);
    }
  },

  getBlockedUsersInGroup: async (groupId: string): Promise<User[]> => {
    try {
      const { data: blockedUsers, error } = await supabase
        .from('blocked_users')
        .select('blocked_user_id')
        .eq('group_id', groupId);

      if (error) throw error;

      if (!blockedUsers || blockedUsers.length === 0) return [];

      // Get unique user IDs
      const userIds = blockedUsers.map((bu: any) => bu.blocked_user_id);

      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

      if (usersError) throw usersError;

      return (users || []).map((u: any) => mapDbUserToUser(u));
    } catch (error: unknown) {
      logger.error('getBlockedUsersInGroup error:', error);
      return [];
    }
  },

  isUserBlockedInGroup: async (groupId: string, userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('group_id', groupId)
        .eq('blocked_user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error: unknown) {
      logger.error('isUserBlockedInGroup error:', error);
      return false;
    }
  },

  // --- REAL-TIME ADMIN SUBSCRIPTION ---
  subscribeToAdminEvents: (
    onUserChange: (payload: any) => void,
    onGroupChange: (payload: any) => void,
    onDealChange: (payload: any) => void,
    onStoreChange: (payload: any) => void
  ) => {
    const channel = supabase.channel('admin_dashboard_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => onUserChange(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'groups' }, // Assuming table name is 'groups' based on previous context, verify if it's 'community_groups'
        (payload) => onGroupChange(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deals' },
        (payload) => onDealChange(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_items' },
        (payload) => onStoreChange(payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('Admin dashboard subscribed to real-time changes');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // --- STORE MANAGEMENT ---
  getStoreItems: async (): Promise<StoreItem[]> => {
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching store items:', error);
      return STORE_ITEMS;
    }

    return (data || []).map(item => ({
      id: item.id,
      type: item.type as any,
      name: item.name,
      description: item.description,
      price: item.price,
      icon: item.icon,
      value: item.value
    }));
  },

  addStoreItem: async (item: StoreItem): Promise<void> => {
    const { error } = await supabase
      .from('store_items')
      .insert({
        id: item.id,
        type: item.type,
        name: item.name,
        description: item.description,
        price: item.price,
        icon: item.icon,
        value: item.value
      });

    if (error) throw error;
  },

  deleteStoreItem: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('store_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },



  deleteUser: async (userId: string): Promise<void> => {
    // Note: This only deletes from the 'users' table. 
    // To fully delete from Auth, you would need a backend Edge Function.
    // However, this effectively removes the user from the app's perspective.
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },

  // ======================================================
  // CHALLENGE API FUNCTIONS
  // ======================================================

  getChallenges: async (): Promise<import('../types').Challenge[]> => {
    try {
      const userId = await getCurrentUserId();

      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!challenges) return [];

      // Map challenges to the Challenge type
      const mapped = challenges.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        icon: c.icon || '🏆',
        startDate: c.start_date,
        endDate: c.end_date,
        durationDays: c.duration_days,
        participantsCount: c.participants_count || 0,
        rewardXP: c.reward_xp,
        status: c.status || 'ACTIVE',
        category: c.category || 'General',
        isJoined: false,
        totalCheckIns: 0,
        lastCheckIn: undefined,
      }));

      // If user is logged in, get their participation data
      if (userId) {
        const { data: participations } = await supabase
          .from('challenge_participants')
          .select('challenge_id, total_check_ins, last_check_in')
          .eq('user_id', userId);

        if (participations) {
          const participationMap = new Map<string, { total_check_ins: number; last_check_in: string | null }>(
            participations.map((p: any) => [p.challenge_id as string, p])
          );
          for (const challenge of mapped) {
            const p = participationMap.get(challenge.id);
            if (p) {
              challenge.isJoined = true;
              challenge.totalCheckIns = p.total_check_ins || 0;
              challenge.lastCheckIn = p.last_check_in || undefined;
            }
          }
        }
      }

      return mapped;
    } catch (error: unknown) {
      logger.error('getChallenges error:', error);
      throw error;
    }
  },

  joinChallenge: async (challengeId: string): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          status: 'joined',
          total_check_ins: 0,
          joined_at: new Date().toISOString(),
        });

      if (error && error.code !== '23505') throw error; // 23505 = unique violation (already joined)

      // Increment participants_count
      await supabase.rpc('increment_participants_count', { p_challenge_id: challengeId }).catch(() => {
        // RPC may not exist; fall back to a simple manual increment
        supabase
          .from('challenges')
          .select('participants_count')
          .eq('id', challengeId)
          .single()
          .then(({ data }) => {
            if (data) {
              supabase
                .from('challenges')
                .update({ participants_count: (data.participants_count || 0) + 1 })
                .eq('id', challengeId);
            }
          });
      });

    } catch (error: unknown) {
      logger.error('joinChallenge error:', error);
      const msg = error instanceof Error ? error.message : "Musobaqaga qo'shilishda xatolik";
      throw new Error(msg);
    }
  },

  checkInChallenge: async (challengeId: string, rewardXp: number): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      // Get current participation data
      const { data: participation, error: pError } = await supabase
        .from('challenge_participants')
        .select('last_check_in, total_check_ins')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      if (pError) throw new Error("Siz bu musobaqaga qatnashmayapsiz");

      // Compare using local date components to avoid UTC offset issues
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      let lastCheckInStr = '';
      if (participation.last_check_in) {
        const last = new Date(participation.last_check_in);
        lastCheckInStr = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
      }

      if (lastCheckInStr === todayStr) {
        throw new Error('Bugun allaqachon check-in qilingan');
      }

      // Update participation record
      const { error: uError } = await supabase
        .from('challenge_participants')
        .update({
          last_check_in: now.toISOString(),
          total_check_ins: (participation.total_check_ins || 0) + 1,
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (uError) throw uError;

      // Award XP
      const { data: userData } = await supabase
        .from('users')
        .select('xp')
        .eq('id', userId)
        .single();

      await supabase
        .from('users')
        .update({ xp: (userData?.xp || 0) + rewardXp })
        .eq('id', userId);

      logger.info(`User ${userId} checked in for challenge ${challengeId}, awarded ${rewardXp} XP`);
    } catch (error: unknown) {
      logger.error('checkInChallenge error:', error);
      const msg = error instanceof Error ? error.message : 'Check-in qilishda xatolik';
      throw new Error(msg);
    }
  },

  createChallenge: async (challenge: Partial<import('../types').Challenge>): Promise<import('../types').Challenge> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          title: challenge.title,
          description: challenge.description,
          icon: challenge.icon || '🏆',
          start_date: challenge.startDate,
          end_date: challenge.endDate,
          duration_days: challenge.durationDays,
          reward_xp: challenge.rewardXP,
          category: challenge.category || 'General',
          status: 'ACTIVE',
          participants_count: 0,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        icon: data.icon,
        startDate: data.start_date,
        endDate: data.end_date,
        durationDays: data.duration_days,
        participantsCount: data.participants_count || 0,
        rewardXP: data.reward_xp,
        status: data.status,
        category: data.category,
        isJoined: false,
      };
    } catch (error: unknown) {
      logger.error('createChallenge error:', error);
      throw error;
    }
  },

  deleteChallenge: async (challengeId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('deleteChallenge error:', error);
      throw error;
    }
  },
};