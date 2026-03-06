/**
 * =========================================================================================
 * 🚀 MAIN APPLICATION COMPONENT
 * =========================================================================================
 * 
 * SECURITY FEATURES:
 * - Session validation on mount
 * - Proper cleanup on unmount
 * - Error boundary protection
 * - Demo mode support
 * 
 * REAL-TIME FEATURES:
 * - Lazy loading for performance
 * - Suspense boundaries for smooth UX
 * - OAuth callback handling
 * 
 * STATE MANAGEMENT:
 * - User session state
 * - Theme state (light/dark)
 * - Navigation state
 * - Language preference
 * =========================================================================================
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { AppView, User, NavigationParams } from './types';
import { useLanguage } from './contexts/LanguageContext';
import { FocusProvider } from './contexts/FocusContext';
import { api } from './services/api';
import { Loader2 } from 'lucide-react';
import { logger } from './utils/logger';
import { supabase } from './services/supabaseClient';

// Lazy load heavy components for better performance
// Note: All components use named exports, so we need to map them correctly
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Intizom = lazy(() => import('./pages/Intizom').then(module => ({ default: module.Intizom })));
const Community = lazy(() => import('./pages/Community').then(module => ({ default: module.Community })));
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const Support = lazy(() => import('./components/Support').then(module => ({ default: module.Support })));
const Settings = lazy(() => import('./components/Settings').then(module => ({ default: module.Settings })));
const Admin = lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })));
const Market = lazy(() => import('./pages/Market').then(module => ({ default: module.Market })));
const OrgDashboard = lazy(() => import('./pages/OrgDashboard').then(module => ({ default: module.OrgDashboard })));
const ParentPortal = lazy(() => import('./pages/ParentPortal').then(module => ({ default: module.ParentPortal })));

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="fixed inset-0 bg-[#F8FAFC] dark:bg-[#020205] flex items-center justify-center z-[100]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 animate-pulse flex items-center justify-center shadow-2xl shadow-indigo-500/30">
        <span className="text-white font-bold text-2xl">H</span>
      </div>
      <Loader2 className="animate-spin text-slate-400" size={24} />
    </div>
  </div>
);

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [intizomTab, setIntizomTab] = useState<string>('DAILY');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);

  const { setLanguage } = useLanguage();

  // Theme Handling
  useEffect(() => {
    const savedTheme = localStorage.getItem('hamroh_theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('hamroh_theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('hamroh_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('app-theme-neon', 'app-theme-forest', 'app-theme-midnight');
    if (user?.appTheme === 'neon') html.classList.add('app-theme-neon');
    else if (user?.appTheme === 'forest') html.classList.add('app-theme-forest');
    else if (user?.appTheme === 'midnight') html.classList.add('app-theme-midnight');
  }, [user?.appTheme]);

  // Initial Session Check & Auth State Listener
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const sessionUser = await api.getSession();
        if (sessionUser && mounted) {
          const afterStreakCheck = await api.checkStreakWithFreeze();
          setUser(afterStreakCheck || sessionUser);
          setCurrentView(AppView.HOME); // <-- Fix: Force navigation to Workspace
          if (sessionUser.language) {
            setLanguage(sessionUser.language);
          }
        }

        // Only clean up the URL if we successfully got a session OR if there is an explicit error in URL
        const urlHash = window.location.hash;
        const urlSearch = window.location.search;
        const hasSessionParams = (urlHash && urlHash.includes('access_token')) || (urlSearch && urlSearch.includes('code='));
        const hasErrorParams = (urlHash && urlHash.includes('error')) || (urlSearch && urlSearch.includes('error='));

        if ((sessionUser && hasSessionParams) || hasErrorParams) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, '', cleanUrl);
          logger.info('OAuth callback URL cleaned:', cleanUrl);
        }
      } catch (e: unknown) {
        logger.error("Session check failed", e);
        // CRITICAL: Don't force logout here as it might be a temporary network issue
        // api.logout(); 
      } finally {
        if (mounted) {
          setTimeout(() => setIsAppLoading(false), 500);
        }
      }
    };
    initSession();

    // Listen for auth state changes (crucial for OAuth redirects that take a moment to process)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed:', event);
      if (event === 'SIGNED_IN' && session && mounted) {
        // Safe to call async function directly here instead of inside state updater
        initSession();
      } else if (event === 'SIGNED_OUT' && mounted) {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time User Updates
  useEffect(() => {
    if (!user?.id) return;

    const cleanup = api.subscribeToUser(user.id, (event) => {
      if (event.type === 'USER_UPDATE' && event.payload) {
        setUser(prevUser => {
          if (!prevUser) return event.payload;
          // Merge updates to preserve local state if needed
          return { ...prevUser, ...event.payload };
        });
      }
    });

    return () => {
      cleanup();
    };
  }, [user?.id]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Login Handler
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView(AppView.HOME);
    if (loggedInUser.language) {
      setLanguage(loggedInUser.language);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setCurrentView(AppView.HOME);
  };

  // Enhanced Navigation Handler
  const handleNavigate = (view: AppView, params?: NavigationParams) => {
    setCurrentView(view);
    if (view === AppView.INTIZOM) {
      if (params?.tab) {
        setIntizomTab(params.tab);
      } else {
        setIntizomTab('DAILY');
      }
    }
  };

  // Render Logic with Suspense for lazy loading
  const renderView = () => {
    if (!user) return null; // Guard against null user; renderView() is always called with a non-null user
    switch (currentView) {
      case AppView.HOME:
        return <Suspense fallback={<LoadingFallback />}><Home user={user} onNavigate={handleNavigate} /></Suspense>;
      case AppView.INTIZOM:
        return <Suspense fallback={<LoadingFallback />}><Intizom initialTab={intizomTab} /></Suspense>;
      case AppView.COMMUNITY:
        return <Suspense fallback={<LoadingFallback />}><Community currentUser={user} /></Suspense>;
      case AppView.SETTINGS:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Settings
              user={user}
              onUpdateUser={setUser}
              onLogout={handleLogout}
              toggleTheme={toggleTheme}
              isDarkMode={isDarkMode}
              onNavigate={handleNavigate}
            />
          </Suspense>
        );
      case AppView.SUPPORT:
        return <Suspense fallback={<LoadingFallback />}><Support currentUser={user} /></Suspense>;
      case AppView.ABOUT:
        return <Suspense fallback={<LoadingFallback />}><About onNavigate={handleNavigate} /></Suspense>;
      case AppView.ADMIN:
        return user.role === 'admin' ? (
          <Suspense fallback={<LoadingFallback />}><Admin /></Suspense>
        ) : (
          <Suspense fallback={<LoadingFallback />}><Home user={user} onNavigate={handleNavigate} /></Suspense>
        );
      case AppView.MARKET:
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Market
              user={user}
              onUpdateUser={setUser}
              onNavigate={handleNavigate}
            />
          </Suspense>
        );
      case AppView.ORG_DASHBOARD:
        return <Suspense fallback={<LoadingFallback />}><OrgDashboard /></Suspense>;
      case AppView.PARENT_PORTAL:
        return <Suspense fallback={<LoadingFallback />}><ParentPortal user={user} onNavigate={handleNavigate} /></Suspense>;
      default:
        return <Suspense fallback={<LoadingFallback />}><Home user={user} onNavigate={handleNavigate} /></Suspense>;
    }
  };

  // Loading Screen (Splash)
  if (isAppLoading) {
    return (
      <div className="fixed inset-0 bg-[#F8FAFC] dark:bg-[#020205] flex items-center justify-center z-[100]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 animate-pulse flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      </div>
    );
  }

  // If not logged in, show Landing Page
  if (!user) {
    return (
      <LandingPage
        onLogin={handleLogin}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
    );
  }

  // If logged in, show Main Layout
  return (
    <Layout
      currentView={currentView}
      onNavigate={handleNavigate}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
      user={user}
      onUpdateUser={setUser}
      onLogout={handleLogout}
    >
      <FocusProvider>
        {renderView()}
      </FocusProvider>
    </Layout>
  );
}

export default App;
