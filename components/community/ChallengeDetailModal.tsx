import React, { useState } from 'react';
import { X, Trophy, Calendar, Users, Zap, CheckCircle2, Flame, Award, Clock } from 'lucide-react';
import { Challenge, User } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';

interface ChallengeDetailModalProps {
    challenge: Challenge;
    currentUser: User;
    onClose: () => void;
    onJoin: () => Promise<void>;
    onCheckIn: () => Promise<void>;
}

type Tab = 'overview' | 'progress';

export const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
    challenge,
    currentUser,
    onClose,
    onJoin,
    onCheckIn,
}) => {
    const { t, language } = useLanguage();
    const { notify } = useToast();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [joining, setJoining] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);

    // Determine if user checked in today using local date components (avoids UTC timezone issues)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    let lastCheckInStr = '';
    if (challenge.lastCheckIn) {
        const last = new Date(challenge.lastCheckIn);
        lastCheckInStr = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
    }
    const checkedInToday = lastCheckInStr === todayStr;

    const completedDays = challenge.totalCheckIns || 0;
    const days = Array.from({ length: challenge.durationDays }, (_, i) => i + 1);

    const fireConfetti = () => {
        if ((window as any).confetti) {
            (window as any).confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
            script.onload = () => (window as any).confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            document.body.appendChild(script);
        }
    };

    const handleJoin = async () => {
        setJoining(true);
        try {
            await onJoin();
        } finally {
            setJoining(false);
        }
    };

    const handleCheckIn = async () => {
        setCheckingIn(true);
        try {
            await onCheckIn();
            fireConfetti();
        } finally {
            setCheckingIn(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(
            language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ',
            { month: 'short', day: 'numeric' }
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#1a1a1e] rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative h-28 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-3xl flex items-center justify-center overflow-hidden shrink-0">
                    <div className="text-6xl">{challenge.icon}</div>
                    <button
                        onClick={onClose}
                        aria-label={t('common.close')}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-6 pt-4 pb-0 text-center shrink-0">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{challenge.title}</h2>
                    <div className="flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Users size={13} />{challenge.participantsCount.toLocaleString()} {t('community.participants') || 'ishtirokchi'}</span>
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold"><Zap size={13} fill="currentColor" />+{challenge.rewardXP} XP</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-white/10 mt-4 px-6 shrink-0">
                    {([
                        { id: 'overview', label: t('community.tab_overview') || 'Umumiy', icon: Trophy },
                        { id: 'progress', label: t('community.tab_my_progress') || 'Mening Progressim', icon: CheckCircle2 },
                    ] as { id: Tab; label: string; icon: any }[]).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 pb-3 text-sm font-bold transition-all relative flex items-center justify-center gap-2 ${activeTab === tab.id
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                        >
                            <tab.icon size={15} />
                            <span>{tab.label}</span>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'overview' && (
                        <div className="space-y-5">
                            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{t('community.challenge_goal') || "Maqsad"}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm">{challenge.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1 text-xs">
                                        <Calendar size={14} /><span>{t('community.duration') || 'Davomiylik'}</span>
                                    </div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">{challenge.durationDays} {t('community.days') || 'kun'}</p>
                                    <p className="text-xs text-slate-400">{formatDate(challenge.startDate)} – {formatDate(challenge.endDate)}</p>
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                                    <div className="flex items-center gap-2 text-indigo-500 mb-1 text-xs">
                                        <Zap size={14} /><span>{t('community.reward') || 'Mukofot'}</span>
                                    </div>
                                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">+{challenge.rewardXP} XP</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-500/20">
                                <h3 className="font-bold text-amber-900 dark:text-amber-300 mb-2 flex items-center gap-2">
                                    <Flame size={16} />{t('community.rules') || 'Qoidalar'}
                                </h3>
                                <ul className="space-y-1.5 text-amber-800 dark:text-amber-200 text-sm">
                                    <li className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />{t('community.rules_1') || 'Har kuni belgilangan vazifani bajaring'}</li>
                                    <li className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />{t('community.rules_2') || 'Kunlik check-in qiling'}</li>
                                    <li className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />{t('community.rules_3') || 'Musobaqa tugagach XP mukofot olasiz'}</li>
                                </ul>
                            </div>

                            {!challenge.isJoined && (
                                <button
                                    onClick={handleJoin}
                                    disabled={joining}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    {joining ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (t('community.join') || "Qo'shilish")}
                                </button>
                            )}
                        </div>
                    )}

                    {activeTab === 'progress' && (
                        <div className="space-y-6">
                            {!challenge.isJoined ? (
                                <div className="text-center py-10">
                                    <Clock size={40} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 dark:text-slate-400 mb-4">{t('community.join_to_view_progress') || "Progressni ko'rish uchun qo'shiling"}</p>
                                    <button onClick={handleJoin} disabled={joining} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all">
                                        {joining ? '...' : (t('community.join') || "Qo'shilish")}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Progress circle */}
                                    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center">
                                        <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4 border-4 border-green-50 dark:border-green-500/10">
                                            <span className="text-3xl font-black text-green-600 dark:text-green-400">
                                                {Math.min(100, Math.round((completedDays / challenge.durationDays) * 100))}%
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                            {completedDays} / {challenge.durationDays} {t('community.days') || 'kun'}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                                            {Math.max(0, challenge.durationDays - completedDays)} {t('community.days_remaining') || 'kun qoldi'}
                                        </p>
                                    </div>

                                    {/* Day grid */}
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {days.map(day => (
                                            <div
                                                key={day}
                                                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold border ${day <= completedDays
                                                        ? 'bg-green-500 border-green-600 text-white'
                                                        : day === completedDays + 1
                                                            ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 animate-pulse'
                                                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'
                                                    }`}
                                            >
                                                {day <= completedDays ? <CheckCircle2 size={14} /> : day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Check-in button */}
                                    <button
                                        onClick={handleCheckIn}
                                        disabled={checkedInToday || checkingIn}
                                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${checkedInToday
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl active:scale-95'
                                            }`}
                                    >
                                        {checkingIn ? (
                                            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : checkedInToday ? (
                                            <><CheckCircle2 size={22} />{t('community.task_completed_today') || 'Bugun bajarildi ✓'}</>
                                        ) : (
                                            t('community.check_in_button') || '✅ Bugungi Check-in'
                                        )}
                                    </button>

                                    {checkedInToday && (
                                        <p className="text-center text-sm text-slate-400">
                                            {t('community.next_check_in') || 'Keyingi check-in ertaga mavjud bo\'ladi'}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
