import React, { useState, useEffect } from 'react';
import { Hourglass, Check, Zap, TrendingUp, TrendingDown, Award, Target, Activity, Share2, BarChart3 as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShareCard } from '../transformation/ShareCard';
import { User } from '../../types';
import { SectionIntro } from './SectionIntro';

interface WeeklyActivityData {
   day: string;
   dayFull: string;
   date: string;
   completed: number;
   total: number;
   completionRate: number;
   minutes: number;
}

export const StatsView: React.FC = () => {
   const { t, language } = useLanguage();
   const [showShareCard, setShowShareCard] = useState(false);
   const [user, setUser] = useState<User | null>(null);
   const [statsData, setStatsData] = useState<{
      weeklyFocus: { day: string, minutes: number }[];
      weeklyActivity: WeeklyActivityData[];
      taskStats: { name: string, value: number, color: string }[];
      totalFocusTime: number;
      completedTasksCount: number;
      streak: number;
      weeklyInsights: {
         averageCompletion: number;
         bestDay: string | null;
         totalCompleted: number;
         totalTasks: number;
         trend: 'up' | 'down' | 'stable';
         trendPercent: number;
      };
   }>({
      weeklyFocus: [],
      weeklyActivity: [],
      taskStats: [],
      totalFocusTime: 0,
      completedTasksCount: 0,
      streak: 0,
      weeklyInsights: {
         averageCompletion: 0,
         bestDay: null,
         totalCompleted: 0,
         totalTasks: 0,
         trend: 'stable',
         trendPercent: 0
      }
   });

   useEffect(() => {
      const loadStats = async () => {
         const history = await api.getFocusHistory();
         const todos = await api.getTodos();
         const userData = await api.getSession();
         setUser(userData);

         // Focus time data
         const last7Days = [];
         let totalMins = 0;
         for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toISOString().split('T')[0];
            const entry = history.find(h => h.date === dayStr);
            const mins = entry ? entry.minutes : 0;
            totalMins += mins;
            last7Days.push({
               day: d.toLocaleDateString(language, { weekday: 'short' }),
               minutes: mins
            });
         }

         // Weekly routine activity data (LOGIC KUCHLI)
         const weeklyActivityData: WeeklyActivityData[] = [];
         let totalCompleted = 0;
         let totalTasks = 0;
         const completionRates: number[] = [];

         for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toISOString().split('T')[0];

            // Get routine tasks for this day
            const dayTasks = await api.getRoutine(dayStr);
            const completed = dayTasks.filter(t => t.completed).length;
            const total = dayTasks.length;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

            totalCompleted += completed;
            totalTasks += total;
            completionRates.push(rate);

            weeklyActivityData.push({
               day: d.toLocaleDateString(language, { weekday: 'short' }),
               dayFull: d.toLocaleDateString(language, { weekday: 'long' }),
               date: dayStr,
               completed,
               total,
               completionRate: rate,
               minutes: last7Days[6 - i]?.minutes || 0
            });
         }

         // Calculate insights (LOGIC KUCHLI)
         const averageCompletion = completionRates.length > 0
            ? Math.round(completionRates.reduce((a, b) => a + b, 0) / completionRates.length)
            : 0;

         // Find best day (highest completion rate)
         const bestDayData = weeklyActivityData.reduce((best, current) => {
            if (current.total === 0) return best;
            if (!best || current.completionRate > best.completionRate) return current;
            return best;
         }, null as WeeklyActivityData | null);

         // Calculate trend (compare first half vs second half of week)
         const firstHalf = completionRates.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
         const secondHalf = completionRates.slice(3).reduce((a, b) => a + b, 0) / 3;
         const trendDiff = secondHalf - firstHalf;
         const trendPercent = Math.abs(trendDiff) > 0.1 ? Math.round(trendDiff) : 0;
         const trend: 'up' | 'down' | 'stable' = trendDiff > 5 ? 'up' : trendDiff < -5 ? 'down' : 'stable';

         const completed = todos.filter(t => t.completed).length;
         const pending = todos.length - completed;

         setStatsData({
            weeklyFocus: last7Days,
            weeklyActivity: weeklyActivityData,
            taskStats: [
               { name: t('intizom.stats.status_completed'), value: completed, color: '#8b5cf6' },
               { name: t('intizom.stats.status_pending'), value: pending, color: '#334155' }
            ],
            totalFocusTime: totalMins,
            completedTasksCount: completed,
            streak: userData?.streak || 0,
            weeklyInsights: {
               averageCompletion,
               bestDay: bestDayData?.dayFull || null,
               totalCompleted,
               totalTasks,
               trend,
               trendPercent: Math.abs(trendPercent)
            }
         });
      };
      loadStats();
   }, [language, t]);

   return (
      <div className="animate-fade-in max-w-6xl mx-auto space-y-8 pb-10">
         <SectionIntro sectionKey="stats" />
         <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight">{t('intizom.stats.title')}</h2>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/70 dark:bg-[#1a1a1e] p-6 rounded-[2.5rem] border border-white/60 dark:border-white/5 flex items-center gap-5 shadow-sm hover:shadow-lg transition-shadow backdrop-blur-md">
               <div className="w-16 h-16 rounded-[1.5rem] bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-300">
                  <Hourglass size={32} />
               </div>
               <div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-1">{statsData.totalFocusTime}<span className="text-base font-medium text-slate-400 ml-1">m</span></p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('intizom.stats.total_focus')}</p>
               </div>
            </div>

            <div className="bg-white/70 dark:bg-[#1a1a1e] p-6 rounded-[2.5rem] border border-white/60 dark:border-white/5 flex items-center gap-5 shadow-sm hover:shadow-lg transition-shadow backdrop-blur-md">
               <div className="w-16 h-16 rounded-[1.5rem] bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-300">
                  <Check size={32} strokeWidth={3} />
               </div>
               <div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-1">{statsData.completedTasksCount}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('intizom.stats.completed_tasks')}</p>
               </div>
            </div>

            <div className="bg-white/70 dark:bg-[#1a1a1e] p-6 rounded-[2.5rem] border border-white/60 dark:border-white/5 flex items-center gap-5 shadow-sm hover:shadow-lg transition-shadow backdrop-blur-md">
               <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Zap size={32} fill="currentColor" />
               </div>
               <div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-1">{statsData.streak}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('intizom.stats.daily_streak')}</p>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Haftalik Faoliyat - CREATIVE & LOGIC KUCHLI */}
            <div className="bg-gradient-to-br from-white/90 via-white/80 to-violet-50/30 dark:from-[#1a1a1e] dark:via-[#1f1f24] dark:to-violet-950/20 p-8 rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all duration-500 backdrop-blur-xl relative overflow-hidden group">
               {/* Animated background gradient */}
               <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

               <div className="relative z-10">
                  {/* Header with insights */}
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                           <Activity className="text-violet-600 dark:text-violet-400" size={22} />
                           {t('intizom.stats.weekly_activity')}
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                           <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20 px-3 py-1 rounded-lg text-xs font-bold text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-500/30">
                              {t('intizom.stats.last_7_days')}
                           </div>
                           {statsData.weeklyInsights.bestDay && (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                                 <Award size={12} className="text-amber-500" />
                                 <span>{t('intizom.stats.best')}: {statsData.weeklyInsights.bestDay}</span>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Stats Summary Cards */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                     <div className="bg-white/60 dark:bg-white/5 p-3 rounded-xl border border-white/40 dark:border-white/10 backdrop-blur-sm">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('intizom.stats.average')}</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white">{statsData.weeklyInsights.averageCompletion}%</div>
                     </div>
                     <div className="bg-white/60 dark:bg-white/5 p-3 rounded-xl border border-white/40 dark:border-white/10 backdrop-blur-sm">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('intizom.stats.completed_count')}</div>
                        <div className="text-lg font-black text-green-600 dark:text-green-400">{statsData.weeklyInsights.totalCompleted}</div>
                     </div>
                     <div className="bg-white/60 dark:bg-white/5 p-3 rounded-xl border border-white/40 dark:border-white/10 backdrop-blur-sm">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('intizom.stats.total_count')}</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white">{statsData.weeklyInsights.totalTasks}</div>
                     </div>
                  </div>

                  {/* Trend Indicator */}
                  {statsData.weeklyInsights.trendPercent > 0 && (
                     <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg ${statsData.weeklyInsights.trend === 'up'
                        ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30'
                        : statsData.weeklyInsights.trend === 'down'
                           ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30'
                           : 'bg-slate-50 dark:bg-slate-500/10 border border-slate-200 dark:border-slate-500/30'
                        }`}>
                        {statsData.weeklyInsights.trend === 'up' ? (
                           <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
                        ) : statsData.weeklyInsights.trend === 'down' ? (
                           <TrendingDown size={14} className="text-red-600 dark:text-red-400" />
                        ) : (
                           <Target size={14} className="text-slate-600 dark:text-slate-400" />
                        )}
                        <span className={`text-xs font-bold ${statsData.weeklyInsights.trend === 'up'
                           ? 'text-green-700 dark:text-green-300'
                           : statsData.weeklyInsights.trend === 'down'
                              ? 'text-red-700 dark:text-red-300'
                              : 'text-slate-700 dark:text-slate-300'
                           }`}>
                           {statsData.weeklyInsights.trend === 'up'
                              ? `+${statsData.weeklyInsights.trendPercent}% ${t('intizom.stats.growth')}`
                              : statsData.weeklyInsights.trend === 'down'
                                 ? `-${statsData.weeklyInsights.trendPercent}% ${t('intizom.stats.decline')}`
                                 : t('intizom.stats.stable')}
                        </span>
                     </div>
                  )}

                  {/* Interactive Bar Chart */}
                  <div className="w-full" style={{ height: 256, minHeight: 200, minWidth: 200 }}>
                     {statsData.weeklyActivity.length > 0 ? (
                        <ResponsiveContainer width="100%" height={256}>
                           <BarChart data={statsData.weeklyActivity}>
                              <XAxis
                                 dataKey="day"
                                 stroke="#94a3b8"
                                 fontSize={11}
                                 tickLine={false}
                                 axisLine={false}
                                 dy={10}
                                 fontWeight="bold"
                              />
                              <Tooltip
                                 contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                                    padding: '12px'
                                 }}
                                 cursor={{ fill: 'rgba(139, 92, 246, 0.1)', radius: 8 }}
                                 formatter={(value: number, name: string, props: any) => {
                                    if (name === 'completionRate') {
                                       return [`${value}%`, t('intizom.stats.completion')];
                                    }
                                    return [value, name];
                                 }}
                                 labelFormatter={(label) => `${t('intizom.stats.day_prefix')}: ${label}`}
                              />
                              <Bar
                                 dataKey="completionRate"
                                 radius={[8, 8, 0, 0]}
                                 barSize={36}
                              >
                                 {statsData.weeklyActivity.map((entry, index) => (
                                    <Cell
                                       key={`cell-${index}`}
                                       fill={
                                          entry.completionRate >= 80
                                             ? 'url(#gradientHigh)'
                                             : entry.completionRate >= 50
                                                ? 'url(#gradientMedium)'
                                                : 'url(#gradientLow)'
                                       }
                                    />
                                 ))}
                              </Bar>
                              <defs>
                                 <linearGradient id="gradientHigh" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                                 </linearGradient>
                                 <linearGradient id="gradientMedium" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
                                 </linearGradient>
                                 <linearGradient id="gradientLow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
                                 </linearGradient>
                              </defs>
                           </BarChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                           {t('common.loading') || 'Loading...'}
                        </div>
                     )}
                  </div>

                  {/* Day Labels with Activity Indicators */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200/50 dark:border-white/10">
                     {statsData.weeklyActivity.map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                           <div className={`w-2 h-2 rounded-full transition-all ${day.completionRate >= 80
                              ? 'bg-green-500'
                              : day.completionRate >= 50
                                 ? 'bg-violet-500'
                                 : day.completionRate > 0
                                    ? 'bg-amber-500'
                                    : 'bg-slate-300 dark:bg-slate-600'
                              }`}></div>
                           <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {day.day}
                           </span>
                           <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                              {day.completed}/{day.total}
                           </span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Vazifalar Statistikasi - SAME UI AS Haftalik Faoliyat */}
            <div className="bg-gradient-to-br from-white/90 via-white/80 to-violet-50/30 dark:from-[#1a1a1e] dark:via-[#1f1f24] dark:to-violet-950/20 p-8 rounded-[2.5rem] border border-white/60 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all duration-500 backdrop-blur-xl relative overflow-hidden group">
               {/* Animated background gradient */}
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

               <div className="relative z-10">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <Target className="text-indigo-600 dark:text-indigo-400" size={22} />
                        {t('intizom.stats.tasks_chart_title')}
                     </h3>
                  </div>

                  {/* Stats Summary Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                     <div className="bg-white/60 dark:bg-white/5 p-3 rounded-xl border border-white/40 dark:border-white/10 backdrop-blur-sm">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('intizom.stats.status_completed')}</div>
                        <div className="text-lg font-black text-violet-600 dark:text-violet-400">{statsData.taskStats.find(s => s.color === '#8b5cf6')?.value || 0}</div>
                     </div>
                     <div className="bg-white/60 dark:bg-white/5 p-3 rounded-xl border border-white/40 dark:border-white/10 backdrop-blur-sm">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t('intizom.stats.status_pending')}</div>
                        <div className="text-lg font-black text-slate-700 dark:text-slate-300">{statsData.taskStats.find(s => s.color === '#334155')?.value || 0}</div>
                     </div>
                  </div>

                  {/* Efficiency Badge */}
                  {statsData.taskStats.length > 0 && (statsData.taskStats[0].value + statsData.taskStats[1].value) > 0 && (
                     <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 dark:from-violet-500/20 dark:to-indigo-500/20 px-3 py-2 rounded-lg border border-violet-200/50 dark:border-violet-500/30 mb-4 inline-block">
                        <span className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wider">
                           {Math.round((statsData.taskStats[0].value / (statsData.taskStats[0].value + statsData.taskStats[1].value)) * 100)}% {t('intizom.stats.efficiency')}
                        </span>
                     </div>
                  )}

                  {/* Pie Chart */}
                  <div className="w-full relative" style={{ height: 256, minHeight: 200, minWidth: 200 }}>
                     {(statsData.taskStats.length > 0 && (statsData.taskStats[0].value + statsData.taskStats[1].value) > 0) ? (
                        <>
                           <ResponsiveContainer width="100%" height={256}>
                              <PieChart width={256} height={256}>
                                 <Pie
                                    data={statsData.taskStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    cornerRadius={10}
                                 >
                                    {statsData.taskStats.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                 </Pie>
                                 <Tooltip
                                    contentStyle={{
                                       backgroundColor: '#1e293b',
                                       border: 'none',
                                       borderRadius: '12px',
                                       color: '#fff',
                                       boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                                       padding: '12px'
                                    }}
                                 />
                              </PieChart>
                           </ResponsiveContainer>
                           <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                 {statsData.taskStats.length > 0 && (statsData.taskStats[0].value + statsData.taskStats[1].value) > 0
                                    ? Math.round((statsData.taskStats[0].value / (statsData.taskStats[0].value + statsData.taskStats[1].value)) * 100)
                                    : 0}%
                              </span>
                              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{t('intizom.stats.efficiency')}</span>
                           </div>
                        </>
                     ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                           {t('common.no_data') || 'No Data'}
                        </div>
                     )}
                  </div>

                  {/* Legend with Activity Indicators */}
                  <div className="flex justify-center items-center gap-6 mt-4 pt-4 border-t border-slate-200/50 dark:border-white/10">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-violet-500 shadow-sm"></div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('intizom.stats.status_completed')}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-700 dark:bg-slate-500 shadow-sm"></div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t('intizom.stats.status_pending')}</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Share Card Modal */}
         {showShareCard && user && (
            <ShareCard
               user={user}
               stats={{
                  streak: user.streak,
                  completion: statsData.weeklyActivity[statsData.weeklyActivity.length - 1]?.completionRate || 0,
                  weekFocus: statsData.totalFocusTime
               }}
               onClose={() => setShowShareCard(false)}
            />
         )}
      </div>
   );
};