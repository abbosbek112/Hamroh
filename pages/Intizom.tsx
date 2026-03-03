
import React, { useState, useEffect } from 'react';
import { BrainCircuit, Calendar, ListTodo, BookOpen, Clock, BarChart3, Shield, ChevronDown } from 'lucide-react';
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

const IntizomWelcome: React.FC = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('hamroh_intizom_welcome_seen');
    if (!seen) setVisible(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('hamroh_intizom_welcome_seen', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="animate-fade-in mb-6 sm:mb-8">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950 p-6 sm:p-10 text-white shadow-2xl">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-fuchsia-500/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        {/* Shield icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
            <Shield className="text-violet-300" size={28} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {t('intizom.welcome.headline')}
            </h2>
          </div>
        </div>

        {/* Paragraphs */}
        <div className="space-y-4 max-w-3xl">
          <p className="text-white/80 text-sm sm:text-base leading-relaxed font-medium">
            {t('intizom.welcome.p1')}
          </p>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed font-medium">
            {t('intizom.welcome.p2')}
          </p>
          <p className="text-white/95 text-base sm:text-lg font-bold italic">
            {t('intizom.welcome.p3')}
          </p>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed font-medium">
            {t('intizom.welcome.p4')}
          </p>
          <p className="text-white/90 text-sm sm:text-base leading-relaxed font-semibold">
            {t('intizom.welcome.p5')}
          </p>
        </div>

        {/* Dismiss button */}
        <div className="flex justify-end mt-6 sm:mt-8">
          <button
            onClick={handleDismiss}
            className="group px-6 sm:px-8 py-3 bg-white text-slate-900 font-bold text-sm sm:text-base rounded-xl transition-all active:scale-95 hover:shadow-lg hover:shadow-white/20 flex items-center gap-2"
          >
            {t('intizom.welcome.dismiss')}
            <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

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
      {/* Welcome Intro */}
      <IntizomWelcome />
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
                aria-label={tab.label}
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
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 flex justify-between items-center max-w-lg mx-auto overflow-x-auto no-scrollbar gap-1">
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
              aria-label={tab.label}
              className={`flex-1 min-w-[64px] flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-300 ${activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:bg-white/10'}`}
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
