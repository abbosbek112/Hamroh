import React, { useState, useEffect } from 'react';
import {
    X, Check, Loader2, Save, Ban, Trash2
} from 'lucide-react';
import { AdminUser } from '../../types';
import { ACHIEVEMENTS_LIST } from '../../constants';
import { api } from '../../services/api';
import { logger } from '../../utils/logger';

interface UserDetailModalProps {
    user: AdminUser | null;
    onClose: () => void;
    onBan: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdateUser: (user: AdminUser) => void;
    notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose, onBan, onDelete, onUpdateUser, notify }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'badges'>('profile');
    const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setSelectedBadges(user.badges || []);
        }
    }, [user]);

    if (!user) return null;

    const handleBadgeToggle = (badgeId: string) => {
        setSelectedBadges(prev => {
            if (prev.includes(badgeId)) {
                return prev.filter(id => id !== badgeId);
            } else {
                return [...prev, badgeId];
            }
        });
    };

    const handleSaveBadges = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            const updatedUser = { ...user, badges: selectedBadges };
            const savedUser = await api.updateUserAdmin(updatedUser);
            onUpdateUser(savedUser as AdminUser);
            notify('Yorliqlar muvaffaqiyatli yangilandi', 'success');
        } catch (error: unknown) {
            logger.error('Save badges error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Yorliqlarni saqlashda xatolik';
            notify(errorMessage, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const userBadges = user.badges || [];
    const hasChanges = JSON.stringify(selectedBadges.sort()) !== JSON.stringify(userBadges.sort());

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#1a1a1e] rounded-[2rem] shadow-2xl animate-fade-in-up border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 z-10">
                    <X size={20} />
                </button>

                <div className="p-6 border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-4 border-white dark:border-white/5 shadow-lg">
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                            <p className="text-slate-500 font-medium">@{user.username}</p>
                            <div className="flex gap-2 mt-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.status === 'Banned' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'}`}>
                                    {user.status}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex border-b border-slate-200 dark:border-white/10 px-6">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'profile'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Profil Ma'lumotlari
                    </button>
                    <button
                        onClick={() => setActiveTab('badges')}
                        className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'badges'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Yorliqlar ({selectedBadges.length})
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'profile' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-center border border-slate-100 dark:border-white/5">
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">{user.xp || 0}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">XP</div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-center border border-slate-100 dark:border-white/5">
                                    <div className={`text-2xl font-black ${user.riskScore > 50 ? 'text-red-500' : 'text-green-500'}`}>
                                        {user.riskScore || 0}%
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Risk</div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-center border border-slate-100 dark:border-white/5">
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">{user.level || 1}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Level</div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-center border border-slate-100 dark:border-white/5">
                                    <div className="text-2xl font-black text-slate-900 dark:text-white">{user.streak || 0}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Streak</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Email</label>
                                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                                        {user.email || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Bio</label>
                                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white min-h-[60px]">
                                        {user.bio || 'Bio kiritilmagan'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Telefon</label>
                                        <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                                            {user.phoneNumber || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Yosh</label>
                                        <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                                            {user.age || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Qo'shilgan sana</label>
                                        <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                                            {user.joinedDate || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Oxirgi faollik</label>
                                        <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                                            {user.lastActive ? new Date(user.lastActive).toLocaleString('uz-UZ') : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Foydalanuvchiga yorliqlar berish yoki olib tashlash
                                </p>
                                {hasChanges && (
                                    <button
                                        onClick={handleSaveBadges}
                                        disabled={isSaving}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Saqlash
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {ACHIEVEMENTS_LIST.map((badge) => {
                                    const hasBadge = selectedBadges.includes(badge.id);
                                    return (
                                        <div
                                            key={badge.id}
                                            onClick={() => handleBadgeToggle(badge.id)}
                                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${hasBadge
                                                ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 ring-2 ring-indigo-500/20'
                                                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500'
                                                }`}
                                        >
                                            <div className="text-3xl mb-2 text-center">{badge.icon}</div>
                                            <p className="text-xs font-bold text-center text-slate-900 dark:text-white">
                                                {badge.name}
                                            </p>
                                            {hasBadge && (
                                                <div className="mt-2 flex items-center justify-center">
                                                    <Check size={16} className="text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-white/10 flex gap-3">
                    <button
                        onClick={() => onBan(user.id)}
                        className="flex-1 py-3 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-xl font-bold hover:bg-yellow-200 dark:hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                        <Ban size={18} /> {user.status === 'Banned' ? 'Unban' : 'Ban'}
                    </button>
                    <button
                        onClick={() => onDelete(user.id)}
                        className="flex-1 py-3 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-xl font-bold hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18} /> O'chirish
                    </button>
                </div>
            </div>
        </div>
    );
};
