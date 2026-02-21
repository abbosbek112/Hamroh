import React from 'react';
import { Trophy, TrendingUp, Flame } from 'lucide-react';
import { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserBadge } from '../UserBadge';

interface RatingListProps {
    leaderboard: User[];
    loading: boolean;
    currentUser: User;
    onViewProfile?: (user: User) => void;
}

export const RatingList: React.FC<RatingListProps> = ({
    leaderboard,
    loading,
    currentUser,
    onViewProfile,
}) => {
    const { t } = useLanguage();

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 pb-8 sm:px-6 custom-scrollbar">
            <div className="max-w-4xl mx-auto py-8">
                <div className="text-center mb-10">
                    <div className="inline-flex p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 mb-4 shadow-xl shadow-indigo-500/10">
                        <Trophy size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                        {t('community.leaderboard_title')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        {t('community.leaderboard_subtitle')}
                    </p>
                </div>

                <div className="space-y-4">
                    {leaderboard.map((user, index) => {
                        const isCurrentUser = user.id === currentUser.id;
                        const rank = index + 1;
                        const isTop3 = rank <= 3;

                        return (
                            <div
                                key={user.id}
                                onClick={() => onViewProfile?.(user)}
                                className={`flex items-center gap-4 p-5 rounded-3xl transition-all duration-300 border cursor-pointer ${isCurrentUser
                                    ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-500/20 scale-[1.02] z-10'
                                    : 'bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:scale-[1.01]'
                                    }`}
                            >
                                <div className={`w-12 flex-shrink-0 flex items-center justify-center font-black text-2xl ${isCurrentUser
                                    ? 'text-white'
                                    : isTop3
                                        ? 'text-indigo-500'
                                        : 'text-slate-300'
                                    }`}>
                                    {rank}
                                </div>

                                <div className="relative">
                                    <img
                                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                                        alt={user.name}
                                        className={`w-14 h-14 rounded-2xl object-cover border-2 ${isCurrentUser ? 'border-white/40' : 'border-slate-200 dark:border-white/10'
                                            }`}
                                    />
                                    {isTop3 && (
                                        <div className="absolute -top-2 -right-2 p-1 bg-amber-400 text-white rounded-lg shadow-lg">
                                            <Trophy size={14} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 overflow-visible">
                                        <UserBadge user={user} size="sm" />
                                        <h3 className={`font-bold truncate text-lg ${isCurrentUser ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                            {user.name}
                                        </h3>
                                    </div>
                                    <div className={`flex items-center gap-3 text-sm font-medium ${isCurrentUser ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                        <span className="flex items-center gap-1">
                                            <TrendingUp size={14} />
                                            {t('common.level')} {user.level}
                                        </span>
                                        {user.streak > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Flame size={14} className="text-orange-500" />
                                                {user.streak} {t('community.daily_streak')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className={`font-black text-xl ${isCurrentUser ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                        {user.xp.toLocaleString()}
                                    </div>
                                    <div className={`text-xs font-bold uppercase tracking-wider ${isCurrentUser ? 'text-indigo-100/70' : 'text-slate-400'}`}>
                                        XP
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
