import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Users, Plus, Search, MessageCircle, Hash, Send, X,
  Trash2, LogOut, Settings, Trophy
} from 'lucide-react';
import { User, CommunityGroup, GroupMessage } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { TRANSLATIONS } from '../constants';
import { logger } from '../utils/logger';
import { validateMessage, validateGroupName, sanitizeInput, MAX_LENGTHS, checkSpamAndProfanity, limitLength } from '../utils/validation';
import { debounce } from '../utils/debounce';
import { GroupsList } from '../components/community/GroupsList';
import { RatingList } from '../components/community/RatingList';
import { GroupChat } from '../components/community/GroupChat';
import { DMList } from '../components/community/DMList';
import { DMChat } from '../components/community/DMChat';
import { MembersModal } from '../components/community/MembersModal';
import { MemberProfileModal } from '../components/community/MemberProfileModal';
import { useRealTimeSubscription } from '../hooks/useRealTimeSubscription';


interface CommunityProps {
  currentUser: User;
}

type ViewMode = 'groups' | 'group-chat' | 'dm-list' | 'dm-chat' | 'rating';
type TabMode = 'community' | 'rating';

export const Community: React.FC<CommunityProps> = ({ currentUser }) => {
  const { t, language } = useLanguage();
  const { notify } = useToast();

  // --- State: View & Tabs ---
  const [viewMode, setViewMode] = useState<ViewMode>('groups');
  const [tabMode, setTabMode] = useState<TabMode>('community');

  // --- State: Data ---
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);

  // --- State: Selections ---
  const [selectedGroup, setSelectedGroup] = useState<CommunityGroup | null>(null);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [dmPeerUser, setDmPeerUser] = useState<User | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<GroupMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<GroupMessage | null>(null);

  // --- State: UI Controls ---
  const [loading, setLoading] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [dmLoadingUsers, setDmLoadingUsers] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);

  // --- State: Forms & Inputs ---
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', category: 'IT' });

  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editGroupForm, setEditGroupForm] = useState({ name: '', description: '', category: '' });

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState('');

  // --- State: Unread Counts ---
  const [unreadGroupCounts, setUnreadGroupCounts] = useState<Map<string, number>>(() => {
    try {
      const saved = localStorage.getItem('hamroh_unread_group_counts');
      return saved ? new Map(Object.entries(JSON.parse(saved)).map(([k, v]) => [k, Number(v)])) : new Map();
    } catch { return new Map(); }
  });

  const [unreadDmCounts, setUnreadDmCounts] = useState<Map<string, number>>(() => {
    try {
      const saved = localStorage.getItem('hamroh_unread_dm_counts');
      return saved ? new Map(Object.entries(JSON.parse(saved)).map(([k, v]) => [k, Number(v)])) : new Map();
    } catch { return new Map(); }
  });

  const [lastReadTimestamps, setLastReadTimestamps] = useState<Map<string, number>>(() => {
    try {
      const saved = localStorage.getItem('hamroh_last_read_timestamps');
      return saved ? new Map(Object.entries(JSON.parse(saved)).map(([k, v]) => [k, Number(v)])) : new Map();
    } catch { return new Map(); }
  });

  // --- Effects: LocalStorage Persistence ---
  useEffect(() => localStorage.setItem('hamroh_unread_dm_counts', JSON.stringify(Object.fromEntries(unreadDmCounts))), [unreadDmCounts]);
  useEffect(() => localStorage.setItem('hamroh_unread_group_counts', JSON.stringify(Object.fromEntries(unreadGroupCounts))), [unreadGroupCounts]);
  useEffect(() => localStorage.setItem('hamroh_last_read_timestamps', JSON.stringify(Object.fromEntries(lastReadTimestamps))), [lastReadTimestamps]);

  // --- Custom Hook: Real-Time Subscription ---
  useRealTimeSubscription({
    currentUser,
    selectedGroup,
    viewMode,
    dmPeerUser,
    setMessages,
    setUnreadGroupCounts,
    setUnreadDmCounts,
    setPinnedMessage,
    setSelectedGroup,
    notify
  });

  // --- Data Loading Functions ---
  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      const allGroups = await api.getGroups();
      setGroups(allGroups);
    } catch (error: unknown) {
      logger.error('Load groups error:', error);
      notify(error instanceof Error ? error.message : 'Guruhlarni yuklashda xatolik', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const loadLeaderboard = useCallback(async () => {
    try {
      setLoadingLeaderboard(true);
      const members = await api.getLeaderboard();
      setLeaderboard(members);
    } catch (error: unknown) {
      logger.error('Load leaderboard error:', error);
      notify(error instanceof Error ? error.message : 'Reytingni yuklashda xatolik', 'error');
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [notify]);

  // Real-time Leaderboard Subscription
  useEffect(() => {
    if (viewMode === 'rating' && tabMode === 'rating') {
      const cleanup = api.subscribeToLeaderboard((event) => {
        if (event.type === 'USER_UPDATE' && event.payload) {
          const updatedUser = event.payload as User;
          setLeaderboard(prev => {
            const exists = prev.some(u => u.id === updatedUser.id);
            if (exists) {
              const newList = prev.map(u => u.id === updatedUser.id ? updatedUser : u);
              return newList.sort((a, b) => b.xp - a.xp);
            }
            // If user enters top list from outside, we might need to refetch,
            // but for smooth UX updates, we prioritize existing list updates.
            // Occasionally refetching could be added if needed.
            return prev;
          });
        }
      });
      return cleanup;
    }
  }, [viewMode, tabMode]);

  const loadUsersForDM = useCallback(async () => {
    try {
      setDmLoadingUsers(true);
      const query = dmSearchQuery.trim();
      if (query) {
        const isUsernameQuery = query.startsWith('@') || /^[a-zA-Z0-9_]+$/.test(query);
        if (isUsernameQuery) {
          const userByUsername = await api.getUserByUsername(query);
          if (userByUsername && userByUsername.id !== currentUser.id) {
            setAllUsers([userByUsername]);
            return;
          }
        }
        const searchResults = await api.searchUsers(query);
        // Ensure strictly typed User array
        const filtered = searchResults.filter((u: User) => u.id !== currentUser.id);
        setAllUsers(filtered);
      } else {
        const recentChatIds = await api.getRecentDirectChats(currentUser.id);
        if (recentChatIds.length === 0) setAllUsers([]);
        else {
          const users = await Promise.all(recentChatIds.map(id => api.getUserById(id)));
          setAllUsers(users.filter((u): u is User => u !== null));
        }
      }
    } catch (error: unknown) {
      logger.error('Load users for DM error:', error);
      notify('Foydalanuvchilarni yuklashda xatolik', 'error');
    } finally {
      setDmLoadingUsers(false);
    }
  }, [dmSearchQuery, currentUser.id, notify]);

  useEffect(() => {
    if (viewMode === 'dm-list') loadUsersForDM();
  }, [viewMode, dmSearchQuery, loadUsersForDM]);

  const loadMessages = useCallback(async (groupId: string) => {
    try {
      const msgs = await api.getGroupMessages(groupId);
      setMessages(msgs);
    } catch (error: unknown) {
      logger.error('Load messages error:', error);
      notify('Xabarlarni yuklashda xatolik', 'error');
      setMessages([]);
    }
  }, [notify]);

  const loadGroupMembers = useCallback(async (groupId: string) => {
    try {
      const members = await api.getGroupMembers(groupId);
      setGroupMembers(members);
    } catch (error) {
      logger.error('Load group members error:', error);
    }
  }, []);

  const loadBlockedUsers = useCallback(async (groupId: string) => {
    try {
      const blocked = await api.getBlockedUsersInGroup(groupId);
      setBlockedUsers(blocked);
    } catch (error) {
      logger.error('Load blocked users error:', error);
    }
  }, []);

  // Group Selection Effect
  useEffect(() => {
    let loadTimeout: number;
    if (selectedGroup) {
      setMessages([]);
      setPinnedMessage(null);
      setMessageSearchQuery('');
      setGroupMembers([]);
      loadTimeout = window.setTimeout(() => loadMessages(selectedGroup.id), 100);
      loadGroupMembers(selectedGroup.id);
      loadBlockedUsers(selectedGroup.id);
      api.getPinnedMessage(selectedGroup.id).then(setPinnedMessage);
    } else {
      setMessages([]);
      setGroupMembers([]);
      setBlockedUsers([]);
      setPinnedMessage(null);
    }
    return () => clearTimeout(loadTimeout);
  }, [selectedGroup?.id, loadMessages, loadGroupMembers, loadBlockedUsers]);

  // Load Unread Counts
  useEffect(() => {
    const loadUnreadCounts = async () => {
      try {
        const allDMs = await api.getDirectMessagesForUnreadCount(currentUser.id);
        const newUnreadCounts = new Map<string, number>();
        const currentLastRead = new Map<string, number>(lastReadTimestamps);

        allDMs.forEach((msg: GroupMessage) => {
          if (!msg.userId || msg.userId === currentUser.id) return;
          const lastRead = currentLastRead.get(msg.userId) || 0;
          if (msg.timestamp > lastRead) {
            newUnreadCounts.set(msg.userId, (newUnreadCounts.get(msg.userId) || 0) + 1);
          }
        });

        setUnreadDmCounts(prev => {
          const updated = new Map<string, number>(prev);
          newUnreadCounts.forEach((count, userId) => {
            // If currently viewing, keep at 0. Logic is slightly simplified here.
            if (!(viewMode === 'dm-chat' && dmPeerUser?.id === userId)) {
              updated.set(userId, count);
            }
          });
          return updated;
        });
      } catch (e) { logger.error('Load unread counts error', e); }
    };
    loadUnreadCounts();
  }, [currentUser.id, lastReadTimestamps, viewMode, dmPeerUser]);


  // DMs Loading
  const loadDMMessages = useCallback(async (peerId: string) => {
    try {
      const msgs = await api.getDirectMessages(currentUser.id, peerId);
      setMessages(msgs);
      // Mark as read
      const now = Date.now();
      setLastReadTimestamps(prev => new Map<string, number>(prev).set(peerId, now));
      setUnreadDmCounts(prev => new Map<string, number>(prev).set(peerId, 0));
      await api.markDirectMessagesRead(peerId);
    } catch (error) {
      logger.error('Load DM error', error);
      setMessages([]);
    }
  }, [currentUser.id]);

  useEffect(() => {
    if (dmPeerUser && viewMode === 'dm-chat') {
      setMessages([]);
      loadDMMessages(dmPeerUser.id);
    }
  }, [dmPeerUser?.id, viewMode, loadDMMessages]);


  // --- Helper Functions ---
  const isOwner = useCallback((group: CommunityGroup) => group.ownerId === currentUser.id, [currentUser.id]);

  const scrollToMessage = useCallback((messageId: string) => {
    setTimeout(() => {
      const el = document.getElementById(`message-${messageId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMessageId(messageId);
        setTimeout(() => setHighlightedMessageId(null), 2000);
      } else {
        notify('Javob berilgan xabar topilmadi', 'warning');
      }
    }, 100);
  }, [notify]);

  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'hozir';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} daqiqa oldin`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} soat oldin`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} kun oldin`;
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
  }, []);

  // --- Search & Filter ---
  useEffect(() => {
    const debouncedUpdate = debounce((query: string) => setDebouncedSearchQuery(query), 300);
    debouncedUpdate(searchQuery);
    return () => debouncedUpdate('');
  }, [searchQuery]);

  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const matchesSearch = group.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (group.description || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || group.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [groups, debouncedSearchQuery, selectedCategory]);

  // --- Handlers ---
  const handleSelectGroup = (group: CommunityGroup) => {
    setMessages([]);
    setSelectedGroup(group);
    setViewMode('group-chat');
    setUnreadGroupCounts(prev => new Map(prev).set(group.id, 0));
  };

  const handleStartDM = useCallback((member: User) => {
    if (member.id === currentUser.id) return notify('O\'zingizga xabar yozib bo\'lmaydi', 'error');
    setDmPeerUser(member);
    setSelectedMember(null);
    setIsMembersOpen(false);
    setViewMode('dm-chat');
  }, [currentUser.id, notify]);

  const handleCreateGroup = async () => {
    if (currentUser.role !== 'admin') return notify(t('community.create_group_admin_only'), 'error');
    if (!validateGroupName(createForm.name).valid) return notify('Guruh nomi noto\'g\'ri', 'error');
    if (isCreatingGroup) return;

    setIsCreatingGroup(true);
    try {
      const newGroup = await api.createGroup(
        sanitizeInput(createForm.name),
        sanitizeInput(createForm.description),
        createForm.category
      );
      if (newGroup) {
        setGroups(prev => [newGroup, ...prev]);
        setIsCreateModalOpen(false);
        setCreateForm({ name: '', description: '', category: 'IT' });
        notify('Guruh yaratildi', 'success');
        handleSelectGroup(newGroup);
      }
    } catch (e) { notify('Guruh yaratishda xatolik', 'error'); }
    finally { setIsCreatingGroup(false); }
  };

  const handleEditGroup = useCallback(async () => {
    if (!selectedGroup) return; // Add check
    if (!isOwner(selectedGroup)) return notify('Faqat admin tahrirlay oladi', 'error');
    setEditGroupForm({ name: selectedGroup.name, description: selectedGroup.description || '', category: selectedGroup.category });
    setIsEditGroupModalOpen(true);
  }, [selectedGroup, isOwner, notify]);

  const handleSaveGroupEdit = async () => {
    if (!selectedGroup || isEditingGroup) return;
    setIsEditingGroup(true);
    try {
      const updated = await api.updateGroup(selectedGroup.id, {
        name: sanitizeInput(editGroupForm.name),
        description: sanitizeInput(editGroupForm.description),
        category: editGroupForm.category
      });
      setGroups(prev => prev.map(g => g.id === selectedGroup.id ? updated : g));
      setSelectedGroup(updated);
      setIsEditGroupModalOpen(false);
      notify('Guruh yangilandi', 'success');
    } catch (e) { notify('Yangilashda xatolik', 'error'); }
    finally { setIsEditingGroup(false); }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup || !isOwner(selectedGroup)) return;
    if (!confirm('Guruhni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await api.deleteGroup(selectedGroup.id);
      setGroups(prev => prev.filter(g => g.id !== selectedGroup.id));
      setSelectedGroup(null);
      setViewMode('groups');
      notify('Guruh o\'chirildi', 'success');
    } catch (e) { notify('O\'chirishda xatolik', 'error'); }
  };

  const handleLeaveGroup = async (group: CommunityGroup) => {
    try {
      const updatedGroup = await api.leaveGroup(group.id);
      setGroups(prev => prev.map(g => g.id === group.id ? updatedGroup : g));
      if (selectedGroup?.id === group.id) {
        setViewMode('groups');
        setSelectedGroup(null);
      }
      notify('Guruhdan chiqdingiz', 'success');
    } catch (error: unknown) {
      logger.error('Leave group error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Guruhdan chiqishda xatolik';
      notify(errorMessage, 'error');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedGroup || isSendingMessage) return;
    const text = messageInput.trim();
    if (!validateMessage(text).valid) return notify('Xabar xato', 'error');
    if (checkSpamAndProfanity(text).isSpam) return notify('Spam aniqlandi', 'error');

    setIsSendingMessage(true);
    setMessageInput('');
    setReplyingTo(null);

    try {
      const newMessage = await api.sendGroupMessage(selectedGroup.id, sanitizeInput(text), currentUser, replyingTo ? {
        id: replyingTo.id, text: replyingTo.text, userName: replyingTo.userName, userId: replyingTo.userId
      } : undefined);
      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    } catch (e) {
      setMessageInput(text);
      notify('Yuborishda xatolik', 'error');
    } finally { setIsSendingMessage(false); }
  };

  const handleSendDM = async () => {
    if (!messageInput.trim() || !dmPeerUser || isSendingMessage) return;
    const text = messageInput.trim();
    setIsSendingMessage(true);
    setMessageInput('');
    setReplyingTo(null);
    try {
      const newMessage = await api.sendDirectMessage(sanitizeInput(text), currentUser, dmPeerUser.id, replyingTo ? {
        id: replyingTo.id, text: replyingTo.text, userName: replyingTo.userName
      } : undefined);
      setMessages(prev => [...prev, newMessage]);
    } catch (e) {
      setMessageInput(text);
      notify('Xatolik', 'error');
    } finally { setIsSendingMessage(false); }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await api.deleteMessage(msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      if (pinnedMessage?.id === msgId) setPinnedMessage(null);
      notify('O\'chirildi', 'success');
    } catch (e) { notify('Xatolik', 'error'); }
  };

  const handleEditMessage = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (msg) {
      setEditingMessageId(msgId);
      setEditMessageText(msg.text);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editMessageText.trim()) return;
    try {
      const updated = await api.updateMessage(editingMessageId, editMessageText.trim());
      setMessages(prev => prev.map(m => m.id === editingMessageId ? updated : m));
      setEditingMessageId(null);
      setEditMessageText('');
    } catch (e) { notify('Xatolik', 'error'); }
  };

  const handlePinMessage = async (msg: GroupMessage) => {
    if (!selectedGroup) return;
    try {
      const id = await api.setPinnedMessage(selectedGroup.id, msg.id);
      setPinnedMessage(msg);
      setSelectedGroup({ ...selectedGroup, pinnedMessageId: id || undefined });
      notify('Pin qilindi', 'success');
    } catch (e) { notify('Xatolik', 'error'); }
  };
  const handleUnpinMessage = async () => {
    if (!selectedGroup) return;
    try {
      await api.setPinnedMessage(selectedGroup.id, null);
      setPinnedMessage(null);
      setSelectedGroup({ ...selectedGroup, pinnedMessageId: undefined });
    } catch (e) { notify('Xatolik', 'error'); }
  };


  const handleClearHistory = async () => {
    if (!selectedGroup || !confirm('Tarixni tozalashni xohlaysizmi?')) return;
    try {
      await api.clearGroupHistory(selectedGroup.id);
      setMessages([]);
      notify('Tozalandi', 'success');
    } catch (e) { notify('Xatolik', 'error'); }
  };

  // --- Render Modals ---
  // (Simplified for brevity in refactor, keeping structure)
  const renderCreateGroupModal = () => isCreateModalOpen && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setIsCreateModalOpen(false)}>
      <div className="bg-white dark:bg-[#1a1a1e] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-black mb-4 dark:text-white">{t('community.createNewGroup')}</h2>
        <input className="w-full mb-4 p-3 rounded-xl bg-slate-100 dark:bg-white/10 dark:text-white" placeholder={t('community.groupName')} value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
        <textarea className="w-full mb-4 p-3 rounded-xl bg-slate-100 dark:bg-white/10 dark:text-white" placeholder={t('community.description')} value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} />

        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('community.category')}</label>
          <select
            value={createForm.category}
            onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
            className="w-full p-3 rounded-xl bg-slate-100 dark:bg-white/10 dark:text-white"
          >
            {Object.entries(TRANSLATIONS[language]?.categories || {}).map(([key, label]) => (
              <option key={key} value={key}>{typeof label === 'string' ? label : key}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 p-3 bg-slate-100 dark:bg-white/10 rounded-xl font-bold">{t('common.cancel')}</button>
          <button disabled={isCreatingGroup} onClick={handleCreateGroup} className="flex-1 p-3 bg-indigo-600 text-white rounded-xl font-bold">{t('common.create')}</button>
        </div>
      </div>
    </div>
  );

  const renderEditGroupModal = () => isEditGroupModalOpen && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setIsEditGroupModalOpen(false)}>
      <div className="bg-white dark:bg-[#1a1a1e] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-black mb-4 dark:text-white">{t('community.editGroup')}</h2>
        <input className="w-full mb-4 p-3 rounded-xl bg-slate-100 dark:bg-white/10 dark:text-white" value={editGroupForm.name} onChange={e => setEditGroupForm({ ...editGroupForm, name: e.target.value })} />
        <textarea className="w-full mb-4 p-3 rounded-xl bg-slate-100 dark:bg-white/10 dark:text-white" value={editGroupForm.description} onChange={e => setEditGroupForm({ ...editGroupForm, description: e.target.value })} />
        <select
          value={editGroupForm.category}
          onChange={(e) => setEditGroupForm(prev => ({ ...prev, category: e.target.value }))}
          className="w-full mb-4 p-3 rounded-xl bg-slate-100 dark:bg-white/10 dark:text-white"
        >
          {Object.entries(TRANSLATIONS[language]?.categories || {}).map(([key, label]) => (
            <option key={key} value={key}>{typeof label === 'string' ? label : key}</option>
          ))}
        </select>
        <button disabled={isEditingGroup} onClick={handleSaveGroupEdit} className="w-full p-3 bg-indigo-600 text-white rounded-xl font-bold">{t('common.save')}</button>
      </div>
    </div>
  );

  // --- Main Render ---
  if (!currentUser) return <div className="text-center p-10">{t('common.loading')}</div>;

  return (
    <div className="h-[calc(100dvh-120px)] rounded-[2rem] bg-white/40 dark:bg-[#0a0a0c]/60 border border-white/40 dark:border-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col relative">
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* GROUPS LIST */}
        {viewMode === 'groups' && tabMode === 'community' && (
          <GroupsList
            currentUser={currentUser}
            groups={filteredGroups}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            unreadDmCounts={unreadDmCounts}
            unreadGroupCounts={unreadGroupCounts}
            onViewDms={() => setViewMode('dm-list')}
            onCreateGroup={() => setIsCreateModalOpen(true)}
            onSelectGroup={handleSelectGroup}
          />
        )}

        {/* RATING */}
        {viewMode === 'rating' && tabMode === 'rating' && (
          <RatingList
            leaderboard={leaderboard}
            loading={loadingLeaderboard}
            currentUser={currentUser}
            onViewProfile={setSelectedMember}
          />
        )}


        {viewMode === 'group-chat' && selectedGroup && (
          <GroupChat
            currentUser={currentUser}
            selectedGroup={selectedGroup}
            messages={messages}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            messageSearchQuery={messageSearchQuery}
            setMessageSearchQuery={setMessageSearchQuery}
            onSendMessage={handleSendMessage}
            onBack={() => { setViewMode('groups'); setSelectedGroup(null); setMessages([]); }}
            onShowMembers={() => setIsMembersOpen(true)}
            onEditGroup={handleEditGroup}
            onClearHistory={handleClearHistory}
            onDeleteGroup={handleDeleteGroup}
            onLeaveGroup={() => handleLeaveGroup(selectedGroup)}
            onDeleteMessage={handleDeleteMessage}
            onEditMessage={handleEditMessage}
            onReplyMessage={setReplyingTo}
            onPinMessage={handlePinMessage}
            onUnpinMessage={handleUnpinMessage}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            editingMessageId={editingMessageId}
            setEditingMessageId={setEditingMessageId}
            editMessageText={editMessageText}
            setEditMessageText={setEditMessageText}
            onSaveEdit={handleSaveEdit}
            messageMenuOpen={messageMenuOpen}
            setMessageMenuOpen={setMessageMenuOpen}
            highlightedMessageId={highlightedMessageId}
            groupMembers={groupMembers}
            pinnedMessage={pinnedMessage}
            isSendingMessage={isSendingMessage}
            formatTime={formatTime}
            scrollToMessage={scrollToMessage}
          />
        )}

        {/* DM LIST */}
        {viewMode === 'dm-list' && (
          <DMList
            currentUser={currentUser}
            allUsers={allUsers}
            dmSearchQuery={dmSearchQuery}
            setDmSearchQuery={setDmSearchQuery}
            dmLoadingUsers={dmLoadingUsers}
            unreadDmCounts={unreadDmCounts}
            onBack={() => setViewMode('groups')}
            onSelectUser={(user) => { setDmPeerUser(user); setViewMode('dm-chat'); }}
            onSearchSubmit={loadUsersForDM}
          />
        )}

        {/* DM CHAT */}
        {viewMode === 'dm-chat' && dmPeerUser && (
          <DMChat
            currentUser={currentUser}
            dmPeerUser={dmPeerUser}
            messages={messages}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            messageSearchQuery={messageSearchQuery}
            setMessageSearchQuery={setMessageSearchQuery}
            onSendMessage={handleSendDM}
            onBack={() => { setViewMode('dm-list'); setDmPeerUser(null); setMessages([]); }}
            onDeleteMessage={handleDeleteMessage}
            onEditMessage={handleEditMessage}
            onReplyMessage={setReplyingTo}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            editingMessageId={editingMessageId}
            setEditingMessageId={setEditingMessageId}
            editMessageText={editMessageText}
            setEditMessageText={setEditMessageText}
            onSaveEdit={handleSaveEdit}
            messageMenuOpen={messageMenuOpen}
            setMessageMenuOpen={setMessageMenuOpen}
            highlightedMessageId={highlightedMessageId}
            isSendingMessage={isSendingMessage}
            unreadDmCounts={unreadDmCounts}
            formatTime={formatTime}
            scrollToMessage={scrollToMessage}
          />
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {!['group-chat', 'dm-chat'].includes(viewMode) && (
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 flex justify-between items-center max-w-lg mx-auto overflow-x-auto no-scrollbar gap-1">
            <button
              onClick={() => { setTabMode('community'); setViewMode('groups'); }}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all duration-300 ${tabMode === 'community'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:bg-white/10'}`}
            >
              <Users size={20} className={tabMode === 'community' ? 'text-white' : 'text-slate-500'} />
              <span className="text-[10px] leading-tight text-center">{t('community.tab_community')}</span>
            </button>
            <button
              onClick={() => { setTabMode('rating'); setViewMode('rating'); loadLeaderboard(); }}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all duration-300 ${tabMode === 'rating'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:bg-white/10'}`}
            >
              <Trophy size={20} className={tabMode === 'rating' ? 'text-white' : 'text-slate-500'} />
              <span className="text-[10px] leading-tight text-center">{t('community.tab_rating')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Tabs */}
      {!['group-chat', 'dm-chat'].includes(viewMode) && (
        <div className="hidden lg:flex px-6 py-4 border-t border-slate-200 dark:border-white/10 gap-2 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-lg">
          <button onClick={() => { setTabMode('community'); setViewMode('groups'); }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all ${tabMode === 'community' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400'}`}>
            <Users size={18} />
            <span className="hidden sm:inline">{t('community.tab_community')}</span>
          </button>
          <button onClick={() => { setTabMode('rating'); setViewMode('rating'); loadLeaderboard(); }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all ${tabMode === 'rating' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400'}`}>
            <Trophy size={18} />
            <span className="hidden sm:inline">{t('community.tab_rating')}</span>
          </button>
        </div>
      )}

      {selectedGroup && (
        <MembersModal
          isOpen={isMembersOpen}
          onClose={() => setIsMembersOpen(false)}
          groupMembers={groupMembers}
          selectedGroup={selectedGroup}
          currentUser={currentUser}
          onSelectMember={setSelectedMember}
          onToggleBlock={async (userId) => {
            try {
              if (blockedUsers.some(u => u.id === userId)) {
                await api.unblockUserInGroup(selectedGroup.id, userId);
                notify('Blokdan chiqarildi', 'success');
              } else {
                const reason = prompt('Sabab?');
                if (reason) {
                  await api.blockUserInGroup(selectedGroup.id, userId, reason);
                  notify('Bloklandi', 'success');
                }
              }
              loadBlockedUsers(selectedGroup.id);
            } catch (e) { notify('Xatolik', 'error'); }
          }}
          isUserBlocked={(userId) => blockedUsers.some(bu => bu.id === userId)}
          onRemoveMember={async (userId) => {
            if (confirm('Chiqarishni tasdiqlaysizmi?')) {
              try {
                await api.removeGroupMember(selectedGroup.id, userId);
                setGroupMembers(prev => prev.filter(m => m.id !== userId));
                notify('Chiqarildi', 'success');
              } catch (e) { notify('Xatolik', 'error'); }
            }
          }}
          onStartDM={handleStartDM}
        />
      )}

      <MemberProfileModal
        user={selectedMember}
        currentUser={currentUser}
        onClose={() => setSelectedMember(null)}
        onStartDM={handleStartDM}
        notify={notify}
      />

      {renderCreateGroupModal()}
      {renderEditGroupModal()}
    </div>
  );
};
