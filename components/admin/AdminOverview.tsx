import React from 'react';
import {
    Users, Activity, Ban, TrendingUp, Monitor, Smartphone
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { AdminUser } from '../../types';
import { Loader2 } from 'lucide-react';

interface AdminOverviewProps {
    isLoading: boolean;
    usersList: AdminUser[];
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ isLoading, usersList }) => {
    if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

    const activeUsers = usersList.filter(u => u.status === 'Active').length;
    const bannedUsers = usersList.filter(u => u.status === 'Banned').length;
    const totalUsers = usersList.length || 1;
    const activePercent = Math.round((activeUsers / totalUsers) * 100);
    const bannedPercent = Math.round((bannedUsers / totalUsers) * 100);

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* HERO STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Users Card */}
                <div className="relative overflow-hidden bg-white dark:bg-[#1e1e24] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-indigo-500/10 group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <Users size={120} className="text-indigo-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                                <Users size={24} />
                            </div>
                            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Jami Foydalanuvchilar</span>
                        </div>
                        <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                            {usersList.length.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-full w-fit">
                            <TrendingUp size={16} /> +12% <span className="text-slate-400 font-normal">bu hafta</span>
                        </div>
                    </div>
                </div>

                {/* Active Users Card */}
                <div className="relative overflow-hidden bg-white dark:bg-[#1e1e24] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-emerald-500/10 group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12 duration-500">
                        <Activity size={120} className="text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
                                <Activity size={24} />
                            </div>
                            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Faol Foydalanuvchilar</span>
                        </div>
                        <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                            {activeUsers.toLocaleString()}
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-white/5 h-3 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${activePercent}%` }}></div>
                        </div>
                        <div className="mt-2 text-xs font-bold text-slate-400 text-right">{activePercent}% Faollik</div>
                    </div>
                </div>

                {/* Banned Users Card */}
                <div className="relative overflow-hidden bg-white dark:bg-[#1e1e24] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-red-500/10 group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <Ban size={120} className="text-red-500" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-50 dark:bg-red-500/20 rounded-2xl text-red-600 dark:text-red-400">
                                <Ban size={24} />
                            </div>
                            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Bloklanganlar</span>
                        </div>
                        <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                            {bannedUsers.toLocaleString()}
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-white/5 h-3 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: `${Math.max(bannedPercent, 5)}%` }}></div>
                        </div>
                        <div className="mt-2 text-xs font-bold text-slate-400 text-right">{bannedPercent}% Hissan</div>
                    </div>
                </div>
            </div>

            {/* DETAILED STATS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Growth Chart */}
                <div className="bg-white dark:bg-[#1e1e24] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                        <TrendingUp size={24} className="text-indigo-500" />
                        Foydalanuvchilar O'sishi
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height={256}>
                            <AreaChart data={usersList.reduce((acc: any[], user) => {
                                const date = user.joinedDate || new Date().toISOString().split('T')[0];
                                const existing = acc.find(i => i.date === date);
                                if (existing) existing.count++;
                                else acc.push({ date, count: 1 });
                                return acc;
                            }, []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).reduce((acc: any[], curr: any) => {
                                const lastCount = acc.length > 0 ? acc[acc.length - 1].total : 0;
                                acc.push({ date: curr.date, total: lastCount + curr.count });
                                return acc;
                            }, [])}>
                                <defs>
                                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} minTickGap={30} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} />
                                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Platform Distribution (Real Data) */}
                <div className="bg-white dark:bg-[#1e1e24] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                        <Smartphone size={24} className="text-pink-500" />
                        Platforma
                    </h3>

                    {(() => {
                        const total = usersList.length || 1;
                        const desktop = usersList.filter(u => u.platform === 'desktop').length;
                        const android = usersList.filter(u => u.platform === 'mobile_android').length;
                        const ios = usersList.filter(u => u.platform === 'mobile_ios').length;
                        // Fallback for undefined platforms (treat as web/desktop or separate)
                        const unknown = usersList.length - (desktop + android + ios);
                        // Adjust percentages to sum to 100 approx
                        const desktopPercent = Math.round(((desktop + unknown) / total) * 100);
                        const androidPercent = Math.round((android / total) * 100);
                        const iosPercent = Math.round((ios / total) * 100);

                        return (
                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2"><Monitor size={18} /> Desktop / Web</span>
                                        <span className="font-black text-slate-900 dark:text-white text-lg">{desktopPercent}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-white/5 h-4 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: `${desktopPercent}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2"><Smartphone size={18} /> Mobile (Android)</span>
                                        <span className="font-black text-slate-900 dark:text-white text-lg">{androidPercent}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-white/5 h-4 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-[0_0_10px_rgba(22,163,74,0.4)]" style={{ width: `${androidPercent}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2"><Smartphone size={18} /> Mobile (iOS)</span>
                                        <span className="font-black text-slate-900 dark:text-white text-lg">{iosPercent}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-white/5 h-4 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-slate-400 to-slate-600 rounded-full shadow-[0_0_10px_rgba(100,116,139,0.4)]" style={{ width: `${iosPercent}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};
