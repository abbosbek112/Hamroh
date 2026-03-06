import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Zap, Calendar, Users, Plus, Filter, Trash2, Loader2 } from 'lucide-react';
import { Challenge, User } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../utils/logger';
import { ChallengeDetailModal } from './ChallengeDetailModal';

interface ChallengesListProps {
    currentUser: User;
    refreshTrigger?: number;
}

const CATEGORIES = ['All', 'Health', 'Learning', 'Mindfulness', 'General'];

export const ChallengesList: React.FC<ChallengesListProps> = ({ currentUser, refreshTrigger }) => {
    const { t, language } = useLanguage();
    const { notify } = useToast();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

    // Admin: Create Challenge Modal
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({
        title: '',
        description: '',
        icon: '🏆',
        durationDays: 30,
        rewardXP: 500,
        category: 'General',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    });
    const [creating, setCreating] = useState(false);

    const loadChallenges = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.getChallenges();
            setChallenges(data);
            // Keep selected challenge fresh
            setSelectedChallenge(prev => prev ? data.find(c => c.id === prev.id) || null : null);
        } catch (error) {
            logger.error('Load challenges error:', error);
            notify('Musobaqalarni yuklashda xatolik', 'error');
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        loadChallenges();
    }, [loadChallenges, refreshTrigger]);

    const handleJoin = async (challenge: Challenge) => {
        try {
            setLoadingId(challenge.id);
            await api.joinChallenge(challenge.id);
            await loadChallenges();
            notify(t('community.join_success') || "Muvaffaqiyatli qo'shildingiz! 🎉", 'success');
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Xatolik';
            notify(msg, 'error');
        } finally {
            setLoadingId(null);
        }
    };

    const handleCheckIn = async (challenge: Challenge) => {
        try {
            setLoadingId(challenge.id);
            await api.checkInChallenge(challenge.id, challenge.rewardXP);
            await loadChallenges();
            notify(`+${challenge.rewardXP} XP qo'shildi! 🎉`, 'success');
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Xatolik';
            notify(msg, 'error');
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (challengeId: string) => {
        if (!window.confirm("Musobaqani o'chirish?")) return;
        try {
            await api.deleteChallenge(challengeId);
            await loadChallenges();
            notify("O'chirildi", 'success');
        } catch (error) {
            notify('Xatolik', 'error');
        }
    };

    const handleCreate = async () => {
        if (!createForm.title || !createForm.description) {
            notify("Sarlavha va tavsif kiritish shart", 'error');
            return;
        }
        setCreating(true);
        try {
            await api.createChallenge({
                title: createForm.title,
                description: createForm.description,
                icon: createForm.icon,
                durationDays: Number(createForm.durationDays),
                rewardXP: Number(createForm.rewardXP),
                category: createForm.category,
                startDate: createForm.startDate,
                endDate: createForm.endDate,
            });
            setShowCreate(false);
            setCreateForm({
                title: '', description: '', icon: '🏆', durationDays: 30, rewardXP: 500,
                category: 'General',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            });
            await loadChallenges();
            notify("Musobaqa yaratildi! 🎉", 'success');
        } catch (error) {
            notify('Yaratishda xatolik', 'error');
        } finally {
            setCreating(false);
        }
    };

    const filtered = filter === 'All' ? challenges : challenges.filter(c => c.category === filter);

    const formatDate = (d: string) => new Date(d).toLocaleDateString(
        language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ',
        { month: 'short', day: 'numeric' }
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Trophy size={24} className="text-amber-500" />
                    {t('community.challenges') || 'Musobaqalar'}
                </h2>
                {currentUser.role === 'admin' && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all"
                    >
                        <Plus size={16} />
                        Yangi musobaqa
                    </button>
                )}
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filter === cat
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-indigo-300'
                            }`}
                    >
                        {cat === 'All' ? (t('community.all_categories') || 'Hammasi') : cat}
                    </button>
                ))}
            </div>

            {/* Challenge Cards */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-white/5 rounded-[2rem] border border-dashed border-slate-300 dark:border-white/10">
                    <Trophy size={48} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Musobaqalar topilmadi</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filtered.map(challenge => {
                        const isLoading = loadingId === challenge.id;

                        // Check if checked in today using local date
                        const now = new Date();
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        let lastCheckInStr = '';
                        if (challenge.lastCheckIn) {
                            const last = new Date(challenge.lastCheckIn);
                            lastCheckInStr = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
                        }
                        const checkedInToday = challenge.isJoined && lastCheckInStr === todayStr;

                        return (
                            <div
                                key={challenge.id}
                                className="bg-white dark:bg-[#1a1a1e] border border-slate-200 dark:border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => setSelectedChallenge(challenge)}
                            >
                                {/* Admin delete */}
                                {currentUser.role === 'admin' && (
                                    <button
                                        onClick={e => { e.stopPropagation(); handleDelete(challenge.id); }}
                                        aria-label="O'chirish"
                                        className="absolute top-3 right-3 z-20 p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}

                                {/* Background icon */}
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <span className="text-8xl">{challenge.icon}</span>
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-2xl border border-indigo-100 dark:border-indigo-500/20">
                                            {challenge.icon}
                                        </div>
                                        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Zap size={12} fill="currentColor" />+{challenge.rewardXP} XP
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{challenge.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">{challenge.description}</p>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl">
                                            <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1"><Calendar size={10} />{t('community.duration') || 'Davomiylik'}</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{challenge.durationDays} {t('community.days') || 'kun'}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl">
                                            <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1"><Users size={10} />{t('community.participants') || 'Ishtirokchi'}</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{challenge.participantsCount.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            if (!challenge.isJoined) {
                                                handleJoin(challenge);
                                            } else if (!checkedInToday) {
                                                handleCheckIn(challenge);
                                            }
                                        }}
                                        disabled={isLoading || checkedInToday}
                                        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${checkedInToday
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default'
                                                : !challenge.isJoined
                                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : checkedInToday ? (
                                            '✅ Bugun bajarildi'
                                        ) : !challenge.isJoined ? (
                                            t('community.join') || "Qo'shilish"
                                        ) : (
                                            '⚡ Check-in'
                                        )}
                                    </button>

                                    {/* Progress bar if joined */}
                                    {challenge.isJoined && (
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                <span>{challenge.totalCheckIns || 0}/{challenge.durationDays} kun</span>
                                                <span>{Math.round(((challenge.totalCheckIns || 0) / challenge.durationDays) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full transition-all"
                                                    style={{ width: `${Math.min(100, ((challenge.totalCheckIns || 0) / challenge.durationDays) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Challenge Detail Modal */}
            {selectedChallenge && (
                <ChallengeDetailModal
                    challenge={selectedChallenge}
                    currentUser={currentUser}
                    onClose={() => setSelectedChallenge(null)}
                    onJoin={async () => {
                        await handleJoin(selectedChallenge);
                    }}
                    onCheckIn={async () => {
                        await handleCheckIn(selectedChallenge);
                    }}
                />
            )}

            {/* Admin: Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-white dark:bg-[#1a1a1e] rounded-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Yangi Musobaqa</h3>

                        {[
                            { label: 'Sarlavha', key: 'title', type: 'text', placeholder: "Masalan: 30 Kunlik Yugurish" },
                            { label: 'Icon (emoji)', key: 'icon', type: 'text', placeholder: '🏆' },
                            { label: 'Tavsif', key: 'description', type: 'text', placeholder: "Musobaqa haqida qisqacha..." },
                        ].map(f => (
                            <div key={f.key}>
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1">{f.label}</label>
                                <input
                                    type={f.type}
                                    value={(createForm as any)[f.key]}
                                    onChange={e => setCreateForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    placeholder={f.placeholder}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        ))}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1">Davomiyligi (kun)</label>
                                <input type="number" min={1} value={createForm.durationDays}
                                    onChange={e => setCreateForm(prev => ({ ...prev, durationDays: Number(e.target.value) }))}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1">Mukofot XP</label>
                                <input type="number" min={10} value={createForm.rewardXP}
                                    onChange={e => setCreateForm(prev => ({ ...prev, rewardXP: Number(e.target.value) }))}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1">Boshlanish</label>
                                <input type="date" value={createForm.startDate}
                                    onChange={e => setCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1">Tugashi</label>
                                <input type="date" value={createForm.endDate}
                                    onChange={e => setCreateForm(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold">Bekor</button>
                            <button
                                onClick={handleCreate}
                                disabled={creating}
                                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-2"
                            >
                                {creating ? <Loader2 size={16} className="animate-spin" /> : 'Yaratish'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
