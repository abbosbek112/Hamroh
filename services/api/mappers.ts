import type { User, GroupMessage, CommunityGroup } from '../../types';
import { logger } from '../../utils/logger';

export const mapDbUserToUser = (dbUser: any): User => {
  if (!dbUser || !dbUser.id) {
    logger.error('Invalid dbUser provided to mapDbUserToUser:', dbUser);
    throw new Error('Invalid user data');
  }

  const sanitizedName = typeof dbUser.name === 'string' ? dbUser.name.trim() : 'User';
  const sanitizedBio = dbUser.bio && typeof dbUser.bio === 'string' ? dbUser.bio.trim() : undefined;

  return {
    id: dbUser.id,
    name: sanitizedName || 'User',
    username: dbUser.username || '',
    email: dbUser.email || undefined,
    avatar:
      dbUser.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedName)}&background=random&color=fff`,
    role: (dbUser.role || 'user') as 'user' | 'admin',
    xp: typeof dbUser.xp === 'number' ? dbUser.xp : 0,
    level: typeof dbUser.level === 'number' ? dbUser.level : 1,
    streak: typeof dbUser.streak === 'number' ? dbUser.streak : 0,
    focusMinutes: typeof dbUser.focus_minutes === 'number' ? dbUser.focus_minutes : 0,
    badges: (Array.isArray(dbUser.badges) ? dbUser.badges : []) as string[],
    selectedBadgeId: dbUser.selected_badge_id || undefined,
    theme: (dbUser.theme || 'light') as 'light' | 'dark',
    appTheme: (dbUser.app_theme || undefined) as 'neon' | 'forest' | undefined,
    doubleXpExpiresAt: dbUser.double_xp_expires_at
      ? new Date(dbUser.double_xp_expires_at).getTime()
      : undefined,
    language: (dbUser.language || 'uz') as 'uz' | 'ru' | 'en',
    status: (dbUser.status || 'Active') as 'Active' | 'Banned',
    bio: sanitizedBio,
    phoneNumber: dbUser.phone_number || undefined,
    age: typeof dbUser.age === 'number' ? dbUser.age : undefined,
    lastActive: dbUser.last_active ? new Date(dbUser.last_active).getTime() : undefined,
    createdAt: dbUser.created_at || undefined,
    inventory: (Array.isArray(dbUser.inventory) ? dbUser.inventory : []) as string[],
    platform: (dbUser.platform || undefined) as User['platform'],
    identity: dbUser.identity || undefined,
    routines: dbUser.routines || undefined,
    lastReviewDate: typeof dbUser.last_review_date === 'number' ? dbUser.last_review_date : undefined,
  };
};

export const mapUserToDbUser = (user: Partial<User>): any => {
  if (!user || !user.id) {
    logger.error('Invalid user provided to mapUserToDbUser:', user);
    throw new Error('Invalid user data');
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    role: user.role || 'user',
    xp: typeof user.xp === 'number' ? user.xp : 0,
    level: typeof user.level === 'number' ? user.level : 1,
    streak: typeof user.streak === 'number' ? user.streak : 0,
    focus_minutes: typeof user.focusMinutes === 'number' ? user.focusMinutes : 0,
    badges: Array.isArray(user.badges) ? user.badges : [],
    selected_badge_id: user.selectedBadgeId,
    theme: user.theme || 'light',
    app_theme: user.appTheme || null,
    double_xp_expires_at: user.doubleXpExpiresAt
      ? new Date(user.doubleXpExpiresAt).toISOString()
      : null,
    language: user.language || 'uz',
    status: user.status || 'Active',
    bio: user.bio,
    phone_number: user.phoneNumber,
    age: typeof user.age === 'number' ? user.age : undefined,
    last_active: user.lastActive ? new Date(user.lastActive).toISOString() : new Date().toISOString(),
  };
};

export const mapDbMessageToGroupMessage = (dbMsg: any, users: Map<string, User>): GroupMessage => {
  if (!dbMsg || !dbMsg.id) {
    logger.error('Invalid dbMsg provided to mapDbMessageToGroupMessage:', dbMsg);
    throw new Error('Invalid message data');
  }

  const sender = users.get(dbMsg.sender_id);

  if (!sender && dbMsg.sender_id) {
    logger.warn('Sender not found in users map for message:', {
      messageId: dbMsg.id,
      senderId: dbMsg.sender_id,
      availableUserIds: Array.from(users.keys()),
    });
  }

  let replyTo = undefined;
  if (dbMsg.reply_to) {
    if (typeof dbMsg.reply_to === 'object') {
      if (dbMsg.reply_to.id && dbMsg.reply_to.text) {
        replyTo = {
          id: dbMsg.reply_to.id,
          text: dbMsg.reply_to.text,
          userName: dbMsg.reply_to.sender || dbMsg.reply_to.userName || 'Unknown',
          userId: dbMsg.reply_to.userId || undefined,
        };
      }
    }
  }

  const sanitizedText = typeof dbMsg.text === 'string' ? dbMsg.text : dbMsg.content || '';

  return {
    id: dbMsg.id,
    text: sanitizedText,
    timestamp: dbMsg.created_at ? new Date(dbMsg.created_at).getTime() : Date.now(),
    userId: dbMsg.sender_id,
    userName: sender?.name || "Noma'lum foydalanuvchi",
    userAvatar: sender?.avatar || '',
    readAt: dbMsg.read_at ? new Date(dbMsg.read_at).getTime() : undefined,
    groupId: dbMsg.group_id || undefined,
    receiverId: dbMsg.receiver_id || undefined,
    isSystem: dbMsg.is_system || false,
    reactions: dbMsg.reactions || {},
    replyTo: replyTo,
    isEdited: false,
  };
};

export const mapDbGroupToCommunityGroup = (dbGroup: any): CommunityGroup => {
  if (!dbGroup || !dbGroup.id) {
    logger.error('Invalid dbGroup provided to mapDbGroupToCommunityGroup:', dbGroup);
    throw new Error('Invalid group data');
  }
  return {
    id: dbGroup.id,
    name: dbGroup.name,
    description: dbGroup.description || '',
    category: dbGroup.category || '',
    members: dbGroup.members_count || 0,
    memberIds: Array.isArray(dbGroup.member_ids) ? dbGroup.member_ids : [],
    ownerId: dbGroup.owner_id,
    pinnedMessageId: dbGroup.pinned_message_id || undefined,
    createdAt: dbGroup.created_at || undefined,
  };
};

