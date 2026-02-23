
import React, { useEffect, useState, useRef } from 'react';
import { AppView, RoutineTask, JournalEntry, User, NavigationParams } from '../types';
import { ArrowRight, Trophy, Activity, CheckCircle, PlusCircle, Flame, BrainCircuit, Target, Sparkles, Zap, Clock, Book, PenTool, Quote, Save, X, Loader2, Star, Moon, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { StreakFlame } from '../components/StreakFlame';
import { IdentitySetup } from '../components/transformation/IdentitySetup';
import { HomeBanner } from '../components/transformation/HomeBanner';
import { SmartJournal } from '../components/transformation/SmartJournal';
import { RoutineStack } from '../components/transformation/RoutineStack';
import { ShareCard } from '../components/transformation/ShareCard';
import { UserIdentity, SmartJournalEntry, RoutineStack as RoutineStackType } from '../types';
// import { ROUTINE_TEMPLATES } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { logger } from '../utils/logger';

interface HomeProps {
  onNavigate: (view: AppView, params?: NavigationParams) => void;
}

const XPGuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white dark:bg-[#1a1a1e] rounded-[2rem] p-8 shadow-2xl animate-fade-in-up border border-slate-200 dark:border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Star className="text-yellow-500 fill-yellow-500" /> {t('home.xp_guide.title')}
          </h3>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-white/10 rounded-full hover:bg-slate-200"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-xl"><CheckCircle size={18} /></div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{t('home.xp_guide.daily_plan.title')}</p>
                <p className="text-xs text-slate-500">{t('home.xp_guide.daily_plan.desc')}</p>
              </div>
            </div>
            <span className="font-black text-green-500">{t('home.xp_guide.daily_plan.reward')}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-xl"><Target size={18} /></div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{t('home.xp_guide.tasks.title')}</p>
                <p className="text-xs text-slate-500">{t('home.xp_guide.tasks.desc')}</p>
              </div>
            </div>
            <span className="font-black text-green-500">{t('home.xp_guide.tasks.reward')}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 dark:bg-violet-500/20 text-violet-600 rounded-xl"><Clock size={18} /></div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{t('home.xp_guide.focus.title')}</p>
                <p className="text-xs text-slate-500">{t('home.xp_guide.focus.desc')}</p>
              </div>
            </div>
            <span className="font-black text-green-500">{t('home.xp_guide.focus.reward')}</span>
          </div>

          <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-500/20 text-pink-600 rounded-xl"><Book size={18} /></div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{t('home.xp_guide.journal.title')}</p>
                <p className="text-xs text-slate-500">{t('home.xp_guide.journal.desc')}</p>
              </div>
            </div>
            <span className="font-black text-green-500">{t('home.xp_guide.journal.reward')}</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl border border-yellow-200 dark:border-yellow-500/20 text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
          <strong>Info:</strong> {t('home.xp_guide.subtitle')}
        </div>
      </div>
    </div>
  );
};

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { t, language, setLanguage } = useLanguage();
  const [todaysTasks, setTodaysTasks] = useState<RoutineTask[]>([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);
  const [showXPGuide, setShowXPGuide] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingForm, setOnboardingForm] = useState({ title: '', time: '09:00' });
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({
    completedTasks: 0,
    totalTasks: 0,
    focusMinutes: 0,
    journalEntries: 0,
    loading: true,
  });

  // Book State
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isWritingMode, setIsWritingMode] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const [showMagicDust, setShowMagicDust] = useState(false);

  // Parallax Ref
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Transformation State
  const [showIdentitySetup, setShowIdentitySetup] = useState(false);
  const [showSmartJournal, setShowSmartJournal] = useState<'MORNING' | 'EVENING' | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<RoutineStackType | null>(null);

  // Share Card State
  const [showShareCard, setShowShareCard] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);

  // Safely get streak
  const streak = userData?.streak || 0;

  // Lock Body Scroll when Modals are Open
  useEffect(() => {
    const isAnyModalOpen = showOnboarding || showIdentitySetup || !!showSmartJournal || showShareCard || showXPGuide;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showOnboarding, showIdentitySetup, showSmartJournal, showShareCard, showXPGuide]);

  // Load Transformation Data from LocalStorage
  const loadTransData = (userId: string) => {
    try {
      const stored = localStorage.getItem(`hamroh_trans_${userId}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load trans data", e);
    }
    return null;
  };

  const saveTransData = (userId: string, data: any) => {
    try {
      const current = loadTransData(userId) || {};
      const updated = { ...current, ...data };
      localStorage.setItem(`hamroh_trans_${userId}`, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error("Failed to save trans data", e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user session
        const currentUser = await api.getSession();
        if (currentUser) {
          // Merge with Local Data for Transformation System
          const localData = loadTransData(currentUser.id);
          const fullUser = {
            ...currentUser,
            identity: localData?.identity || currentUser.identity,
            routines: localData?.routines || currentUser.routines,
            lastReviewDate: localData?.lastReviewDate || currentUser.lastReviewDate
          };

          setUserData(fullUser);

          // Identity Check
          if (!fullUser.identity) {
            const hasSkipped = localStorage.getItem('hamroh_identity_skipped');
            if (!hasSkipped) setTimeout(() => setShowIdentitySetup(true), 2000);
          }

          // Routine Check
          if (fullUser.routines && fullUser.routines.length > 0) {
            setActiveRoutine(fullUser.routines[0]);
          }



          // Share Card Check (Every 7 days of streak)
          if (fullUser.streak > 0 && fullUser.streak % 7 === 0 && !localStorage.getItem(`share_card_shown_${fullUser.streak}`)) {
            setTimeout(() => setShowShareCard(true), 5000);
          }
        }

        const today = new Date().toISOString().split('T')[0];
        const tasks = await api.getRoutine(today);
        setTodaysTasks(tasks);

        if (tasks.length > 0) {
          const completed = tasks.filter(t => t.completed).length;
          setCompletionRate(Math.round((completed / tasks.length) * 100));
        } else {
          setCompletionRate(0);
        }
      } catch (error: unknown) {
        logger.error("Failed to fetch data:", error);
        // If unauthorized, tasks will be empty array (handled gracefully)
        setTodaysTasks([]);
        setCompletionRate(0);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const userId = userData?.id;
    if (!userId) return;
    const flagKey = `hamroh_onboarding_done_${userId}`;
    const alreadyDone = localStorage.getItem(flagKey) === 'true';
    if (alreadyDone) return;
    if (todaysTasks.length > 0) {
      localStorage.setItem(flagKey, 'true');
      return;
    }
    setShowOnboarding(true);
  }, [userData?.id, todaysTasks.length]);

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      try {
        const today = new Date();
        const dates: string[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          dates.push(d.toISOString().split('T')[0]);
        }

        const routines = await Promise.all(dates.map(date => api.getRoutine(date)));
        const allTasks = routines.flat();
        const completedTasks = allTasks.filter(t => t.completed).length;

        const focusHistory = await api.getFocusHistory();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const focusMinutes = focusHistory
          .filter(h => new Date(h.date) >= new Date(sevenDaysAgo.toISOString().split('T')[0]))
          .reduce((sum, h) => sum + (h.minutes || 0), 0);

        const journals = await api.getJournalEntries();
        const journalEntries = journals.filter(j => j.timestamp >= sevenDaysAgo.getTime()).length;

        setWeeklyStats({
          completedTasks,
          totalTasks: allTasks.length,
          focusMinutes,
          journalEntries,
          loading: false,
        });
      } catch (error: unknown) {
        logger.error('Weekly stats error:', error);
        setWeeklyStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchWeeklyStats();
  }, []);

  const handleCompleteOnboarding = async () => {
    const userId = userData?.id;
    if (!userId) return;
    const flagKey = `hamroh_onboarding_done_${userId}`;
    localStorage.setItem(flagKey, 'true');
    setShowOnboarding(false);
  };

  const handleSaveOnboardingTask = async () => {
    if (!onboardingForm.title.trim()) return;
    setSavingOnboarding(true);
    try {
      const taskDate = new Date().toISOString().split('T')[0];
      const newTask: RoutineTask = {
        id: '',
        title: onboardingForm.title.trim(),
        time: onboardingForm.time,
        completed: false,
        date: taskDate,
      };
      await api.saveRoutineTask(newTask);
      handleCompleteOnboarding();
      onNavigate(AppView.INTIZOM, { tab: 'DAILY' });
    } catch (error: unknown) {
      logger.error('Onboarding task save error:', error);
      alert(t('common.error'));
    } finally {
      setSavingOnboarding(false);
    }
  };

  // Smoother Parallax Effect Handler (Desktop Only) - Disable when book is open
  useEffect(() => {
    if (window.innerWidth < 1024) return; // Disable on mobile
    if (isBookOpen) return; // Disable mouse tracking when book is open

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 15;
      const y = (e.clientY / innerHeight - 0.5) * 15;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isBookOpen]);

  const handleBookClick = (e: React.MouseEvent) => {
    // If writing, don't close book on container click
    if ((e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('textarea') || (e.target as HTMLElement).closest('button')) {
      return;
    }

    // Reverted to original 3D book logic
    setIsBookOpen(!isBookOpen);
  };

  const handleIdentitySave = async (identity: UserIdentity) => {
    try {
      if (userData) {
        const updatedUser = { ...userData, identity };
        setUserData(updatedUser);
        saveTransData(userData.id, { identity });
      }
      setShowIdentitySetup(false);
    } catch (error) {
      console.error("Failed to save identity", error);
    }
  };

  const handleJournalSave = async (entry: SmartJournalEntry) => {
    try {
      // Just save locally or to API if available
      await api.saveJournalEntry(entry as any); // Type cast if needed
      setShowSmartJournal(null);
      alert(entry.feedback); // Show the rule-based feedback
    } catch (error) {
      console.error("Failed to save journal", error);
    }
  };

  const handleRoutineUpdate = (updatedRoutine: RoutineStackType) => {
    setActiveRoutine(updatedRoutine);
    if (userData) {
      saveTransData(userData.id, { routines: [updatedRoutine] });
    }
  };

  const handleRoutineComplete = async () => {
    setShowMagicDust(true);
    setTimeout(() => setShowMagicDust(false), 3000);
    try {
      const res = await api.awardXpRoutine();
      if (res && userData) setUserData((prev) => prev ? { ...prev, xp: res.xp, level: res.level } : null);
    } catch {
      // XP error - ignore
    }
  };



  const handleSaveQuickJournal = async () => {
    if (!journalText.trim()) return;
    setIsSavingJournal(true);

    try {
      // 1. Create entry object (No AI Analysis)
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        text: journalText,
        mood: 'neutral', // Default
        timestamp: Date.now()
      };

      // 2. Save to storage via API
      await api.saveJournalEntry(newEntry);

      // 3. Show Magic Animations
      setShowMagicDust(true);

      setTimeout(() => {
        setIsSavingJournal(false);
        setIsWritingMode(false);
        setJournalText('');
        setShowMagicDust(false);
        setIsBookOpen(false); // Auto close after magic save

        // 4. Navigate to Intizom Journal to show result
        setTimeout(() => onNavigate(AppView.INTIZOM, { tab: 'JOURNAL' }), 800);
      }, 1500);

    } catch (error: unknown) {
      logger.error("Save error:", error);
      setIsSavingJournal(false);
      alert(t('common.error'));
    }
  };

  const chartData = [
    { name: 'Completed', value: completionRate || 1, color: '#8b5cf6' },
    { name: 'Remaining', value: 100 - (completionRate || 1), color: 'rgba(139, 92, 246, 0.1)' },
  ];
  const displayData = todaysTasks.length === 0 ? [{ name: 'Empty', value: 100, color: 'rgba(139, 92, 246, 0.05)' }] : chartData;

  const currentLevelXP = userData ? userData.xp % 1000 : 0;
  const xpPercentage = Math.min(100, (currentLevelXP / 1000) * 100);

  return (
    <>
      <XPGuideModal isOpen={showXPGuide} onClose={() => setShowXPGuide(false)} />

      {/* Transformation Modals */}
      {showIdentitySetup && userData && (
        <IdentitySetup
          user={userData}
          onComplete={handleIdentitySave}
          onClose={() => { setShowIdentitySetup(false); localStorage.setItem('hamroh_identity_skipped', 'true'); }}
        />
      )}

      {showSmartJournal && userData && (
        <SmartJournal
          user={userData}
          type={showSmartJournal}
          onSave={handleJournalSave}
          onClose={() => setShowSmartJournal(null)}
        />
      )}

      {showShareCard && userData && (
        <ShareCard
          user={userData}
          stats={{
            streak: userData.streak,
            completion: completionRate,
            weekFocus: weeklyStats.focusMinutes
          }}
          onClose={() => {
            setShowShareCard(false);
            localStorage.setItem(`share_card_shown_${userData.streak}`, 'true');
          }}
        />
      )}

      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-500 overflow-y-auto">
          <div className="absolute inset-0" onClick={handleCompleteOnboarding}></div>
          <div className="relative w-full max-w-lg bg-white/90 dark:bg-[#1a1a1e]/90 rounded-[3rem] p-10 shadow-2xl border border-white/20 dark:border-white/5 backdrop-blur-2xl animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {t('home.onboarding.title')}
                  </h3>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`h-1 rounded-full transition-all ${s <= onboardingStep ? 'w-4 bg-indigo-500' : 'w-2 bg-slate-200 dark:bg-white/10'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handleCompleteOnboarding} className="p-3 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                <X size={20} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <div className="min-h-[160px] flex flex-col justify-center">
              {onboardingStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <p className="text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{t('home.onboarding.step1_desc')}</p>
                  <div className="grid grid-cols-3 gap-4">
                    {(['uz', 'ru', 'en'] as const).map(lang => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`py-4 rounded-2xl font-black transition-all border-2 ${language === lang
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/30 -translate-y-1'
                          : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-white/5 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                          }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <p className="text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{t('home.onboarding.step2_desc')}</p>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('home.onboarding.time_label')}</label>
                      <input
                        type="time"
                        value={onboardingForm.time}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, time: e.target.value })}
                        className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 font-black text-xl text-slate-800 dark:text-white focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t('home.onboarding.title_label')}</label>
                      <input
                        type="text"
                        value={onboardingForm.title}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, title: e.target.value })}
                        placeholder={t('home.onboarding.title_placeholder')}
                        className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/5 font-bold text-lg text-slate-800 dark:text-white focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <p className="text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{t('home.onboarding.step3_desc')}</p>
                  <div className="p-6 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/20 flex items-start gap-4">
                    <div className="p-2 bg-indigo-600 rounded-full text-white mt-1">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold text-indigo-900 dark:text-indigo-200">Hammasi tayyor!</h4>
                      <p className="text-sm text-indigo-700/70 dark:text-indigo-300/60 mt-1">
                        {t('home.onboarding.summary')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={handleCompleteOnboarding}
                className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors px-2"
              >
                {t('home.onboarding.skip')}
              </button>
              <div className="flex gap-3">
                {onboardingStep > 1 && (
                  <button
                    onClick={() => setOnboardingStep(onboardingStep - 1)}
                    className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white font-bold hover:bg-slate-200 transition-all"
                  >
                    {t('home.onboarding.back')}
                  </button>
                )}
                {onboardingStep < 3 ? (
                  <button
                    onClick={() => setOnboardingStep(onboardingStep + 1)}
                    disabled={onboardingStep === 2 && !onboardingForm.title.trim()}
                    className={`px-8 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl ${onboardingStep === 2 && !onboardingForm.title.trim()
                      ? 'opacity-40 cursor-not-allowed scale-100'
                      : 'shadow-indigo-500/30'
                      }`}
                  >
                    {t('home.onboarding.next')} <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveOnboardingTask}
                    disabled={savingOnboarding}
                    className={`px-10 py-3 rounded-2xl bg-indigo-600 text-white font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/40 ${savingOnboarding ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                  >
                    {savingOnboarding ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    {t('home.onboarding.done')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-24 animate-fade-in pb-12 overflow-x-hidden">

        {/* --- HERO SECTION --- */}
        <section
          ref={heroRef}
          className="relative min-h-[500px] lg:min-h-[650px] flex items-center justify-center perspective-3000 pt-10 lg:pt-0"
          style={{ isolation: 'isolate' }}
        >
          {/* Background Highlight - Chrome fix: removed mix-blend-overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/20 dark:bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" style={{ zIndex: 0 }}></div>

          <div className="relative w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center z-10 px-4 sm:px-6" style={{ isolation: 'isolate', zIndex: 10 }}>

            {/* LEFT: TEXT CONTENT - DIMMED WHEN BOOK IS OPEN */}
            <div
              className={`text-center lg:text-left space-y-6 lg:space-y-8 order-2 lg:order-1 relative transition-all duration-700 ease-out transform-gpu ${isBookOpen ? 'z-0 lg:opacity-30 lg:blur-[2px] lg:scale-95 lg:-translate-x-10 origin-left grayscale-[50%]' : 'z-30 opacity-100 scale-100'}`}
              style={{
                isolation: 'isolate',
                transform: 'translateZ(0)',
                willChange: 'transform',
                zIndex: 30,
                position: 'relative'
              }}
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/30 border border-white/20 dark:bg-slate-800/60 dark:border-white/5 rounded-full backdrop-blur-md text-sm font-bold text-indigo-700 dark:text-violet-200 animate-fade-in-up shadow-sm"
                style={{ animationDelay: '0.1s', transform: 'translateZ(0)', zIndex: 31, position: 'relative' }}
              >
                <Sparkles size={16} className="text-amber-500" />
                <span>{t('home.ai_badge')}</span>
              </div>

              <h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter text-slate-900 dark:text-white leading-[1.05] animate-fade-in-up"
                style={{
                  animationDelay: '0.2s',
                  textShadow: '0 4px 30px rgba(0,0,0,0.1)',
                  transform: 'translateZ(0)',
                  willChange: 'transform',
                  zIndex: 31,
                  position: 'relative'
                }}
              >
                {t('home.hero_title_1')}<br />
                <span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500"
                  style={{ transform: 'translateZ(0)', position: 'relative', zIndex: 31 }}
                >
                  {t('home.hero_title_2')}
                </span>
              </h1>

              <p
                className="text-base sm:text-lg md:text-xl text-slate-700 dark:text-slate-300 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed animate-fade-in-up"
                style={{
                  animationDelay: '0.3s',
                  transform: 'translateZ(0)',
                  zIndex: 31,
                  position: 'relative'
                }}
              >
                {t('home.ready')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-4 lg:pt-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <button
                  onClick={() => onNavigate(AppView.INTIZOM, { tab: 'PLAN' })}
                  disabled={isBookOpen}
                  className={`px-6 sm:px-8 py-3 sm:py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/30 dark:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] group border border-transparent text-sm sm:text-base ${isBookOpen ? 'cursor-default pointer-events-none' : ''}`}
                >
                  <PlusCircle size={18} className="sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform" /> {t('home.plan_btn')}
                </button>
              </div>
            </div>

            {/* RIGHT: INTERACTIVE BOOK (Desktop Only - Hidden on mobile/tablet) - RAISED Z-INDEX WHEN OPEN */}
            <div className={`hidden xl:flex order-1 lg:order-2 justify-center lg:justify-end perspective-3000 py-12 lg:py-0 relative h-[500px] xl:h-[600px] items-center transition-all duration-500 ${isBookOpen ? 'z-50' : 'z-10'}`}>

              {/* --- CREATIVE BACKGROUND & EFFECTS --- */}
              <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-1000 ${isBookOpen ? 'scale-110' : 'scale-100'}`}>

                {/* 1. Core Aura */}
                <div className={`absolute w-[500px] h-[500px] bg-gradient-radial from-violet-600/30 via-fuchsia-600/10 to-transparent rounded-full blur-[80px] transition-all duration-1000 ${isBookOpen ? 'opacity-80 scale-125' : 'opacity-40 animate-pulse-slow'}`}></div>

                {/* 2. Mystical Rotating Rings (Visible when open) */}
                <div className={`absolute w-[600px] h-[600px] border border-dashed border-indigo-400/20 rounded-full animate-spin-slow transition-all duration-1000 ${isBookOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}></div>
                <div className={`absolute w-[450px] h-[450px] border border-dotted border-fuchsia-400/20 rounded-full animate-reverse-spin transition-all duration-1000 delay-100 ${isBookOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}></div>
                <div className={`absolute w-[750px] h-[750px] border border-white/5 rounded-full animate-pulse-slow transition-all duration-1000 ${isBookOpen ? 'opacity-60 scale-100' : 'opacity-0'}`}></div>

                {/* 3. Floating Symbols & Magic (When Open) */}
                {isBookOpen && (
                  <>
                    <div className="absolute top-[10%] right-[10%] text-5xl text-white/5 font-serif animate-float-slow select-none rotate-12">❧</div>
                    <div className="absolute bottom-[15%] left-[5%] text-6xl text-white/5 font-serif animate-float-medium select-none -rotate-12">❈</div>
                    <div className="absolute top-[20%] left-[20%]">
                      <Sparkles className="text-amber-200/60 animate-pulse" size={28} />
                    </div>
                    <div className="absolute bottom-[25%] right-[20%]">
                      <Star className="text-violet-300/40 animate-spin-slow" size={16} />
                    </div>
                    <div className="absolute -top-20 left-1/2 w-px h-48 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                  </>
                )}

                {/* 4. Dynamic Particles (Always active but enhanced when open) */}
                {(isBookOpen || showMagicDust) && [...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute bg-amber-200 rounded-full blur-[1px] animate-float-slow"
                    style={{
                      width: Math.random() * 3 + 1 + 'px',
                      height: Math.random() * 3 + 1 + 'px',
                      top: Math.random() * 100 + '%',
                      left: Math.random() * 100 + '%',
                      opacity: Math.random() * 0.6 + 0.2,
                      animationDuration: Math.random() * 5 + 5 + 's',
                      animationDelay: Math.random() * 2 + 's'
                    }}
                  />
                ))}
              </div>

              {/* THE BOOK CONTAINER - Responsive sizing */}
              <div
                className={`relative w-[320px] xl:w-[400px] h-[430px] xl:h-[540px] preserve-3d cursor-pointer group ${isSavingJournal ? 'animate-pulse' : ''} ${!isBookOpen ? 'animate-float-slow' : ''}`}
                style={{
                  // Beautiful slide animation when opening - smooth slide left with elegant bounce
                  transform: `rotateY(${isBookOpen ? 0 : mousePos.x}deg) rotateX(${isBookOpen ? 0 : -mousePos.y}deg) translateX(${isBookOpen ? '-50px' : '0'}) scale(${isBookOpen ? '1.03' : '1'})`,
                  transition: 'transform 0.85s cubic-bezier(0.34, 1.3, 0.64, 1)',
                  willChange: 'transform',
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'center center'
                }}
                onClick={handleBookClick}
              >
                {/* BACK COVER */}
                <div className="absolute inset-0 bg-[#1e293b] rounded-r-[24px] rounded-l-[6px] shadow-2xl transform translateZ(-25px)"></div>

                {/* --- PAGES BLOCK (Right Side Content) --- */}
                <div className="absolute top-[6px] bottom-[6px] left-[6px] w-[calc(100%-12px)] xl:w-[385px] bg-[#fffbf2] transform translateZ(-12px) rounded-r-[20px] shadow-inner border-r border-gray-300 flex flex-col overflow-hidden">
                  {/* Realistic Paper Texture & Lines */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-30 pointer-events-none"></div>
                  {/* Writing Lines - Perfectly aligned to 2rem (32px) */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px)',
                      backgroundSize: '100% 2rem',
                      marginTop: '5rem'
                    }}></div>

                  {/* Red Margin Line - Moved to left-10 (approx 40px) */}
                  <div className="absolute top-0 bottom-0 left-10 w-[2px] bg-red-400/20 pointer-events-none border-r border-red-400/10"></div>

                  {/* Content Logic */}
                  <div className={`relative z-10 h-full flex flex-col transition-opacity duration-500 ${isBookOpen ? 'opacity-100 delay-300' : 'opacity-0'}`}>

                    {/* Header */}
                    <div className="h-20 px-8 flex items-end pb-3 justify-between border-b border-transparent">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-6">{new Date().toLocaleDateString(language, { month: 'long', day: 'numeric' })}</span>
                      <span className="text-slate-300 font-serif italic text-xs">{t('home.book.hashtag')}</span>
                    </div>

                    {/* Mode Switch: Summary vs Writing */}
                    {!isWritingMode ? (
                      // VIEW MODE
                      <div className="p-10 pl-16 flex flex-col justify-between h-full">
                        <div className="space-y-8 mt-2">
                          <div className="relative">
                            <Quote size={40} className="absolute -top-4 -left-4 text-indigo-100 -z-10" />
                            <h3 className="text-3xl font-serif font-bold text-slate-800 leading-tight">
                              {t('home.book.title_1')} <br /> <span className="text-indigo-600">{t('home.book.title_2')}</span>
                            </h3>
                          </div>
                          <p className="text-slate-600 font-serif text-lg leading-relaxed italic pl-2 border-l-2 border-indigo-200">
                            {t('home.book.quote')}
                          </p>
                        </div>

                        <div className="space-y-4 mb-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setIsWritingMode(true); }}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-violet-700 transition-colors shadow-lg group/btn relative overflow-hidden"
                          >
                            <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></span>
                            <PenTool size={18} className="group-hover/btn:rotate-12 transition-transform" /> {t('home.book.start_writing')}
                          </button>
                          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('home.book.xp_reward')}</p>
                        </div>
                      </div>
                    ) : (
                      // WRITING MODE (Active Journal)
                      <div className="flex flex-col h-full relative">
                        <div className="absolute top-0 right-4 z-20">
                          <button onClick={(e) => { e.stopPropagation(); setIsWritingMode(false); }} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </div>

                        {/* INCREASED PADDING LEFT TO 16 (4rem = 64px) to clear the red line at 40px */}
                        <textarea
                          value={journalText}
                          onChange={(e) => setJournalText(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder={t('home.book.placeholder')}
                          className="flex-1 bg-transparent resize-none outline-none border-none pl-16 pr-6 py-0 text-slate-700 font-serif text-lg placeholder-slate-300 custom-scrollbar"
                          style={{
                            lineHeight: '2rem', // Matches backgroundSize
                            paddingTop: '0.2rem' // Fine tune text alignment to line
                          }}
                          autoFocus
                        />

                        <div className="p-6 pl-16 bg-gradient-to-t from-[#fffbf2] to-transparent">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveQuickJournal(); }}
                            disabled={isSavingJournal || !journalText.trim()}
                            className={`w-full py-3 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed
                                     ${isSavingJournal ? 'bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                          >
                            {isSavingJournal ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {isSavingJournal ? t('home.book.saving') : t('home.book.save')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SPINE */}
                <div className="absolute left-0 top-0 bottom-0 w-[50px] bg-[#0f172a] origin-left transform rotateY(-90deg) translateZ(25px) rounded-l-md border-r border-white/5 flex items-center justify-center shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40"></div>
                  <span className="text-amber-500/80 font-serif font-bold tracking-[0.6em] rotate-90 whitespace-nowrap text-xs drop-shadow-md">HAMROH</span>
                </div>

                {/* FRONT COVER (Animated) */}
                <div
                  className="absolute inset-0 bg-[#0f172a] rounded-r-[24px] rounded-l-[4px] origin-left transform-style-3d transition-all duration-1000 ease-in-out shadow-2xl border-l border-white/10"
                  style={{
                    transform: isBookOpen ? 'rotateY(-180deg)' : 'rotateY(0deg) translateZ(25px)',
                    zIndex: isBookOpen ? 0 : 50,
                    boxShadow: isSavingJournal ? '0 0 50px rgba(234, 179, 8, 0.5)' : ''
                  }}
                >
                  {/* Elaborate Cover Design (FRONT SIDE) */}
                  <div className="absolute inset-0 backface-hidden">
                    <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/60 pointer-events-none"></div>
                    <div className="absolute inset-3 border-2 border-amber-500/20 rounded-r-[18px] rounded-l-[2px]"></div>
                    <div className="absolute inset-5 border border-amber-500/10 rounded-r-[16px] rounded-l-[2px]"></div>

                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                      <div className="relative w-36 h-36 mb-8 rounded-full border-4 border-amber-500/10 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.05)] group-hover:scale-105 transition-transform duration-500 bg-[#162032]">
                        <div className="absolute inset-2 border border-amber-500/20 rounded-full animate-spin-slow"></div>
                        <span className="text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-br from-amber-100 to-amber-700 drop-shadow-sm filter contrast-125">H</span>
                      </div>

                      <h2 className="text-3xl font-serif font-bold text-amber-50 tracking-[0.2em] uppercase drop-shadow-lg mb-2">{t('home.book.cover_title')}</h2>
                      <div className="flex items-center gap-4 w-full justify-center opacity-50 mb-6">
                        <div className="h-px bg-amber-500/50 flex-1"></div>
                        <div className="w-2 h-2 rotate-45 bg-amber-500"></div>
                        <div className="h-px bg-amber-500/50 flex-1"></div>
                      </div>
                      <p className="text-[10px] font-bold text-amber-200/60 tracking-[0.5em] uppercase">{t('home.book.cover_subtitle')}</p>

                      {!isBookOpen && (
                        <div className="absolute bottom-12 text-white/30 text-[10px] font-medium animate-pulse flex items-center gap-2 border border-white/10 px-4 py-2 rounded-full">
                          <Sparkles size={12} /> {t('home.book.click_open')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inner Side of Front Cover (Visible when open) */}
                  <div className="absolute inset-0 bg-[#1e293b] flex items-center justify-center p-8 backface-hidden shadow-inner border-r border-white/5" style={{ transform: 'rotateY(180deg)' }}>
                    <div className="text-center space-y-6 opacity-70">
                      <Quote size={40} className="text-amber-500/40 mx-auto" />
                      <p className="text-slate-300 font-serif italic leading-loose text-lg">
                        {t('home.book.quote')}
                      </p>
                      <div className="w-16 h-1 bg-amber-500/20 mx-auto rounded-full"></div>
                      <p className="text-amber-500/60 text-xs font-bold uppercase tracking-widest">— Abraham Lincoln</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- BENTO GRID DASHBOARD --- */}
        <section className="max-w-7xl mx-auto px-6">

          {/* IDENTITY BANNER (If set) */}
          {userData?.identity && <HomeBanner identity={userData.identity} />}

          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 flex items-center gap-3 uppercase tracking-widest animate-fade-in pl-2">
            <Activity size={16} /> {t('home.activity')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 auto-rows-[200px]">

            {/* 1. XP & Level Card */}
            <div className="sm:col-span-1 lg:col-span-1 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 text-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 flex flex-col justify-between shadow-lg shadow-yellow-500/30 hover:scale-[1.02] transition-transform duration-500 animate-fade-in-up cursor-pointer" onClick={() => setShowXPGuide(true)} style={{ animationDelay: '0.05s' }}>
              <div className="flex items-center justify-between mb-2">
                <Star size={24} className="fill-current" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Level {userData?.level || 1}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl sm:text-4xl font-black mb-1 drop-shadow-md">{userData?.xp || 0}</span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-widest opacity-80">XP</span>
              </div>
              <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500 shadow-lg"
                  style={{ width: `${xpPercentage}%` }}
                ></div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-2">
                {currentLevelXP}/1000 XP
              </p>
            </div>

            {/* 2. Main Stats: Progress (Glass Card) */}
            <div className="sm:col-span-1 lg:col-span-1 bg-white/40 dark:bg-[#151518]/40 backdrop-blur-xl border border-white/40 dark:border-white/5 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 hover:scale-[1.01] transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-xl hover:shadow-indigo-500/10 group animate-fade-in-up cursor-pointer" onClick={() => onNavigate(AppView.INTIZOM)} style={{ animationDelay: '0.1s' }}>
              <div className="flex flex-col justify-center h-full w-full sm:w-auto">
                <h3 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white mb-1 sm:mb-2 tracking-tight">{completionRate}%</h3>
                <p className="text-slate-600 dark:text-slate-400 font-medium text-base sm:text-lg">{t('home.daily_plan')}</p>
                <div className="mt-2 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-600 dark:text-violet-400 group-hover:gap-3 transition-all">
                  <span>{t('home.view_stats')}</span> <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                </div>
              </div>

              <div className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 relative flex-shrink-0" style={{ width: 96, height: 96, minWidth: 96, minHeight: 96 }}>
                <ResponsiveContainer width={96} height={96}>
                  <PieChart width={96} height={96}>
                    <Pie
                      data={displayData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={46}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                      paddingAngle={5}
                      cornerRadius={10}
                    >
                      {displayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center text-indigo-500 dark:text-violet-400">
                  <Target size={24} />
                </div>
              </div>
            </div>

            {/* 2. Streak Card - EXPANDED to fill the gap of XP card */}
            <div className="sm:col-span-2 lg:col-span-2 bg-gradient-to-br from-orange-400 to-rose-500 text-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 flex flex-row justify-between items-center px-6 sm:px-10 shadow-lg shadow-orange-500/30 hover:scale-[1.02] transition-transform duration-500 animate-fade-in-up cursor-pointer" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-col items-start">
                <span className="text-5xl sm:text-6xl font-black mb-1 drop-shadow-md">{streak}</span>
                <span className="text-xs sm:text-sm font-bold uppercase tracking-widest opacity-80">{t('home.streak_label')}</span>
              </div>
              <div className="p-4 sm:p-6 bg-white/20 rounded-full backdrop-blur-md shadow-inner border border-white/20 flex-shrink-0">
                <Flame size={36} className="sm:w-12 sm:h-12 fill-current text-white animate-pulse-slow" />
              </div>
            </div>

            {/* 4. Focus Mode Card (Always Visible) */}
            <div
              onClick={() => onNavigate(AppView.INTIZOM, { tab: 'FOCUS' })}
              className="sm:col-span-2 lg:col-span-2 cursor-pointer bg-[#1e1b4b] dark:bg-[#050505] border border-indigo-500/30 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 hover:bg-[#2e2a6b] dark:hover:bg-white/5 transition-colors group animate-fade-in-up shadow-xl"
              style={{ animationDelay: '0.3s' }}
            >
              <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 w-full sm:w-auto min-w-0 flex-1">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-600 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/40 group-hover:scale-110 transition-transform flex-shrink-0">
                  <BrainCircuit size={32} className="sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{t('home.focus_mode')}</h3>
                  <p className="text-indigo-200/70 text-sm sm:text-base font-medium truncate">{t('home.focus_desc')}</p>
                </div>
              </div>
              <div className="p-3 sm:p-4 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors flex-shrink-0">
                <Target size={24} className="sm:w-6 sm:h-6 text-indigo-300" />
              </div>
            </div>

            {/* 5. Routine Stack (If Active) */}
            {activeRoutine && (
              <div className="sm:col-span-2 lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <RoutineStack
                  routine={activeRoutine}
                  onUpdate={handleRoutineUpdate}
                  onComplete={handleRoutineComplete}
                />
              </div>
            )}

            {/* Fallback Rescue Button (Only if 0 progress and late in day) */}
            {completionRate === 0 && new Date().getHours() >= 18 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-center mt-8 animate-bounce">
                <button
                  onClick={() => onNavigate(AppView.INTIZOM, { tab: 'FOCUS' })} // Or specific rescue action
                  className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-500/30 flex items-center gap-3 transition-transform hover:scale-105"
                >
                  <Zap size={24} className="fill-yellow-300 text-yellow-300" />
                  2 Daqiqalik Qutqaruv (Rescue Mode)
                </button>
              </div>
            )}

          </div>
        </section>

        {/* --- WEEKLY REPORT --- */}
        <section className="max-w-5xl mx-auto px-6">
          <div className="bg-white/60 dark:bg-white/5 border border-white/50 dark:border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-lg backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{t('home.weekly_report.title')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('home.weekly_report.desc')}</p>
              </div>
              <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {weeklyStats.totalTasks > 0 ? Math.round((weeklyStats.completedTasks / weeklyStats.totalTasks) * 100) : 0}%
              </div>
            </div>

            {weeklyStats.loading ? (
              <div className="text-center text-slate-400 py-6">{t('common.loading')}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('home.weekly_report.tasks')}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {weeklyStats.completedTasks}/{weeklyStats.totalTasks}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('home.weekly_report.focus')}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {weeklyStats.focusMinutes} {t('intizom.focus.minutes')}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('home.weekly_report.journal')}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {weeklyStats.journalEntries}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* --- RECENT ACTIVITY LIST --- */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-8 sm:pb-10">
          <h3 className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 sm:mb-6 pl-2 sm:pl-4 animate-fade-in">{t('home.todays_tasks')}</h3>
          <div className="space-y-2 sm:space-y-3">
            {loading ? (
              <div className="text-center py-10 text-slate-400">{t('common.loading')}</div>
            ) : todaysTasks.length > 0 ? (
              todaysTasks.map((task, idx) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 sm:p-6 bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/5 rounded-2xl sm:rounded-3xl hover:border-indigo-500/30 hover:bg-white/60 dark:hover:bg-white/10 transition-all cursor-pointer group animate-fade-in-up shadow-[0_4px_20px_rgb(0,0,0,0.03)] dark:shadow-none backdrop-blur-md"
                  style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
                  onClick={() => onNavigate(AppView.INTIZOM)}
                >
                  <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 ${task.completed ? 'bg-green-500 text-white rotate-0' : 'bg-slate-100 dark:bg-white/10 text-slate-400 rotate-45 group-hover:rotate-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600'}`}>
                      {task.completed ? <CheckCircle size={16} className="sm:w-5 sm:h-5" /> : <div className="w-2 h-2 sm:w-3 sm:h-3 bg-current rounded-sm"></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`font-bold text-base sm:text-lg block truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                        {task.title}
                      </span>
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                        <Clock size={10} className="sm:w-3 sm:h-3" /> {task.time}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl group-hover:bg-white dark:group-hover:bg-white/10 transition-colors flex-shrink-0 ml-2">
                    {task.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-slate-200/50 dark:border-white/10 rounded-[2.5rem] animate-fade-in bg-white/20 dark:bg-white/5 backdrop-blur-sm">
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-4">{t('home.no_tasks')}</p>
                <button
                  onClick={() => onNavigate(AppView.INTIZOM, { tab: 'PLAN' })}
                  className="px-6 py-3 bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-300 rounded-xl font-bold shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-white/5"
                >
                  + {t('home.create_plan')}
                </button>
              </div>
            )}
          </div>
        </section>

      </div>
    </>
  );
};
