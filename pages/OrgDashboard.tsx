/**
 * =========================================================================================
 * 🏫 O'QUV MARKAZ DASHBOARD
 * =========================================================================================
 *
 * Teacher: Umumiy, O'quvchilar, Sinflar, Hisobot, Sozlamalar
 * Student: Natijalarim, Guruhim
 * =========================================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard, Users, BookOpen, FileText,
    TrendingUp, Target, Clock, Flame,
    AlertTriangle, Trophy, Search, Plus,
    ChevronDown, Copy, Check, Settings,
    UserPlus, Trash2, ArrowUpDown, X,
    Download, Calendar, CheckCircle2, ListTodo,
    BarChart3, Zap, ArrowLeft
} from 'lucide-react';
import { Organization, OrganizationMember, OrgClass, StudentAnalytics, OrgRole, User, Todo, RoutineTask, TeacherTask } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { logger } from '../utils/logger';

// =========================================================================================
// SHARED SUB-COMPONENTS
// =========================================================================================

const StatCard = ({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) => (
    <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-slate-200/60 dark:border-white/10 hover:shadow-lg transition-all duration-300">
        <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} className="text-white" />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
        </div>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
);

const RiskBadge = ({ level }: { level: 'safe' | 'warning' | 'danger' }) => {
    const config = {
        safe: { label: 'Faol', bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' },
        warning: { label: 'Passiv', bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400' },
        danger: { label: 'Xavfli', bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400' },
    };
    const c = config[level];
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
};

const ProgressBar = ({ value, max, color = 'bg-indigo-500' }: { value: number; max: number; color?: string }) => {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div className="w-full bg-slate-100 dark:bg-white/10 rounded-full h-3 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${pct}%` }} />
        </div>
    );
};

const InviteCodeCard = ({ inviteCode }: { inviteCode: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl p-5 text-white">
            <div className="text-sm opacity-80 mb-2">O'quvchilar uchun invite kod</div>
            <div className="flex items-center gap-3">
                <div className="text-2xl font-mono font-bold tracking-wider flex-1">{inviteCode}</div>
                <button onClick={handleCopy}
                    className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
            </div>
            <div className="text-xs opacity-60 mt-2">O'quvchilar "O'quv Markaz" sahifasida bu kodni kiritadi</div>
        </div>
    );
};

// =========================================================================================
// 📚 STUDENT VIEW — O'quvchi ko'rinishi
// =========================================================================================

interface StudentViewProps {
    org: Organization;
    members: OrganizationMember[];
    myTodos: Todo[];
    myRoutines: RoutineTask[];
    currentUser: User | null;
}

const StudentView = ({ org, members, myTodos, myRoutines, currentUser, classes, assignedTasks, onCompleteTask }: StudentViewProps & { classes: OrgClass[]; assignedTasks: TeacherTask[]; onCompleteTask: (taskId: string) => void }) => {
    const todosTotal = myTodos.length;
    const todosCompleted = myTodos.filter(t => t.completed).length;
    const todoPct = todosTotal > 0 ? Math.round((todosCompleted / todosTotal) * 100) : 0;

    const routinesTotal = myRoutines.length;
    const routinesCompleted = myRoutines.filter(r => r.completed).length;
    const routinePct = routinesTotal > 0 ? Math.round((routinesCompleted / routinesTotal) * 100) : 0;

    const focusHours = currentUser ? Math.round((currentUser.focusMinutes || 0) / 60 * 10) / 10 : 0;
    const streak = currentUser?.streak || 0;

    // O'z membership topish
    const myMembership = members.find(m => m.userId === currentUser?.id);
    const myClassId = myMembership?.classId;
    const myClass = classes.find(c => c.id === myClassId);

    // Guruh a'zolari: faqat o'z sinfi yoki barcha studentlar (agar sinf tayinlanmagan bo'lsa)
    const groupMembers = myClassId
        ? members.filter(m => m.role === 'student' && m.classId === myClassId)
        : members.filter(m => m.role === 'student');

    return (
        <div className="space-y-6">
            {/* Agar guruhga tayinlanmagan bo'lsa */}
            {!myClassId && (
                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-5 border border-amber-200 dark:border-amber-500/20">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
                        <div>
                            <div className="font-semibold text-amber-700 dark:text-amber-400">Guruhga tayinlanmadingiz</div>
                            <div className="text-sm text-amber-600 dark:text-amber-400/70 mt-0.5">O'qituvchingiz sizni guruhga qo'shishini kuting</div>
                        </div>
                    </div>
                </div>
            )}

            {/* O'qituvchi vazifalari */}
            {assignedTasks.length > 0 && (
                <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200/60 dark:border-white/10">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <ListTodo size={20} className="text-violet-500" />
                        O'qituvchi Vazifalari
                        {assignedTasks.filter(t => !t.completed).length > 0 && (
                            <span className="text-xs bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                                {assignedTasks.filter(t => !t.completed).length} kutilmoqda
                            </span>
                        )}
                    </h3>
                    <div className="space-y-2">
                        {assignedTasks.filter(t => !t.completed).map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/[0.03] rounded-xl">
                                <button onClick={() => onCompleteTask(task.id)}
                                    className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-white/20 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-slate-800 dark:text-white">{task.title}</div>
                                    {task.description && <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>}
                                    <div className="flex gap-2 mt-1">
                                        {task.assignedByName && <span className="text-[11px] text-slate-400">👨‍🏫 {task.assignedByName}</span>}
                                        {task.deadline && (
                                            <span className={`text-[11px] ${new Date(task.deadline) < new Date() ? 'text-red-500' : 'text-slate-400'}`}>
                                                📅 {new Date(task.deadline).toLocaleDateString('uz-UZ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {assignedTasks.filter(t => t.completed).length > 0 && (
                            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                                <p className="text-xs font-semibold text-slate-400 mb-2 px-1">✅ Bajarilgan vazifalar</p>
                                {assignedTasks.filter(t => t.completed).slice(0, 3).map(task => (
                                    <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] opacity-80">
                                        <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                                        <span className="text-sm text-slate-500 dark:text-slate-400 line-through truncate">{task.title}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mening Natijalarim */}
            <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200/60 dark:border-white/10">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-500" />
                    Mening Natijalarim
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <StatCard icon={ListTodo} label="Vazifalar" value={`${todosCompleted}/${todosTotal}`}
                        sub={`${todoPct}% bajarildi`} color="bg-indigo-500" />
                    <StatCard icon={CheckCircle2} label="Kundalik Tartib" value={`${routinesCompleted}/${routinesTotal}`}
                        sub={`${routinePct}% bajarildi`} color="bg-violet-500" />
                    <StatCard icon={Clock} label="Fokus Vaqti" value={`${focusHours} soat`}
                        sub="Jami fokus" color="bg-cyan-500" />
                    <StatCard icon={Flame} label="Streak" value={`${streak} kun`}
                        sub="Ketma-ket" color="bg-orange-500" />
                </div>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-slate-600 dark:text-slate-400">📋 Vazifalar</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{todoPct}%</span>
                        </div>
                        <ProgressBar value={todosCompleted} max={todosTotal} color="bg-indigo-500" />
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-slate-600 dark:text-slate-400">🔄 Kundalik Tartib</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{routinePct}%</span>
                        </div>
                        <ProgressBar value={routinesCompleted} max={routinesTotal} color="bg-violet-500" />
                    </div>
                </div>
            </div>

            {/* Guruhim */}
            <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200/60 dark:border-white/10">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users size={20} className="text-emerald-500" />
                    {myClass ? myClass.name : 'Markaz a\'zolari'}
                    <span className="text-sm font-normal text-slate-400 ml-1">({groupMembers.length} o'quvchi)</span>
                </h3>
                {groupMembers.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <Users size={40} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Hozircha guruhda boshqa o'quvchilar yo'q</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {groupMembers.map((member, index) => {
                            const isMe = member.userId === currentUser?.id;
                            return (
                                <div key={member.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isMe
                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20'
                                        : 'bg-slate-50 dark:bg-white/[0.03]'
                                        }`}>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${index < 3
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                        : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                                        }`}>{index + 1}</div>
                                    <img src={member.userAvatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${member.userId}`}
                                        alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-slate-800 dark:text-white truncate flex items-center gap-1.5">
                                            {member.userName || 'Foydalanuvchi'}
                                            {isMe && <span className="text-xs bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-medium">Siz</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Markaz haqida */}
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-500/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 relative z-10">
                    <LayoutDashboard size={20} className="text-violet-600 dark:text-violet-400" />
                    {org.name}
                </h3>
                {org.description && <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 relative z-10">{org.description}</p>}
                <div className="flex gap-4 text-xs text-indigo-900/60 dark:text-indigo-200/60 font-medium relative z-10">
                    <span className="bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">{members.length} a'zo</span>
                    <span className="bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">{org.subscriptionPlan} tarif</span>
                </div>
            </div>
        </div>
    );
};

// =========================================================================================
// TEACHER TABS (existing)
// =========================================================================================

const OverviewTab = ({ analytics, org }: { analytics: StudentAnalytics[]; org: Organization }) => {
    const totalStudents = analytics.length;
    const avgStreak = totalStudents > 0 ? Math.round(analytics.reduce((s, a) => s + a.streak, 0) / totalStudents) : 0;
    const totalFocus = analytics.reduce((s, a) => s + a.focusMinutes, 0);
    const totalFocusHours = Math.round(totalFocus / 60);
    const totalTodos = analytics.reduce((s, a) => s + a.todosTotal, 0);
    const completedTodos = analytics.reduce((s, a) => s + a.todosCompleted, 0);
    const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    const dangerStudents = analytics.filter(a => a.riskLevel === 'danger');
    const warningStudents = analytics.filter(a => a.riskLevel === 'warning');
    const safeStudents = analytics.filter(a => a.riskLevel === 'safe');
    const topStudents = [...analytics].sort((a, b) => b.xp - a.xp).slice(0, 5);

    // 🚦 Signal: Browser notification for danger students (once per session)
    useEffect(() => {
        if (dangerStudents.length > 0) {
            const key = `signal_notified_${org.id}_${new Date().toDateString()}`;
            if (!sessionStorage.getItem(key)) {
                sessionStorage.setItem(key, '1');
                try {
                    if ('Notification' in window && Notification.permission === 'granted') {
                        const names = dangerStudents.slice(0, 3).map(s => s.name).join(', ');
                        new Notification('🔴 Xavfli o\'quvchilar!', {
                            body: `${dangerStudents.length} o'quvchi passiv: ${names}${dangerStudents.length > 3 ? '...' : ''}`,
                            icon: '/vite.svg',
                        });
                    }
                } catch (e) { /* silent */ }
            }
        }
    }, [dangerStudents.length]);

    return (
        <div className="space-y-6">
            {/* Signal Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`rounded-2xl p-5 text-center border relative overflow-hidden shadow-sm transition-all ${dangerStudents.length > 0
                    ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-500/10 dark:to-rose-500/10 border-red-200/60 dark:border-red-500/20 group hover:shadow-red-500/10 cursor-pointer'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 opacity-70'}`}>
                    {dangerStudents.length > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-500/20 to-transparent rounded-bl-full" />}
                    <div className="text-3xl font-black text-red-600 dark:text-red-400 mb-1 relative z-10">{dangerStudents.length}</div>
                    <div className="text-xs uppercase tracking-wider text-red-500/80 dark:text-red-400/80 font-bold relative z-10">🔴 Xavfli</div>
                </div>
                <div className={`rounded-2xl p-5 text-center border relative overflow-hidden shadow-sm transition-all ${warningStudents.length > 0
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-amber-200/60 dark:border-amber-500/20 group hover:shadow-amber-500/10 cursor-pointer'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 opacity-70'}`}>
                    {warningStudents.length > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-bl-full" />}
                    <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mb-1 relative z-10">{warningStudents.length}</div>
                    <div className="text-xs uppercase tracking-wider text-amber-500/80 dark:text-amber-400/80 font-bold relative z-10">🟡 Passiv</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-2xl p-5 text-center border border-emerald-200/60 dark:border-emerald-500/20 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-500/20 to-transparent rounded-bl-full" />
                    <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1 relative z-10">{safeStudents.length}</div>
                    <div className="text-xs uppercase tracking-wider text-emerald-500/80 dark:text-emerald-400/80 font-bold relative z-10">🟢 Faol</div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon={Users} label="Jami o'quvchilar" value={totalStudents} color="bg-indigo-500" />
            </div>

            {/* 🔴 Danger Students */}
            {dangerStudents.length > 0 && (
                <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl p-5 border border-red-200/60 dark:border-red-500/20">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle size={18} className="text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-red-700 dark:text-red-400">
                                Xavf ostidagi o'quvchilar ({dangerStudents.length})
                            </h3>
                            <p className="text-xs text-red-500/70 dark:text-red-400/50">Berilgan vazifalarning ko'p qismi bajarilmagan</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {dangerStudents.map(s => {
                            const daysSince = Math.floor((Date.now() - s.lastActive) / (1000 * 60 * 60 * 24));
                            return (
                                <div key={s.userId} className="flex items-center gap-3 bg-white dark:bg-white/5 rounded-xl p-3">
                                    <img src={s.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-slate-800 dark:text-white truncate">{s.name}</div>
                                        <div className="text-xs text-red-500 flex gap-3 font-medium">
                                            <span>Bajarilish: {Math.round((s.todosCompleted + s.routinesCompleted) / Math.max(s.todosTotal + s.routinesTotal, 1) * 100)}%</span>
                                            <span>Vazifa: {s.todosCompleted}/{s.todosTotal}</span>
                                        </div>
                                    </div>
                                    <RiskBadge level="danger" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 🟡 Warning Students */}
            {warningStudents.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-5 border border-amber-200/60 dark:border-amber-500/20">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={16} className="text-amber-500" />
                        <h3 className="font-semibold text-sm text-amber-700 dark:text-amber-400">
                            Diqqat talab ({warningStudents.length})
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {warningStudents.map(s => (
                            <div key={s.userId} className="flex items-center gap-2 bg-white dark:bg-white/5 rounded-lg px-3 py-2">
                                <img src={s.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{s.name}</span>
                                <span className="text-[10px] text-amber-500">🔥{s.streak}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 🏆 TOP Students */}
            {topStudents.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 rounded-2xl p-6 border border-amber-100 dark:border-amber-500/20 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
                    <div className="flex items-center gap-3 mb-5 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                            <Trophy size={20} className="text-amber-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">TOP O'quvchilar</h3>
                    </div>
                    <div className="space-y-3 relative z-10">
                        {topStudents.map((s, i) => (
                            <div key={s.userId} className="flex items-center gap-4 bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-white/50 dark:border-white/5 backdrop-blur-sm">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shadow-inner ${i === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-amber-500/20' :
                                    i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-500/20' :
                                        i === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white shadow-orange-500/20' :
                                            'bg-white dark:bg-white/10 text-slate-400 dark:text-slate-500 shadow-sm'
                                    }`}>
                                    {i + 1}
                                </div>
                                <img src={s.avatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-white/10" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-slate-800 dark:text-white truncate">{s.name}</div>
                                    <div className="text-xs font-medium text-slate-500 mix-blend-multiply dark:mix-blend-normal">{s.xp} XP • 🔥{s.streak} • ✅{s.todosCompleted}/{s.todosTotal}</div>
                                </div>
                                <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/30">
                                    Lvl {s.level}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 📊 Student Performance Ranking */}
            {analytics.length > 0 && (
                <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200/60 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center">
                            <BarChart3 size={20} className="text-cyan-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Vazifa Bajarilishi</h3>
                    </div>
                    <div className="space-y-3">
                        {[...analytics]
                            .sort((a, b) => {
                                const pctA = a.todosTotal > 0 ? a.todosCompleted / a.todosTotal : 0;
                                const pctB = b.todosTotal > 0 ? b.todosCompleted / b.todosTotal : 0;
                                return pctB - pctA;
                            })
                            .slice(0, 10)
                            .map((s, i) => {
                                const pct = s.todosTotal > 0 ? Math.round((s.todosCompleted / s.todosTotal) * 100) : 0;
                                return (
                                    <div key={s.userId} className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400 w-4 text-right">{i + 1}</span>
                                        <img src={s.avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{s.name}</span>
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-2">{pct}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-500 ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* 📈 Streak Distribution */}
            {analytics.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50 to-orange-50 dark:from-indigo-500/5 dark:to-orange-500/5 rounded-2xl p-6 border border-slate-200/60 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full pointer-events-none" />
                    <div className="flex items-center gap-3 mb-5 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                            <Flame size={20} className="text-orange-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Streak Taqsimoti</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                            <div className="text-xl font-bold text-red-600 dark:text-red-400">
                                {analytics.filter(s => s.streak === 0).length}
                            </div>
                            <div className="text-[11px] text-red-500 mt-0.5">0 kun (yo'q)</div>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                {analytics.filter(s => s.streak >= 1 && s.streak <= 3).length}
                            </div>
                            <div className="text-[11px] text-amber-500 mt-0.5">1-3 kun</div>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                {analytics.filter(s => s.streak > 3).length}
                            </div>
                            <div className="text-[11px] text-emerald-500 mt-0.5">3+ kun 🔥</div>
                        </div>
                    </div>
                </div>
            )}

            <InviteCodeCard inviteCode={org.inviteCode} />
        </div>
    );
};



const StudentsTab = ({ analytics, members, classes, onRemoveMember, onChangeRole, onAssignToClass }: {
    analytics: StudentAnalytics[];
    members: OrganizationMember[];
    classes: OrgClass[];
    onRemoveMember: (userId: string) => void;
    onChangeRole: (memberId: string, role: OrgRole) => void;
    onAssignToClass: (memberId: string, classId: string | null) => void;
}) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'safe' | 'warning' | 'danger'>('all');
    const [sortBy, setSortBy] = useState<'xp' | 'streak' | 'name'>('xp');

    const filtered = useMemo(() => {
        let result = [...analytics];
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(s => s.name.toLowerCase().includes(q));
        }
        if (filter !== 'all') result = result.filter(s => s.riskLevel === filter);
        result.sort((a, b) => {
            if (sortBy === 'xp') return b.xp - a.xp;
            if (sortBy === 'streak') return b.streak - a.streak;
            return a.name.localeCompare(b.name);
        });
        return result;
    }, [analytics, search, filter, sortBy]);

    // memberId topish uchun helper
    const getMember = (userId: string) => members.find(m => m.userId === userId);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="O'quvchi qidirish..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
                <div className="flex gap-2">
                    {(['all', 'safe', 'warning', 'danger'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filter === f
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                                }`}>
                            {f === 'all' ? 'Barchasi' : f === 'safe' ? 'Faol' : f === 'warning' ? 'Passiv' : 'Xavfli'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                {filtered.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Users size={48} className="mx-auto mb-3 opacity-30" />
                        <p>O'quvchilar topilmadi</p>
                    </div>
                ) : filtered.map(s => {
                    const member = getMember(s.userId);
                    const daysSince = Math.floor((Date.now() - s.lastActive) / (1000 * 60 * 60 * 24));
                    const memberClass = classes.find(c => c.id === member?.classId);
                    return (
                        <div key={s.userId}
                            className="p-4 bg-white dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/10 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <img src={s.avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-slate-800 dark:text-white truncate flex items-center gap-2">
                                        {s.name}
                                        {memberClass && (
                                            <span className="text-xs bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">
                                                {memberClass.name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                                        <span>✅ {s.todosCompleted}/{s.todosTotal}</span>
                                        <span>🔄 {s.routinesCompleted}/{s.routinesTotal}</span>
                                        <span>⏱ {Math.round(s.focusMinutes / 60)}h</span>
                                        <span>🔥 {s.streak}</span>
                                        {daysSince > 0 && <span className="text-red-400">{daysSince}d</span>}
                                    </div>
                                </div>
                                <RiskBadge level={s.riskLevel} />
                            </div>
                            {/* Amallar */}
                            {member && (
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                                    {/* Guruhga tayinlash */}
                                    <select
                                        value={member.classId || ''}
                                        onChange={e => onAssignToClass(member.id, e.target.value || null)}
                                        className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                                    >
                                        <option value="">Guruhsiz</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {/* Teacher qilish */}
                                    <button
                                        onClick={() => {
                                            if (confirm(`${s.name} ni teacher qilmoqchimisiz?`)) {
                                                onChangeRole(member.id, 'teacher');
                                            }
                                        }}
                                        className="px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-medium hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors whitespace-nowrap"
                                    >
                                        Teacher qilish
                                    </button>


                                    {/* Chiqarish */}
                                    <button
                                        onClick={() => onRemoveMember(s.userId)}
                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ClassesTab = ({ classes, members, onCreateClass, onDeleteClass, onAssignToClass }: {
    classes: OrgClass[];
    members: OrganizationMember[];
    onCreateClass: (name: string) => void;
    onDeleteClass: (id: string) => void;
    onAssignToClass: (memberId: string, classId: string | null) => void;
}) => {
    const [showCreate, setShowCreate] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [expandedClass, setExpandedClass] = useState<string | null>(null);

    const handleCreate = () => {
        if (!newClassName.trim()) return;
        onCreateClass(newClassName.trim());
        setNewClassName('');
        setShowCreate(false);
    };

    // Guruhsiz studentlar
    const unassignedStudents = members.filter(m => m.role === 'student' && !m.classId);
    // Guruh bo'yicha studentlar
    const getClassStudents = (classId: string) => members.filter(m => m.classId === classId && m.role === 'student');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-white">Guruhlar</h3>
                <button onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                    <Plus size={16} /> Yangi guruh
                </button>
            </div>

            {showCreate && (
                <div className="bg-white dark:bg-white/5 rounded-xl p-4 border border-indigo-200 dark:border-indigo-500/30 flex gap-3">
                    <input type="text" value={newClassName} onChange={e => setNewClassName(e.target.value)}
                        placeholder="Guruh nomi (masalan: IELTS A2)"
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        onKeyDown={e => e.key === 'Enter' && handleCreate()} />
                    <button onClick={handleCreate}
                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Yaratish</button>
                    <button onClick={() => { setShowCreate(false); setNewClassName(''); }}
                        className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl"><X size={18} /></button>
                </div>
            )}

            {/* Guruhsiz studentlar */}
            {unassignedStudents.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 rounded-2xl p-5 border border-amber-200/60 dark:border-amber-500/20 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full pointer-events-none" />
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                            <AlertTriangle size={18} className="text-amber-500" />
                        </div>
                        <h4 className="font-bold text-slate-800 dark:text-white">
                            Guruhsiz o'quvchilar ({unassignedStudents.length})
                        </h4>
                    </div>
                    <div className="space-y-2 relative z-10">
                        {unassignedStudents.map(m => (
                            <div key={m.id} className="flex items-center gap-3 bg-white/60 dark:bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/50 dark:border-white/5">
                                <img src={m.userAvatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${m.userId}`}
                                    alt="" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-slate-800 dark:text-white truncate">{m.userName || 'Foydalanuvchi'}</div>
                                </div>
                                <select
                                    defaultValue=""
                                    onChange={e => { if (e.target.value) onAssignToClass(m.id, e.target.value); }}
                                    className="px-3 py-1.5 bg-white dark:bg-white/10 border border-amber-200 dark:border-white/10 rounded-lg text-xs font-medium cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 transition-colors focus:ring-2 focus:ring-amber-500/20 outline-none">
                                    <option value="" disabled>Guruhga qo'shish...</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {classes.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                    <p>Hozircha guruhlar yo'q</p>
                    <p className="text-xs mt-1">Avval guruh yarating, keyin studentlarni tayinlang</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {classes.map(cls => {
                        const classStudents = getClassStudents(cls.id);
                        const isExpanded = expandedClass === cls.id;
                        return (
                            <div key={cls.id} className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden shadow-sm hover:border-indigo-500/30 transition-colors">
                                <div className="flex items-center gap-4 p-5 cursor-pointer bg-slate-50/30 dark:bg-white/[0.01] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors"
                                    onClick={() => setExpandedClass(isExpanded ? null : cls.id)}>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 flex items-center justify-center shadow-inner">
                                        <BookOpen size={22} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-lg text-slate-900 dark:text-white">{cls.name}</div>
                                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                                            {classStudents.length} o'quvchi
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={e => { e.stopPropagation(); onDeleteClass(cls.id); }}
                                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 sm:opacity-100">
                                            <Trash2 size={18} />
                                        </button>
                                        <div className={`p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : ''}`}>
                                            <ChevronDown size={20} />
                                        </div>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-white/5">
                                        {classStudents.length === 0 ? (
                                            <p className="text-sm text-slate-400 py-3 text-center">Hali o'quvchi yo'q. O'quvchilar tabidan guruhga tayinlang.</p>
                                        ) : (
                                            <div className="space-y-2 mt-3">
                                                {classStudents.map(m => (
                                                    <div key={m.id} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-lg">
                                                        <img src={m.userAvatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${m.userId}`}
                                                            alt="" className="w-8 h-8 rounded-full object-cover" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-sm text-slate-800 dark:text-white truncate">{m.userName || 'Foydalanuvchi'}</div>
                                                        </div>
                                                        <button onClick={() => onAssignToClass(m.id, null)}
                                                            className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10">
                                                            Chiqarish
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// =========================================================================================
// TEACHER TASKS TAB
// =========================================================================================
const TasksTab = ({ tasks, members, classes, onAssignTask, onDeleteTask }: {
    tasks: TeacherTask[];
    members: OrganizationMember[];
    classes: OrgClass[];
    onAssignTask: (task: { title: string; description?: string; assignedTo?: string; classId?: string; deadline?: string }) => void;
    onDeleteTask: (taskId: string) => void;
}) => {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', deadline: '' });
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

    if (!selectedClassId) {
        return (
            <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 dark:text-white">Guruhni tanlang (Vazifalar)</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map(c => (
                        <div key={c.id} onClick={() => setSelectedClassId(c.id)}
                            className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 hover:border-indigo-500/50 cursor-pointer transition-all hover:shadow-md group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <BookOpen size={24} />
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-slate-900 dark:text-white">{c.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {members.filter(m => m.classId === c.id && m.role === 'student').length} o'quvchi
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {classes.length === 0 && (
                        <div className="text-center py-10 col-span-full border-2 border-dashed rounded-2xl border-slate-200 dark:border-white/10">
                            <BookOpen size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Hozircha guruhlar yo'q</p>
                            <p className="text-xs text-slate-400 mt-1">Oldin "Guruhlar" bo'limidan guruh yarating</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const currentClass = classes.find(c => c.id === selectedClassId);
    const students = members.filter(m => m.role === 'student' && m.classId === selectedClassId);
    const classTasks = tasks.filter(t => t.classId === selectedClassId);

    const filteredTasks = classTasks.filter(t => {
        if (filter === 'pending') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    });

    const handleSubmit = () => {
        if (!taskForm.title.trim()) return;
        onAssignTask({
            title: taskForm.title.trim(),
            description: taskForm.description.trim() || undefined,
            assignedTo: taskForm.assignedTo || undefined,
            classId: selectedClassId,
            deadline: taskForm.deadline || undefined,
        });
        setTaskForm({ title: '', description: '', assignedTo: '', deadline: '' });
        setShowCreate(false);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <button onClick={() => { setSelectedClassId(null); setShowCreate(false); }}
                        className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-600 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                            {currentClass?.name}
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-md font-semibold">
                                {students.length} o'quvchi
                            </span>
                        </h3>
                    </div>
                </div>
                <button onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center">
                    <Plus size={16} /> Vazifa berish
                </button>
            </div>

            {showCreate && (
                <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-500/30 space-y-3 animate-fade-in">
                    <input type="text" value={taskForm.title}
                        onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Vazifa nomi *"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                    <textarea value={taskForm.description}
                        onChange={e => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Tavsif (ixtiyoriy)"
                        rows={2}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select value={taskForm.assignedTo}
                            onChange={e => setTaskForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                            className="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium">
                            <option value="">Barcha guruh o'quvchilariga</option>
                            {students.map(s => <option key={s.userId} value={s.userId}>{s.userName || 'Foydalanuvchi'}</option>)}
                        </select>
                        <input type="date" value={taskForm.deadline}
                            onChange={e => setTaskForm(prev => ({ ...prev, deadline: e.target.value }))}
                            className="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm" />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button onClick={() => setShowCreate(false)}
                            className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-sm font-medium">Bekor</button>
                        <button onClick={handleSubmit}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">Yuborish</button>
                    </div>
                </div>
            )}

            {/* Filtr */}
            <div className="flex gap-2">
                {(['all', 'pending', 'completed'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f
                            ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`}>
                        {f === 'all' ? `Barchasi (${tasks.length})` : f === 'pending' ? `Kutilmoqda (${tasks.filter(t => !t.completed).length})` : `Bajarildi (${tasks.filter(t => t.completed).length})`}
                    </button>
                ))}
            </div>

            {/* Vazifalar ro'yxati */}
            {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    <ListTodo size={48} className="mx-auto mb-3 opacity-30" />
                    <p>Hozircha vazifalar yo'q</p>
                    <p className="text-xs mt-1">Yuqoridagi tugma orqali vazifa bering</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredTasks.map(task => (
                        <div key={task.id} className={`p-4 rounded-xl border transition-all ${task.completed
                            ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
                            : 'bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10'}`}>
                            <div className="flex items-start gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${task.completed
                                    ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-slate-100 dark:bg-white/10'}`}>
                                    {task.completed ? <Check size={14} className="text-emerald-600" /> : <ListTodo size={12} className="text-slate-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium text-sm ${task.completed ? 'text-emerald-700 dark:text-emerald-400 line-through' : 'text-slate-800 dark:text-white'}`}>
                                        {task.title}
                                    </div>
                                    {task.description && <p className="text-xs text-slate-400 mt-1">{task.description}</p>}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {task.assignedToName && (
                                            <span className="text-[11px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">
                                                👤 {task.assignedToName}
                                            </span>
                                        )}
                                        {task.deadline && (
                                            <span className={`text-[11px] px-2 py-0.5 rounded-md ${new Date(task.deadline) < new Date() && !task.completed
                                                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                                                : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>
                                                📅 {new Date(task.deadline).toLocaleDateString('uz-UZ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => onDeleteTask(task.id)}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ReportsTab = ({ analytics, org }: { analytics: StudentAnalytics[]; org: Organization }) => {
    const totalStudents = analytics.length;
    const activeStudents = analytics.filter(a => a.riskLevel === 'safe').length;
    const dangerStudents = analytics.filter(a => a.riskLevel === 'danger').length;
    const avgXp = totalStudents > 0 ? Math.round(analytics.reduce((s, a) => s + a.xp, 0) / totalStudents) : 0;
    const avgStreak = totalStudents > 0 ? Math.round(analytics.reduce((s, a) => s + a.streak, 0) / totalStudents) : 0;
    const totalFocus = Math.round(analytics.reduce((s, a) => s + a.focusMinutes, 0) / 60);

    const handleExport = () => {
        const report = [
            `${org.name} — Hisobot`, `Sana: ${new Date().toLocaleDateString('uz-UZ')}`, '',
            `Jami: ${totalStudents} | Faol: ${activeStudents} | Xavfli: ${dangerStudents}`,
            `O'rtacha XP: ${avgXp} | Streak: ${avgStreak} | Fokus: ${totalFocus}h`, '',
            `--- O'quvchilar ---`,
            ...analytics.map((s, i) => `${i + 1}. ${s.name} | ✅${s.todosCompleted}/${s.todosTotal} | 🔄${s.routinesCompleted}/${s.routinesTotal} | 🔥${s.streak} | ${s.riskLevel}`)
        ].join('\n');
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `${org.name.replace(/\s/g, '_')}_hisobot_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click(); URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-white">Hisobot Xulosasi</h3>
                <button onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                    <Download size={16} /> Yuklab olish
                </button>
            </div>
            <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200/60 dark:border-white/10 space-y-6">
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <Calendar size={16} />
                    <span>{new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-slate-50 dark:bg-white/5 rounded-xl">
                        <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalStudents}</div>
                        <div className="text-xs text-slate-500 mt-1">Jami</div>
                    </div>
                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeStudents}</div>
                        <div className="text-xs text-slate-500 mt-1">Faol</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-500/10 rounded-xl">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{dangerStudents}</div>
                        <div className="text-xs text-slate-500 mt-1">Xavfli</div>
                    </div>
                </div>
                <div className="space-y-3">
                    {[['O\'rtacha Streak', `${avgStreak} kun`], ['Jami Fokus', `${totalFocus} soat`],
                    ['Faollik', `${totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0}%`]
                    ].map(([label, val]) => (
                        <div key={label} className="flex justify-between text-sm">
                            <span className="text-slate-500">{label}</span>
                            <span className="font-semibold text-slate-800 dark:text-white">{val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// =========================================================================================
// MAIN COMPONENT
// =========================================================================================

type OrgTab = 'overview' | 'students' | 'classes' | 'tasks' | 'reports' | 'settings';

export const OrgDashboard = () => {
    const [allOrgs, setAllOrgs] = useState<{ org: Organization; role: OrgRole }[]>([]);
    const [selectedOrgIndex, setSelectedOrgIndex] = useState(0);
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [analytics, setAnalytics] = useState<StudentAnalytics[]>([]);
    const [classes, setClasses] = useState<OrgClass[]>([]);
    const [activeTab, setActiveTab] = useState<OrgTab>('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [joinError, setJoinError] = useState('');
    const [showOrgSelector, setShowOrgSelector] = useState(false);

    // Student-specific data
    const [myTodos, setMyTodos] = useState<Todo[]>([]);
    const [myRoutines, setMyRoutines] = useState<RoutineTask[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [teacherTasks, setTeacherTasks] = useState<TeacherTask[]>([]);

    const { t } = useLanguage();

    const org = allOrgs[selectedOrgIndex]?.org || null;
    const myRole = allOrgs[selectedOrgIndex]?.role || 'student';

    const loadOrgData = async (orgId: string, role: OrgRole) => {
        try {
            if (role === 'teacher') {
                // Teacher: members + analytics + classes
                const [membersData, analyticsData, classesData, tasksData] = await Promise.all([
                    api.getOrgMembers(orgId),
                    api.getStudentAnalytics(orgId),
                    api.getClasses(orgId),
                    api.getTeacherTasks(orgId),
                ]);
                setMembers(membersData);
                setAnalytics(analyticsData);
                setClasses(classesData);
                setTeacherTasks(tasksData);
            } else {
                // Student: members + own todos/routines + user profile
                const today = new Date().toISOString().split('T')[0];
                const [membersData, todosData, routinesData, classesData, myTasksData] = await Promise.all([
                    api.getOrgMembers(orgId),
                    api.getTodos(),
                    api.getRoutine(today),
                    api.getClasses(orgId),
                    api.getMyAssignedTasks(),
                ]);
                setMembers(membersData);
                setMyTodos(todosData);
                setMyRoutines(routinesData);
                setClasses(classesData);
                setTeacherTasks(myTasksData);
                // Get current user data from supabase auth
                try {
                    const { data: { user: authUser } } = await (await import('../services/supabaseClient')).supabase.auth.getUser();
                    if (authUser) {
                        const userData = await api.getUserById(authUser.id);
                        setCurrentUser(userData);
                    }
                } catch (e) { logger.error('Error fetching current user', e); }
                api.updateGroupVisit(orgId).catch(() => { });
            }
        } catch (err: any) {
            logger.error('Error loading org data', err);
        }
    };

    const loadOrgs = async () => {
        try {
            setLoading(true);
            const orgs = await api.getMyOrganizations();
            setAllOrgs(orgs);
            if (orgs.length > 0) {
                await loadOrgData(orgs[0].org.id, orgs[0].role);
            }
        } catch (err: any) {
            logger.error('Error loading orgs', err);
            setError(err.message || 'Ma\'lumotlarni yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadOrgs(); }, []);

    const handleSwitchOrg = async (index: number) => {
        setSelectedOrgIndex(index);
        setShowOrgSelector(false);
        setActiveTab('overview');
        await loadOrgData(allOrgs[index].org.id, allOrgs[index].role);
    };

    const handleJoinOrg = async () => {
        if (!inviteCode.trim() || joining) return;
        setJoining(true);
        setJoinError('');
        try {
            await api.joinOrganization(inviteCode.trim().toUpperCase());
            setInviteCode('');
            await loadOrgs();
        } catch (err: any) {
            setJoinError(err.message || 'Qo\'shilishda xatolik');
        } finally {
            setJoining(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!org) return;
        if (!confirm('Bu o\'quvchini tashkilotdan chiqarmoqchimisiz?')) return;
        try {
            await api.removeOrgMember(org.id, userId);
            setMembers(prev => prev.filter(m => m.userId !== userId));
            setAnalytics(prev => prev.filter(a => a.userId !== userId));
        } catch (err: any) { alert(err.message); }
    };

    const handleChangeRole = async (memberId: string, role: OrgRole) => {
        try {
            await api.updateMemberRole(memberId, role);
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
        } catch (err: any) { alert(err.message); }
    };

    const handleCreateClass = async (name: string) => {
        if (!org) return;
        try {
            const newClass = await api.createClass(org.id, name);
            setClasses(prev => [...prev, newClass]);
        } catch (err: any) { alert(err.message); }
    };

    const handleDeleteClass = async (classId: string) => {
        if (!confirm('Bu guruhni o\'chirmoqchimisiz?')) return;
        try {
            await api.deleteClass(classId);
            setClasses(prev => prev.filter(c => c.id !== classId));
            setMembers(prev => prev.map(m => m.classId === classId ? { ...m, classId: undefined } : m));
        } catch (err: any) { alert(err.message); }
    };

    const handleAssignToClass = async (memberId: string, classId: string | null) => {
        try {
            if (classId) {
                await api.assignStudentToClass(memberId, classId);
            } else {
                await api.removeStudentFromClass(memberId);
            }
            setMembers(prev => prev.map(m => m.id === memberId ? { ...m, classId: classId || undefined } : m));
        } catch (err: any) { alert(err.message); }
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-sm text-slate-400">Yuklanmoqda...</span>
                </div>
            </div>
        );
    }

    // ── Onboarding (no org) ──
    if (allOrgs.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center max-w-md w-full px-4">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <LayoutDashboard size={36} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                        O'quv Markazga Qo'shiling
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                        O'qituvchingizdan olingan invite kodni kiriting
                    </p>
                    <div className="space-y-3">
                        <input type="text" value={inviteCode}
                            onChange={e => setInviteCode(e.target.value.toUpperCase())}
                            placeholder="XXXX-XXXX" maxLength={9}
                            className="w-full px-5 py-4 text-center text-2xl font-mono font-bold tracking-[0.3em] rounded-2xl bg-slate-100 dark:bg-white/10 border-2 border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none dark:text-white placeholder-slate-300 dark:placeholder-white/20 transition-colors"
                            onKeyDown={e => e.key === 'Enter' && handleJoinOrg()} />
                        <button onClick={handleJoinOrg} disabled={!inviteCode.trim() || joining}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2">
                            <UserPlus size={20} />
                            {joining ? 'Qo\'shilmoqda...' : 'Qo\'shilish'}
                        </button>
                        {joinError && <p className="text-sm text-red-500 font-medium">{joinError}</p>}
                    </div>
                </div>
            </div>
        );
    }

    if (!org) return null;

    const isTeacher = myRole === 'teacher';
    const isStudent = myRole === 'student';

    // ── Teacher Tabs ──
    const teacherTabs: { key: OrgTab; label: string; icon: React.ElementType }[] = [
        { key: 'overview', label: 'Umumiy', icon: LayoutDashboard },
        { key: 'students', label: 'O\'quvchilar', icon: Users },
        { key: 'classes', label: 'Guruhlar', icon: BookOpen },
        { key: 'tasks', label: 'Vazifalar', icon: ListTodo },
        { key: 'reports', label: 'Hisobot', icon: FileText },
        { key: 'settings', label: 'Sozlamalar', icon: Settings },
    ];

    const handleAssignTask = async (task: { title: string; description?: string; assignedTo?: string; classId?: string; deadline?: string }) => {
        if (!org) return;
        try {
            const newTasks = await api.assignTask(org.id, task);
            setTeacherTasks(prev => [...newTasks, ...prev]);
        } catch (err: any) { alert(err.message); }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            await api.deleteAssignedTask(taskId);
            setTeacherTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (err: any) { alert(err.message); }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Header with org selector */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/25">
                    {org.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">{org.name}</h1>
                        {allOrgs.length > 1 && (
                            <div className="relative">
                                <button onClick={() => setShowOrgSelector(!showOrgSelector)}
                                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                                    <ChevronDown size={16} className="text-slate-400" />
                                </button>
                                {showOrgSelector && (
                                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1a1a1e] rounded-xl shadow-xl border border-slate-200 dark:border-white/10 py-1 z-50 min-w-[220px]">
                                        {allOrgs.map((item, i) => (
                                            <button key={item.org.id} onClick={() => handleSwitchOrg(i)}
                                                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3 ${i === selectedOrgIndex ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`}>
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                    {item.org.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-slate-900 dark:text-white truncate">{item.org.name}</div>
                                                    <div className="text-xs text-slate-400">
                                                        {item.role === 'teacher' ? 'O\'qituvchi' : 'O\'quvchi'}
                                                    </div>
                                                </div>
                                                {i === selectedOrgIndex && <Check size={14} className="ml-auto text-indigo-500 flex-shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        {isTeacher
                            ? `${analytics.length} o'quvchi • ${classes.length} sinf • O'qituvchi`
                            : `${members.filter(m => m.role === 'student').length} guruh a'zosi • O'quvchi`
                        }
                    </div>
                </div>
            </div>

            {/* ═══ STUDENT VIEW ═══ */}
            {isStudent && (
                <StudentView
                    org={org}
                    members={members}
                    myTodos={myTodos}
                    myRoutines={myRoutines}
                    currentUser={currentUser}
                    classes={classes}
                    assignedTasks={teacherTasks}
                    onCompleteTask={async (taskId) => {
                        try {
                            await api.completeAssignedTask(taskId);
                            setTeacherTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t));
                        } catch (err: any) { alert(err.message); }
                    }}
                />
            )}



            {/* ═══ TEACHER VIEW ═══ */}
            {isTeacher && (
                <>
                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl overflow-x-auto">
                        {teacherTabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${activeTab === tab.key
                                        ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                                        }`}>
                                    <Icon size={16} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && <OverviewTab analytics={analytics} org={org} />}
                    {activeTab === 'students' && (
                        <StudentsTab analytics={analytics} members={members} classes={classes}
                            onRemoveMember={handleRemoveMember} onChangeRole={handleChangeRole}
                            onAssignToClass={handleAssignToClass} />
                    )}
                    {activeTab === 'classes' && (
                        <ClassesTab classes={classes} members={members}
                            onCreateClass={handleCreateClass} onDeleteClass={handleDeleteClass}
                            onAssignToClass={handleAssignToClass} />
                    )}
                    {activeTab === 'tasks' && (
                        <TasksTab
                            tasks={teacherTasks}
                            members={members}
                            classes={classes}
                            onAssignTask={handleAssignTask}
                            onDeleteTask={handleDeleteTask}
                        />
                    )}
                    {activeTab === 'reports' && <ReportsTab analytics={analytics} org={org} />}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <InviteCodeCard inviteCode={org.inviteCode} />
                            <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200/60 dark:border-white/10">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Settings size={20} className="text-indigo-500" />
                                    Markaz Ma'lumotlari
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nomi</label>
                                        <div className="text-lg font-semibold text-slate-900 dark:text-white">{org.name}</div>
                                    </div>
                                    {org.description && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Tavsif</label>
                                            <div className="text-sm text-slate-700 dark:text-slate-300">{org.description}</div>
                                        </div>
                                    )}
                                    <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400">
                                        <span>Tarif: <strong className="text-slate-900 dark:text-white">{org.subscriptionPlan}</strong></span>
                                        <span>Max: <strong className="text-slate-900 dark:text-white">{org.maxStudents} o'quvchi</strong></span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200/60 dark:border-white/10">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <UserPlus size={20} className="text-emerald-500" />
                                    Boshqa Markazga Qo'shilish
                                </h3>
                                <div className="flex gap-3">
                                    <input type="text" value={inviteCode}
                                        onChange={e => setInviteCode(e.target.value.toUpperCase())}
                                        placeholder="XXXX-XXXX" maxLength={9}
                                        className="flex-1 px-4 py-3 font-mono font-bold tracking-widest rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 focus:border-indigo-500 focus:outline-none dark:text-white"
                                        onKeyDown={e => e.key === 'Enter' && handleJoinOrg()} />
                                    <button onClick={handleJoinOrg} disabled={!inviteCode.trim() || joining}
                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all">
                                        {joining ? '...' : 'Qo\'shilish'}
                                    </button>
                                </div>
                                {joinError && <p className="text-sm text-red-500 mt-2">{joinError}</p>}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
