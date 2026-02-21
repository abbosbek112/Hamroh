import type { User, GroupMessage, CommunityGroup } from '../../types';
import { logger } from '../../utils/logger';
import { checkSpamAndProfanity } from '../../utils/validation';
import { supabase } from '../supabaseClient';
import { mapDbUserToUser, mapDbMessageToGroupMessage, mapDbGroupToCommunityGroup } from './mappers';
import { getCurrentUserId } from './session';

export const groupsApi = {
  getLeaderboard: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('xp', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []).map(mapDbUserToUser);
    } catch (error: unknown) {
      logger.error('getLeaderboard error:', error);
      return [];
    }
  },

  getGroups: async (): Promise<CommunityGroup[]> => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDbGroupToCommunityGroup);
    } catch (error: unknown) {
      logger.error('getGroups error:', error);
      return [];
    }
  },

  getUserGroups: async (userId: string): Promise<CommunityGroup[]> => {
    try {
      const { data: allGroups, error: fetchError } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const filtered = (allGroups || []).filter((g: any) => {
        const memberIds = Array.isArray(g.member_ids) ? g.member_ids : [];
        return memberIds.includes(userId);
      });

      return filtered.map(mapDbGroupToCommunityGroup);
    } catch (error: unknown) {
      logger.error('getUserGroups error:', error);
      return [];
    }
  },

  createGroup: async (name: string, description: string, category: string): Promise<CommunityGroup> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      const { data, error } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          category,
          owner_id: userId,
          members_count: 1,
          member_ids: [userId],
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        throw new Error("Guruh yaratishda xatolik yuz berdi.");
      }

      return mapDbGroupToCommunityGroup(data);
    } catch (error: unknown) {
      logger.error('createGroup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create group';
      throw new Error(errorMessage);
    }
  },

  joinGroup: async (groupId: string): Promise<CommunityGroup> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (fetchError) throw fetchError;
      if (!group) throw new Error('Group not found');

      const memberIds: string[] = Array.isArray(group.member_ids) ? group.member_ids : [];
      const isMember = memberIds.some(id => id === userId || id.toString() === userId.toString());

      if (isMember) {
        return mapDbGroupToCommunityGroup(group);
      }

      const updatedMemberIds = [...memberIds, userId];

      const { data, error } = await supabase
        .from('groups')
        .update({
          member_ids: updatedMemberIds,
          members_count: updatedMemberIds.length,
        })
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        throw new Error("Guruhga qo'shilishda xatolik yuz berdi.");
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      return mapDbGroupToCommunityGroup(data);
    } catch (error: unknown) {
      logger.error('joinGroup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join group';
      throw new Error(errorMessage);
    }
  },

  leaveGroup: async (groupId: string): Promise<CommunityGroup> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (fetchError || !group) {
        throw new Error('Guruh topilmadi.');
      }

      const memberIds: string[] = Array.isArray(group.member_ids) ? group.member_ids : [];
      const updatedMemberIds = memberIds.filter(id => id !== userId);

      const { data: updated, error } = await supabase
        .from('groups')
        .update({
          member_ids: updatedMemberIds,
          members_count: updatedMemberIds.length,
        })
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      if (!updated) {
        throw new Error("Guruhdan chiqishda xatolik yuz berdi.");
      }

      return mapDbGroupToCommunityGroup(updated);
    } catch (error: unknown) {
      logger.error('leaveGroup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave group';
      throw new Error(errorMessage);
    }
  },

  removeGroupMember: async (groupId: string, userId: string): Promise<CommunityGroup> => {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) throw new Error('Unauthorized');

      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (fetchError || !group) {
        throw new Error('Guruh topilmadi.');
      }

      if (group.owner_id !== currentUserId) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUserId)
          .single();

        if (currentUser?.role !== 'admin') {
          throw new Error("Faqat guruh admini a'zolarni o'chira oladi.");
        }
      }

      const memberIds: string[] = Array.isArray(group.member_ids) ? group.member_ids : [];
      const updatedMemberIds = memberIds.filter(id => id !== userId);

      const { data: updated, error } = await supabase
        .from('groups')
        .update({
          member_ids: updatedMemberIds,
          members_count: updatedMemberIds.length,
        })
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;
      if (!updated) {
        throw new Error("A'zoni o'chirishda xatolik yuz berdi.");
      }

      return mapDbGroupToCommunityGroup(updated);
    } catch (error: unknown) {
      logger.error('removeGroupMember error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove member';
      throw new Error(errorMessage);
    }
  },

  getGroupMembers: async (groupId: string): Promise<User[]> => {
    try {
      const { data: group, error: fetchError } = await supabase
        .from('groups')
        .select('member_ids')
        .eq('id', groupId)
        .single();

      if (fetchError || !group) return [];

      const memberIds: string[] = Array.isArray(group.member_ids) ? group.member_ids : [];
      if (memberIds.length === 0) return [];

      const { data, error } = await supabase.from('users').select('*').in('id', memberIds);

      if (error) throw error;
      return (data || []).map(mapDbUserToUser);
    } catch (error: unknown) {
      logger.error('getGroupMembers error:', error);
      return [];
    }
  },

  getGroupMessages: async (groupId: string): Promise<GroupMessage[]> => {
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        const { data: group } = await supabase
          .from('groups')
          .select('member_ids, owner_id')
          .eq('id', groupId)
          .single();

        if (group) {
          const memberIds: string[] = Array.isArray(group.member_ids) ? group.member_ids : [];
          const isMember =
            memberIds.some(id => id === userId || id.toString() === userId.toString()) ||
            group.owner_id === userId;

          if (!isMember) {
            logger.warn('User is not a member of the group, but trying to fetch messages');
          }
        }
      }

      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, sender_id, group_id, receiver_id, text, read_at, reactions, reply_to, is_system, created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (msgError) {
        logger.error('getGroupMessages error:', msgError);
        if ((msgError as any).code === '42501' || msgError.message?.includes('permission')) {
          throw new Error("Siz bu guruhning a'zosi emassiz yoki xabarlarni ko'rish huquqingiz yo'q.");
        }
        throw msgError;
      }

      const userIds = new Set<string>();
      (messages || []).forEach((m: any) => {
        if (m.sender_id) userIds.add(m.sender_id);
      });

      if (userIds.size === 0) {
        return [];
      }

      const { data: users, error: userError } = await supabase
        .from('users')
        .select('name, avatar, id')
        .in('id', Array.from(userIds));

      if (userError) throw userError;

      const usersMap = new Map<string, User>();
      (users || []).forEach((u: any) => {
        usersMap.set(u.id, mapDbUserToUser(u));
      });

      return (messages || []).map((m: any) => mapDbMessageToGroupMessage(m, usersMap));
    } catch (error: unknown) {
      logger.error('getGroupMessages error:', error);
      return [];
    }
  },

  sendGroupMessage: async (
    groupId: string,
    text: string,
    user: User,
    replyTo?: GroupMessage['replyTo']
  ): Promise<GroupMessage> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId || userId !== user.id) {
        throw new Error('Unauthorized');
      }

      const spamCheck = checkSpamAndProfanity(text);
      if (spamCheck.isSpam) {
        try {
          await supabase.from('spam_logs').insert({
            user_id: userId,
            group_id: groupId,
            message_text: text.substring(0, 200),
            reason: spamCheck.reason || 'Spam detected',
            violation_type: 'profanity',
          });
        } catch (logError) {
          logger.error('Failed to log spam violation:', logError);
        }

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: recentSpam } = await supabase
          .from('spam_logs')
          .select('id')
          .eq('user_id', userId)
          .gte('created_at', oneHourAgo);

        if (recentSpam && recentSpam.length >= 3) {
          const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          await supabase
            .from('blocked_users')
            .upsert(
              {
                group_id: groupId,
                blocked_user_id: userId,
                reason: 'Avtomatik bloklash: 3+ spam xabar',
                blocked_until: blockUntil,
                blocked_by: userId,
              },
              {
                onConflict: 'group_id,blocked_user_id',
              }
            );

          throw new Error('Spam xabar tufayli 1 kunlik bloklangansiz.');
        }

        throw new Error(spamCheck.reason || 'Spam xabar tufayli xabar yuborish mumkin emas.');
      }

      const { data: blockedCheck } = await supabase
        .from('blocked_users')
        .select('id, blocked_until')
        .eq('group_id', groupId)
        .eq('blocked_user_id', userId)
        .maybeSingle();

      if (blockedCheck) {
        if (blockedCheck.blocked_until && new Date(blockedCheck.blocked_until) > new Date()) {
          throw new Error("Siz ushbu guruhda bloklangansiz. Xabar yozib bo'lmaydi.");
        } else if (blockedCheck.blocked_until) {
          await supabase
            .from('blocked_users')
            .delete()
            .eq('group_id', groupId)
            .eq('blocked_user_id', userId);
        } else {
          throw new Error("Siz ushbu guruhda bloklangansiz. Xabar yozib bo'lmaydi.");
        }
      }

      let autoJoinRequired = false;
      let autoJoinSucceeded = false;
      try {
        const { data: group } = await supabase
          .from('groups')
          .select('member_ids, owner_id')
          .eq('id', groupId)
          .single();

        if (group) {
          const memberIds: string[] = Array.isArray(group.member_ids) ? group.member_ids : [];
          const isMember =
            memberIds.some(id => id === userId || id.toString() === userId.toString()) ||
            group.owner_id === userId;

          if (!isMember) {
            autoJoinRequired = true;
            // Call joinGroup from the same module
            await groupsApi.joinGroup(groupId);
            await new Promise(resolve => setTimeout(resolve, 500));
            autoJoinSucceeded = true;
          }
        }
      } catch (autoJoinError) {
        logger.warn('Auto-join check failed, continuing with message:', autoJoinError);
        if (autoJoinRequired && !autoJoinSucceeded) {
          throw new Error("Guruhga qo'shilishda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
        }
      }

      const messageData: any = {
        sender_id: user.id,
        group_id: groupId,
        receiver_id: null,
        text: text,
        reactions: {},
        reply_to: replyTo
          ? {
              id: replyTo.id,
              text: replyTo.text,
              sender: replyTo.userName,
              userName: replyTo.userName,
              userId: replyTo.userId,
            }
          : null,
        is_system: false,
      };

      if (!text || text.trim() === '') {
        throw new Error("Xabar matni bo'sh bo'lishi mumkin emas");
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select('id, sender_id, group_id, receiver_id, text, read_at, reactions, reply_to, is_system, created_at')
        .single();

      if (error) {
        logger.error('Send message insert error:', error);
        throw error;
      }

      if (!data) {
        throw new Error("Xabar yuborishda xatolik yuz berdi.");
      }

      let mappedReplyTo = undefined;
      if (data.reply_to && typeof data.reply_to === 'object' && (data.reply_to as any).id) {
        mappedReplyTo = {
          id: (data.reply_to as any).id,
          text: (data.reply_to as any).text || '',
          userName: (data.reply_to as any).userName || (data.reply_to as any).sender || 'Unknown',
          userId: (data.reply_to as any).userId || undefined,
        };
      }

      return {
        id: data.id,
        text: data.text || text,
        timestamp: new Date(data.created_at).getTime(),
        userId: data.sender_id,
        userName: user.name,
        userAvatar: user.avatar,
        groupId: data.group_id || undefined,
        reactions: data.reactions || {},
        replyTo: mappedReplyTo,
        isSystem: data.is_system || false,
      };
    } catch (error: unknown) {
      logger.error('sendGroupMessage error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      throw new Error(errorMessage);
    }
  },
};
