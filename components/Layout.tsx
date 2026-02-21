
import React, { useState, useEffect } from 'react';
import { LiquidBackground } from './LiquidBackground';
import { UserBadge } from './UserBadge';
import { AppView, User, SystemConfig, NavigationParams } from '../types';
import {
  Home, Target, Users, Info, Menu, X,
  Moon, Sun, Headphones, LogOut, Settings as SettingsIcon,
  Shield, ShoppingBag
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { logger } from '../utils/logger';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onNavigate: (view: AppView, params?: NavigationParams) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  user: User | null;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onNavigate,
  isDarkMode,
  toggleTheme,
  user,
  onUpdateUser,
  onLogout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, setSystemConfig] = useState<SystemConfig | null>(null);
  const { t, language, setLanguage } = useLanguage();

  useEffect(() => {
    api.getSystemConfig().then(setSystemConfig);
  }, []);

  const navItems = [
    { view: AppView.HOME, label: t('nav.home'), icon: Home },
    { view: AppView.INTIZOM, label: t('nav.intizom'), icon: Target },
    { view: AppView.COMMUNITY, label: t('nav.maqsaddosh'), icon: Users },
    { view: AppView.MARKET, label: t('nav.market'), icon: ShoppingBag },
    { view: AppView.SETTINGS, label: t('nav.settings'), icon: SettingsIcon },
    { view: AppView.SUPPORT, label: t('nav.support'), icon: Headphones },
    { view: AppView.ABOUT, label: t('nav.about'), icon: Info },
  ];

  const handleLanguageChange = async (lang: string) => {
    const newLang = lang.toLowerCase() as 'uz' | 'ru' | 'en';
    const prevLang = user?.language ?? language;
    setLanguage(newLang);
    if (user) {
      const updatedUser = { ...user, language: newLang };
      onUpdateUser(updatedUser);
      try {
        await api.updateUser(updatedUser);
      } catch (e: unknown) {
        logger.error("Failed to update language", e);
        setLanguage(prevLang);
        onUpdateUser({ ...user, language: prevLang });
      }
    }
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-300 font-sans" style={{ isolation: 'isolate' }}>
      <LiquidBackground />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white/30 dark:bg-[#0a0a0c]/50 backdrop-blur-xl border-b border-white/20 dark:border-white/5 z-50 flex items-center justify-between px-6 shadow-sm" style={{ isolation: 'isolate' }}>
        <div className="text-xl font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-white dark:to-slate-400">
          Hamroh AI
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTheme();
            }}
            className="p-2.5 rounded-full hover:bg-white/20 dark:hover:bg-white/5 active:bg-white/30 dark:active:bg-white/10 transition-all text-slate-600 dark:text-slate-400 touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label={isDarkMode ? t('nav.light_mode') : t('nav.dark_mode')}
          >
            {isDarkMode ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="p-2.5 rounded-full hover:bg-white/20 dark:hover:bg-white/5 active:bg-white/30 dark:active:bg-white/10 transition-all text-slate-600 dark:text-slate-400 touch-manipulation"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={24} strokeWidth={2} /> : <Menu size={24} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Sidebar (Desktop) - Highly Transparent Glass */}
      <aside className="hidden lg:flex flex-col w-72 fixed top-0 bottom-0 left-0 bg-white/30 dark:bg-[#0a0a0c]/40 backdrop-blur-2xl border-r border-white/20 dark:border-white/5 z-40 p-8 shadow-[0_0_40px_rgba(0,0,0,0.02)]">
        <div className="text-3xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600 dark:from-indigo-400 dark:to-fuchsia-400 pl-2">
          Hamroh
        </div>

        {/* User Profile Snippet */}
        {user && (
          <div className="mb-8 p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 transition-all shadow-sm hover:shadow-md backdrop-blur-md group" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
            <div className="flex items-center gap-3 cursor-pointer mb-3 relative" onClick={() => onNavigate(AppView.SETTINGS)} style={{ overflow: 'visible', zIndex: 100 }}>
              <div style={{ position: 'relative', zIndex: 101, overflow: 'visible' }}>
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200 shadow-sm object-cover ring-2 ring-white/50 dark:ring-white/10 group-hover:scale-105 transition-transform relative" style={{ zIndex: 101 }} />
              </div>
              <div className="flex-1 min-w-0 relative" style={{ overflow: 'visible', zIndex: 100 }}>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 relative" style={{ overflow: 'visible', zIndex: 100 }}>
                  <span style={{ position: 'relative', zIndex: 102, overflow: 'visible', display: 'inline-block' }}>
                    <UserBadge user={user} size="sm" />
                  </span>
                  <span className="truncate relative" style={{ zIndex: 101 }}>{user.name}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium relative" style={{ zIndex: 101 }}>@{user.username}</p>
              </div>
            </div>

            {/* Language Switcher & Admin */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/30 dark:border-white/5">
              <div className="flex gap-1 bg-white/20 dark:bg-black/20 p-1 rounded-lg border border-white/20 dark:border-white/5">
                {['UZ', 'RU', 'EN'].map((lang) => (
                  <button
                    key={lang}
                    onClick={(e) => { e.stopPropagation(); handleLanguageChange(lang); }}
                    className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${language === lang.toLowerCase()
                      ? 'bg-white/80 text-indigo-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              {user.role === 'admin' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate(AppView.ADMIN); }}
                  className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors bg-white/20 dark:bg-black/20 rounded-lg border border-white/20 dark:border-white/5"
                  title="Admin Panel"
                >
                  <Shield size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden
                ${currentView === item.view
                  ? 'text-indigo-700 dark:text-indigo-300 bg-white/60 dark:bg-white/10 font-bold shadow-sm border border-white/40 dark:border-white/10 backdrop-blur-md'
                  : 'hover:bg-white/30 dark:hover:bg-white/5 hover:translate-x-1 text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
            >
              <item.icon size={20} strokeWidth={2} className={currentView === item.view ? 'opacity-100' : 'opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0'} />
              <span className={`text-sm tracking-wide whitespace-nowrap ${currentView === item.view ? 'opacity-100' : 'opacity-90'}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-4 space-y-3">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-white/30 dark:hover:bg-white/5 transition-all text-slate-600 dark:text-slate-400 group font-semibold border border-transparent hover:border-white/20 dark:hover:border-white/5 backdrop-blur-sm"
          >
            {isDarkMode ? <Sun size={20} strokeWidth={2} className="group-hover:text-yellow-400 transition-colors" /> : <Moon size={20} strokeWidth={2} className="group-hover:text-indigo-600 transition-colors" />}
            <span className="text-sm tracking-wide">{isDarkMode ? t('nav.light_mode') : t('nav.dark_mode')}</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-red-50/50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-500 transition-all text-slate-600 dark:text-slate-400 font-semibold border border-transparent hover:border-red-100/50 dark:hover:border-transparent backdrop-blur-sm"
          >
            <LogOut size={20} strokeWidth={2} />
            <span className="text-sm tracking-wide">{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-md transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ zIndex: 60, overflow: 'visible' }}
          onTouchStart={(e) => {
            if (e.target === e.currentTarget) {
              setIsMobileMenuOpen(false);
            }
          }}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-72 bg-white/80 dark:bg-[#0a0a0c]/90 border-l border-white/20 dark:border-white/10 p-8 flex flex-col shadow-2xl backdrop-blur-xl"
            onClick={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            style={{ zIndex: 55, overflowY: 'auto', overflowX: 'visible' }}
          >
            {user && (
              <div className="mt-16 mb-6 flex flex-col gap-4 pb-6 border-b border-slate-200/50 dark:border-white/10" style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
                <div
                  className="flex items-center gap-3 cursor-pointer relative"
                  onClick={() => { onNavigate(AppView.SETTINGS); setIsMobileMenuOpen(false); }}
                  onTouchEnd={() => { onNavigate(AppView.SETTINGS); setIsMobileMenuOpen(false); }}
                  style={{ overflow: 'visible', isolation: 'isolate', zIndex: 100 }}
                >
                  <div style={{ position: 'relative', zIndex: 101, overflow: 'visible' }}>
                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-white/50 dark:ring-white/10 relative" style={{ zIndex: 101 }} />
                  </div>
                  <div className="flex-1 min-w-0 relative" style={{ overflow: 'visible', zIndex: 100 }}>
                    <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 relative" style={{ overflow: 'visible', zIndex: 100 }}>
                      <span style={{ position: 'relative', zIndex: 102, overflow: 'visible', display: 'inline-block' }}>
                        <UserBadge user={user} size="sm" />
                      </span>
                      <span className="truncate relative" style={{ zIndex: 101 }}>{user.name}</span>
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        onLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-xs text-red-500 mt-1 font-medium hover:text-red-600 active:text-red-700 touch-manipulation"
                      style={{ minHeight: '32px', padding: '4px 0' }}
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>

                {/* Mobile Language Switch */}
                <div className="flex gap-2 justify-center bg-slate-50/50 dark:bg-white/5 p-2 rounded-xl">
                  {['UZ', 'RU', 'EN'].map((lang) => (
                    <button
                      key={lang}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLanguageChange(lang);
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        handleLanguageChange(lang);
                      }}
                      className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition-all touch-manipulation ${language === lang.toLowerCase()
                        ? 'bg-white text-indigo-900 shadow-sm dark:bg-white dark:text-black'
                        : 'text-slate-400 active:bg-slate-100 dark:active:bg-white/10'
                        }`}
                      style={{ minHeight: '40px' }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>

                {/* Theme Toggle Button in Mobile Menu */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100/50 dark:hover:bg-white/10 active:bg-slate-200/50 dark:active:bg-white/15 transition-all text-slate-600 dark:text-slate-400 font-semibold border border-slate-200/50 dark:border-white/10 touch-manipulation"
                  style={{ minHeight: '48px' }}
                >
                  {isDarkMode ? (
                    <>
                      <Sun size={20} strokeWidth={2} className="text-yellow-500" />
                      <span className="text-sm">{t('nav.light_mode')}</span>
                    </>
                  ) : (
                    <>
                      <Moon size={20} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm">{t('nav.dark_mode')}</span>
                    </>
                  )}
                </button>

                {user.role === 'admin' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(AppView.ADMIN);
                      setIsMobileMenuOpen(false);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      onNavigate(AppView.ADMIN);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-slate-200 dark:active:bg-white/10 touch-manipulation"
                    style={{ minHeight: '48px' }}
                  >
                    <Shield size={16} /> Admin Panel
                  </button>
                )}
              </div>
            )}
            {!user && (
              <div className="mt-20 mb-6">
                {/* Theme Toggle Button for non-logged in users */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    toggleTheme();
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-slate-50/50 dark:bg-white/5 hover:bg-slate-100/50 dark:hover:bg-white/10 active:bg-slate-200/50 dark:active:bg-white/15 transition-all text-slate-600 dark:text-slate-400 font-semibold border border-slate-200/50 dark:border-white/10 touch-manipulation"
                  style={{ minHeight: '48px' }}
                >
                  {isDarkMode ? (
                    <>
                      <Sun size={20} strokeWidth={2} className="text-yellow-500" />
                      <span className="text-sm">{t('nav.light_mode')}</span>
                    </>
                  ) : (
                    <>
                      <Moon size={20} strokeWidth={2} className="text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm">{t('nav.dark_mode')}</span>
                    </>
                  )}
                </button>
              </div>
            )}
            <div className={user ? "" : ""}>
              <nav className="space-y-4">
                {navItems.map((item) => (
                  <button
                    key={item.view}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(item.view);
                      setIsMobileMenuOpen(false);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      onNavigate(item.view);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all touch-manipulation
                      ${currentView === item.view
                        ? 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100/50 dark:border-transparent shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-50/50 dark:hover:bg-white/5 active:bg-slate-100/50 dark:active:bg-white/10'
                      }`}
                    style={{ minHeight: '48px' }}
                  >
                    <item.icon size={20} strokeWidth={2} className="flex-shrink-0" />
                    <span className="text-sm whitespace-nowrap">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="lg:ml-72 pt-28 lg:pt-12 px-6 lg:px-16 pb-16 min-h-screen" style={{ isolation: 'isolate', position: 'relative', zIndex: 10 }}>
        <div className="max-w-7xl mx-auto h-full animate-fade-in relative" style={{ isolation: 'isolate', zIndex: 10, overflow: 'visible' }}>
          {children}
        </div>
      </main>
    </div>
  );
};
