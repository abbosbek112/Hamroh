import React from 'react';
import { X, Mail } from 'lucide-react';
import { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { UserBadge } from '../UserBadge';

interface MemberProfileModalProps {
    user: User | null;
    currentUser: User;
    onClose: () => void;
    onStartDM: (user: User) => void;
    notify: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
    user,
    currentUser,
    onClose,
    onStartDM,
    notify,
}) => {
    const { t } = useLanguage();

    if (!user) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#0a0a0c] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('community.profile')}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                <div className="flex flex-col items-center mb-6">
                    <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                        alt={user.name}
                        className="w-24 h-24 rounded-full border-4 border-indigo-500 mb-4"
                    />
                    <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2 overflow-visible">
                        <UserBadge user={user} size="md" />
                        {user.name}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        @{user.username}
                    </p>

                    {user.bio && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4">
                            {user.bio}
                        </p>
                    )}

                    <div className="flex gap-4 text-center">
                        <div className="px-4 py-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl">
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {user.level}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">Level</div>
                        </div>
                        <div className="px-4 py-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl">
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {user.xp.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">XP</div>
                        </div>
                        <div className="px-4 py-2 bg-orange-100 dark:bg-orange-500/20 rounded-xl">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {user.streak}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">{t('home.streak')}</div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            if (user.id === currentUser.id) {
                                notify('O\'zingizga xabar yozib bo\'lmaydi', 'error');
                                return;
                            }
                            onStartDM(user);
                        }}
                        disabled={user.id === currentUser.id}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <Mail size={18} />
                        {t('community.send_message')}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
                    >
                        {t('community.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};
