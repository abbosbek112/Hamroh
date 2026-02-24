import React from 'react';
import { X, Search, Users, Loader2, MessageCircle } from 'lucide-react';
import { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserBadge } from '../UserBadge';

interface DMListProps {
    currentUser: User;
    allUsers: User[];
    dmSearchQuery: string;
    setDmSearchQuery: (query: string) => void;
    dmLoadingUsers: boolean;
    unreadDmCounts: Map<string, number>;
    onBack: () => void;
    onSelectUser: (user: User) => void;
    onSearchSubmit: () => void;
}

export const DMList: React.FC<DMListProps> = ({
    currentUser,
    allUsers,
    dmSearchQuery,
    setDmSearchQuery,
    dmLoadingUsers,
    unreadDmCounts,
    onBack,
    onSelectUser,
    onSearchSubmit,
}) => {
    const { t } = useLanguage();

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                        {t('community.direct_messages')}
                    </h1>
                    <button
                        onClick={onBack}
                        aria-label={t('community.back')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                    >
                        <X size={18} />
                        <span className="hidden sm:inline">{t('community.back')}</span>
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('community.search_user')}
                        value={dmSearchQuery}
                        onChange={(e) => setDmSearchQuery(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && dmSearchQuery.trim()) {
                                onSearchSubmit();
                            }
                        }}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto p-6">
                {dmLoadingUsers ? (
                    <div className="text-center py-20 text-slate-400">
                        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={32} />
                        <p>{t('common.loading')}</p>
                    </div>
                ) : allUsers.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="mx-auto mb-4 text-slate-400" size={48} />
                        <p className="text-slate-500 dark:text-slate-400">Foydalanuvchilar topilmadi</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {allUsers.map(user => {
                            const unreadCount = unreadDmCounts.get(user.id) || 0;
                            return (
                                <div
                                    key={user.id}
                                    onClick={() => onSelectUser(user)}
                                    className="p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500/50 transition-all hover:shadow-lg cursor-pointer flex items-center gap-3 relative"
                                >
                                    <div className="relative">
                                        <img
                                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                                            alt={user.name}
                                            className="w-12 h-12 rounded-full relative z-10"
                                        />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-20 animate-pulse shadow-lg">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-visible relative z-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 overflow-visible">
                                            <UserBadge user={user} size="sm" />
                                            {user.name}
                                            {unreadCount > 0 && (
                                                <span className="ml-2 text-xs font-normal text-red-500 dark:text-red-400">
                                                    ({unreadCount} yangi)
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">@{user.username}</p>
                                    </div>
                                    <MessageCircle className="text-slate-400" size={20} />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
