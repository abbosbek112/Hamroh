import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Deal, Expense } from '../../types';
import { formatCompactUZS, formatUZS } from './utils';

interface AdminAnalyticsProps {
    deals: Deal[];
    expenses: Expense[];
    onAddExpense: () => void;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ deals, expenses, onAddExpense }) => {
    const totalRevenue = deals.reduce((acc, deal) => acc + (deal.status !== 'Pending' ? deal.amount : 0), 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const financialData = [
        { name: 'Revenue', amount: totalRevenue },
        { name: 'Expenses', amount: totalExpenses }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-sm">
                    <div className="text-sm font-bold text-slate-500 uppercase mb-2">Total Revenue</div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white text-green-500">{formatCompactUZS(totalRevenue)}</div>
                </div>
                <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-sm">
                    <div className="text-sm font-bold text-slate-500 uppercase mb-2">Total Expenses</div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white text-red-500">{formatCompactUZS(totalExpenses)}</div>
                </div>
                <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-sm">
                    <div className="text-sm font-bold text-slate-500 uppercase mb-2">Net Profit</div>
                    <div className={`text-3xl font-black ${netProfit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>{formatCompactUZS(netProfit)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 shadow-sm">
                    <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Financial Overview</h3>
                    <div className="h-64 w-full min-w-[200px] min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200} aspect={undefined}>
                            <BarChart data={financialData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => formatCompactUZS(val)} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} formatter={(val: number) => formatUZS(val)} />
                                <Bar dataKey="amount" fill="#8884d8" radius={[8, 8, 0, 0]}>
                                    {financialData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Revenue' ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recent Expenses</h3>
                        <button onClick={onAddExpense} className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-colors">
                            + Add Expense
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {expenses.length === 0 ? <div className="text-center text-slate-400 py-10">Xarajatlar yo'q</div> : expenses.map(exp => (
                            <div key={exp.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">{exp.title}</div>
                                    <div className="text-xs text-slate-500">{exp.date} • {exp.category}</div>
                                </div>
                                <div className="font-bold text-red-500">-{formatCompactUZS(exp.amount)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
