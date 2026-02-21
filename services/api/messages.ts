import type { User, GroupMessage } from '../../types';
import { logger } from '../../utils/logger';
import { supabase } from '../supabaseClient';
import { mapDbUserToUser, mapDbMessageToGroupMessage } from './mappers';
import { getCurrentUserId } from './session';

export const messagesApi = {
  getDirectMessages: async (currentUserId: string, peerId: string): Promise<GroupMessage[]> => {
    try {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('id, sender_id, group_id, receiver_id, text, read_at, reactions, reply_to, is_system, created_at')
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${currentUserId})`
        )
        .is('group_id', null)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      const userIds = new Set<string>();
      (messages || []).forEach((m: any) => {
        if (m.sender_id) userIds.add(m.sender_id);
        if (m.receiver_id) userIds.add(m.receiver_id);
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
      logger.error('getDirectMessages error:', error);
      return [];
    }
  },

  sendDirectMessage: async (
    text: string,
    sender: User,
    receiverId: string,
    replyTo?: GroupMessage['replyTo']
  ): Promise<GroupMessage> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId || userId !== sender.id) {
        throw new Error('Unauthorized');
      }

      if (sender.id === receiverId) {
        throw new Error("O'zingizga xabar yozib bo'lmaydi");
      }

      if (!text || text.trim() === '') {
        throw new Error("Xabar matni bo'sh bo'lishi mumkin emas");
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: sender.id,
          group_id: null,
          receiver_id: receiverId,
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
        })
        .select('id, sender_id, group_id, receiver_id, text, read_at, reactions, reply_to, is_system, created_at')
        .single();

      if (error) throw error;
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
        userName: sender.name,
        userAvatar: sender.avatar,
        receiverId: data.receiver_id || undefined,
        readAt: data.read_at ? new Date(data.read_at).getTime() : undefined,
        reactions: data.reactions || {},
        replyTo: mappedReplyTo,
        isSystem: data.is_system || false,
      };
    } catch (error: unknown) {
      logger.error('sendDirectMessage error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      throw new Error(errorMessage);
    }
  },

  markDirectMessagesRead: async (peerId: string): Promise<number | null> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from('messages')
        .update({ read_at: nowIso })
        .eq('receiver_id', userId)
        .eq('sender_id', peerId)
        .is('group_id', null)
        .is('read_at', null);

      if (error) throw error;
      return new Date(nowIso).getTime();
    } catch (error: unknown) {
      logger.error('markDirectMessagesRead error:', error);
      return null;
    }
  },

  getMessageById: async (messageId: string): Promise<GroupMessage | null> => {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .select('id, sender_id, group_id, receiver_id, text, read_at, reactions, reply_to, is_system, created_at')
        .eq('id', messageId)
        .single();

      if (error || !message) return null;

      const { data: sender } = await supabase.from('users').select('id, name, avatar').eq('id', message.sender_id).single();

      const usersMap = new Map<string, User>();
      if (sender) {
        usersMap.set(sender.id, mapDbUserToUser(sender));
      }

      return mapDbMessageToGroupMessage(message, usersMap);
    } catch (error: unknown) {
      logger.error('getMessageById error:', error);
      return null;
    }
  },

  getPinnedMessage: async (groupId: string): Promise<GroupMessage | null> => {
    try {
      const { data: group, error } = await supabase
        .from('groups')
        .select('pinned_message_id')
        .eq('id', groupId)
        .single();

      if (error || !group?.pinned_message_id) return null;
      return await messagesApi.getMessageById(group.pinned_message_id);
    } catch (error: unknown) {
      logger.error('getPinnedMessage error:', error);
      return null;
    }
  },

  setPinnedMessage: async (groupId: string, messageId: string | null): Promise<string | null> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      const { data, error } = await supabase
        .from('groups')
        .update({ pinned_message_id: messageId })
        .eq('id', groupId)
        .select('pinned_message_id')
        .single();

      if (error) throw error;
      return data?.pinned_message_id || null;
    } catch (error: unknown) {
      logger.error('setPinnedMessage error:', error);
      throw error;
    }
  },

  getRecentDirectChats: async (currentUserId: string): Promise<string[]> => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, created_at')
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.neq.${currentUserId}),and(receiver_id.eq.${currentUserId},sender_id.neq.${currentUserId})`
        )
        .is('group_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const peerMap = new Map<string, number>();
      (messages || []).forEach((m: any) => {
        const peerId = m.sender_id === currentUserId ? m.receiver_id : m.sender_id;
        if (peerId && peerId !== currentUserId) {
          const messageTime = new Date(m.created_at).getTime();
          const existingTime = peerMap.get(peerId) || 0;
          if (messageTime > existingTime) {
            peerMap.set(peerId, messageTime);
          }
        }
      });

      return Array.from(peerMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([userId]) => userId);
    } catch (error: unknown) {
      logger.error('getRecentDirectChats error:', error);
      return [];
    }
  },

  getDirectMessagesForUnreadCount: async (currentUserId: string): Promise<GroupMessage[]> => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, text, created_at')
        .eq('receiver_id', currentUserId)
        .is('group_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!messages || messages.length === 0) {
        return [];
      }

      const senderIds = new Set<string>();
      (messages || []).forEach((m: any) => {
        if (m.sender_id && m.sender_id !== currentUserId) {
          senderIds.add(m.sender_id);
        }
      });

      if (senderIds.size === 0) {
        return [];
      }

      const { data: users, error: userError } = await supabase
        .from('users')
        .select('name, avatar, id')
        .in('id', Array.from(senderIds));

      if (userError) throw userError;

      const usersMap = new Map<string, User>();
      (users || []).forEach((u: any) => {
        usersMap.set(u.id, mapDbUserToUser(u));
      });

      return (messages || []).map((m: any) => {
        const sender = usersMap.get(m.sender_id);
        return {
          id: m.id,
          text: m.text,
          timestamp: new Date(m.created_at).getTime(),
          userId: m.sender_id,
          userName: sender?.name || 'Unknown',
          userAvatar: sender?.avatar || '',
          receiverId: m.receiver_id || undefined,
          isSystem: false,
          reactions: {},
        };
      });
    } catch (error: unknown) {
      logger.error('getDirectMessagesForUnreadCount error:', error);
      return [];
    }
  },

  updateMessage: async (msgId: string, newText: string): Promise<GroupMessage> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id, group_id, receiver_id')
        .eq('id', msgId)
        .single();

      if (fetchError || !message) {
        throw new Error('Xabar topilmadi.');
      }

      if (message.sender_id !== userId) {
        throw new Error('Unauthorized');
      }

      const { data: updated, error } = await supabase
        .from('messages')
        .update({ text: newText })
        .eq('id', msgId)
        .select('id, sender_id, group_id, receiver_id, text, reactions, reply_to, is_system, created_at')
        .single();

      if (error) throw error;
      if (!updated) throw new Error('Xabar yangilanmadi.');

      const { data: sender } = await supabase.from('users').select('*').eq('id', updated.sender_id).single();

      const usersMap = new Map();
      if (sender) {
        usersMap.set(sender.id, mapDbUserToUser(sender));
      }

      return mapDbMessageToGroupMessage(updated, usersMap);
    } catch (error: unknown) {
      logger.error('updateMessage error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update message';
      throw new Error(errorMessage);
    }
  },

  deleteMessage: async (msgId: string): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id, group_id')
        .eq('id', msgId)
        .single();

      if (fetchError || !message) {
        throw new Error('Xabar topilmadi.');
      }

      let canDelete = message.sender_id === userId;

      if (!canDelete && message.group_id) {
        const { data: group } = await supabase
          .from('groups')
          .select('owner_id')
          .eq('id', message.group_id)
          .single();

        if (group?.owner_id === userId) {
          canDelete = true;
        }
      }

      if (!canDelete) {
        const { data: currentUser } = await supabase.from('users').select('role').eq('id', userId).single();

        if (currentUser?.role === 'admin') {
          canDelete = true;
        }
      }

      if (!canDelete) {
        throw new Error("Siz faqat o'z xabaringizni o'chira olasiz.");
      }

      const { error } = await supabase.from('messages').delete().eq('id', msgId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('deleteMessage error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete message';
      throw new Error(errorMessage);
    }
  },

  addReaction: async (msgId: string, reaction: string): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Unauthorized');

      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', msgId)
        .single();

      if (fetchError || !message) {
        throw new Error('Xabar topilmadi.');
      }

      const reactions: Record<string, string[]> = message.reactions || {};
      const userIdStr = String(userId);

      const targetReactionUsers = reactions[reaction] || [];
      const userAlreadyReacted = targetReactionUsers.some((id: string | number) => String(id) === userIdStr);

      const cleanedReactions: Record<string, string[]> = {};
      for (const [emoji, userIds] of Object.entries(reactions)) {
        const filtered = (userIds || []).filter((id: string | number) => String(id) !== userIdStr);
        if (filtered.length > 0) {
          cleanedReactions[emoji] = filtered;
        }
      }

      if (!userAlreadyReacted) {
        cleanedReactions[reaction] = [...(cleanedReactions[reaction] || []), userIdStr];
      }

      const { error } = await supabase.from('messages').update({ reactions: cleanedReactions }).eq('id', msgId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('addReaction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add reaction';
      throw new Error(errorMessage);
    }
  },

  clearGroupHistory: async (groupId: string): Promise<void> => {
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
        throw new Error('Unauthorized - Faqat guruh admini tarixni tozalay oladi.');
      }

      const { error } = await supabase.from('messages').delete().eq('group_id', groupId);

      if (error) throw error;
    } catch (error: unknown) {
      logger.error('clearGroupHistory error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear group history';
      throw new Error(errorMessage);
    }
  },
};
