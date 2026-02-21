import type { User } from '../../types';
import { logger } from '../../utils/logger';
import { supabase } from '../supabaseClient';
import { mapDbUserToUser } from './mappers';
import { getCurrentUserId } from './session';

export const usersApi = {
  updateUser: async (user: User): Promise<User> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId || userId !== user.id) {
        throw new Error('Unauthorized');
      }

      const allowedData = {
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        phone_number: user.phoneNumber,
        age: user.age,
        theme: user.theme,
        language: user.language,
        selected_badge_id: user.selectedBadgeId,
        identity: user.identity,
        routines: user.routines,
      };

      const { data, error } = await supabase.from('users').update(allowedData).eq('id', user.id).select().single();

      if (error) throw error;
      if (!data) throw new Error("Foydalanuvchi yangilanishda xatolik yuz berdi.");

      return mapDbUserToUser(data);
    } catch (error: unknown) {
      logger.error('updateUser error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      throw new Error(errorMessage);
    }
  },

  getUserById: async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

      if (error) {
        if ((error as any).code === 'PGRST116') return null;
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

      const cleanUsername = username.trim().replace(/^@/, '');

      const { data, error } = await supabase.from('users').select('*').eq('username', cleanUsername).maybeSingle();

      if (error) {
        if ((error as any).code === 'PGRST116') return null;
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
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapDbUserToUser);
    } catch (error: unknown) {
      logger.error('getAllUsers error:', error);
      return [];
    }
  },
};

