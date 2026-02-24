
import React, { useState, useEffect } from 'react';
import { BrainCircuit, Calendar, ListTodo, BookOpen, Clock, BarChart3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { RoutineList } from '../components/intizom/RoutineList';
import { Planner } from '../components/intizom/Planner';
import { TodoList } from '../components/intizom/TodoList';
import { DailyJournal } from '../components/intizom/DailyJournal';
import { FocusTimer } from '../components/intizom/FocusTimer';
import { StatsView } from '../components/intizom/StatsView';

export enum ViewMode {
  DAILY = 'DAILY',
  PLAN = 'PLAN',
  TASKS = 'TASKS',
  JOURNAL = 'JOURNAL',
  FOCUS = 'FOCUS',
  STATS = 'STATS'
}

interface IntizomProps {
  initialTab?: string;
}

export const Intizom: React.FC<IntizomProps> = ({ initialTab }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ViewMode>(ViewMode.DAILY);

  useEffect(() => {
    if (initialTab && Object.values(ViewMode).includes(initialTab as ViewMode)) {
      setActiveTab(initialTab as ViewMode);
    }
  }, [initialTab]);

  return (
    <div className="space-y-8 pb-32 lg:pb-20">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="px-1 sm:px-0">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-fuchsia-600 dark:from-violet-300 dark:to-fuchsia-300">
            {t('intizom.title')}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1 sm:mt-2 font-medium">{t('intizom.subtitle')}</p>
        </div>
        <div className="hidden lg:block">
          <div className="flex p-1 bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-xl shadow-sm w-max backdrop-blur-md">
            {[
              { id: ViewMode.PLAN, label: t('intizom.tabs.plan'), icon: BrainCircuit },
              { id: ViewMode.DAILY, label: t('intizom.tabs.daily'), icon: Calendar },
              { id: ViewMode.TASKS, label: t('intizom.tabs.tasks'), icon: ListTodo },
              { id: ViewMode.JOURNAL, label: t('intizom.tabs.journal'), icon: BookOpen },
              { id: ViewMode.FOCUS, label: t('intizom.tabs.focus'), icon: Clock },
              { id: ViewMode.STATS, label: t('intizom.tabs.stats'), icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-white shadow-sm text-indigo-700 dark:bg-white/10 dark:text-indigo-300'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5'}`}
              >
                <tab.icon size={16} strokeWidth={2.5} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === ViewMode.DAILY && <RoutineList />}
      {activeTab === ViewMode.PLAN && <Planner onPlanCreated={() => setActiveTab(ViewMode.DAILY)} />}
      {activeTab === ViewMode.TASKS && <TodoList />}
      {activeTab === ViewMode.JOURNAL && <DailyJournal />}
      {activeTab === ViewMode.FOCUS && <FocusTimer />}
      {activeTab === ViewMode.STATS && <StatsView />}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 flex justify-between items-center max-w-lg mx-auto overflow-x-auto no-scrollbar">
          {[
            { id: ViewMode.PLAN, label: t('intizom.tabs.plan'), icon: BrainCircuit },
            { id: ViewMode.DAILY, label: t('intizom.tabs.daily'), icon: Calendar },
            { id: ViewMode.TASKS, label: t('intizom.tabs.tasks'), icon: ListTodo },
            { id: ViewMode.JOURNAL, label: t('intizom.tabs.journal'), icon: BookOpen },
            { id: ViewMode.FOCUS, label: t('intizom.tabs.focus'), icon: Clock },
            { id: ViewMode.STATS, label: t('intizom.tabs.stats'), icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[50px] flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-300 ${activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium'}`}
            >
              <tab.icon size={20} strokeWidth={activeTab === tab.id ? 3 : 2} />
              <span className="text-[10px] leading-tight text-center">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
