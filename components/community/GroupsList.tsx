import React from 'react';
import { Mail, Plus, Search, Users, Hash, Crown, MessageCircle } from 'lucide-react';
import { User, CommunityGroup } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { TRANSLATIONS } from '../../constants';

interface GroupsListProps {
    currentUser: User;
    groups: CommunityGroup[];
    loading: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    unreadDmCounts: Map<string, number>;
    unreadGroupCounts: Map<string, number>;
    onViewDms: () => void;
    onCreateGroup: () => void;
    onSelectGroup: (group: CommunityGroup) => void;
}

export const GroupsList: React.FC<GroupsListProps> = ({
    currentUser,
    groups,
    loading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    unreadDmCounts,
    unreadGroupCounts,
    onViewDms,
    onCreateGroup,
    onSelectGroup,
}) => {
    const { t, language } = useLanguage();

    const isOwner = (group: CommunityGroup) => group.ownerId === currentUser.id;

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                        {t('community.tab_community') || 'Jamiyat'}
                    </h1>
                    <div className="flex gap-2 self-start sm:self-auto">
                        <button
                            onClick={onViewDms}
                            className="relative flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            <Mail size={18} />
                            <span className="hidden sm:inline">{t('community.direct_messages')}</span>
                            <span className="sm:hidden">DM</span>
                            {(() => {
                                const totalUnread = (Array.from(unreadDmCounts.values()) as number[]).reduce((sum, count) => sum + count, 0);
                                return totalUnread > 0 ? (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                                        {totalUnread > 99 ? '99+' : totalUnread}
                                    </span>
                                ) : null;
                            })()}
                        </button>
                        {currentUser.role === 'admin' && (
                            <button
                                onClick={onCreateGroup}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:inline">{t('common.create') || 'Yaratish'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('community.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 sm:py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-3 sm:py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                        <option value="All">{t('community.all_categories')}</option>
                        {Object.entries((TRANSLATIONS[language]?.categories as any) || {}).map(([key, label]) => (
                            <option key={key} value={key}>{typeof label === 'string' ? label : key}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Groups List */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="text-center py-20 text-slate-400">{t('common.loading')}</div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="mx-auto mb-4 text-slate-400" size={48} />
                        <p className="text-slate-500 dark:text-slate-400">{t('community.no_groups_found')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups.map(group => {
                            const unreadCount = unreadGroupCounts.get(group.id) || 0;
                            return (
                                <div
                                    key={group.id}
                                    className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500/50 transition-all hover:shadow-lg group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Hash className="text-indigo-500" size={18} />
                                                <h3 className="font-bold text-slate-900 dark:text-white">
                                                    {group.name}
                                                </h3>
                                                {isOwner(group) && (
                                                    <Crown className="text-yellow-500" size={14} />
                                                )}
                                                {unreadCount > 0 && (
                                                    <span className="ml-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                                                        {unreadCount > 99 ? '99+' : unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                                                {group.description || 'Tavsif yo\'q'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end mb-3">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-full text-xs">
                                            {(TRANSLATIONS[language]?.categories as any)?.[group.category] || group.category}
                                        </span>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectGroup(group);
                                        }}
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-sm"
                                    >
                                        <MessageCircle size={16} className="inline mr-2" />
                                        Chatga kirish
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
