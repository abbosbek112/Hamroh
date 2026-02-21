
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AppView, NavigationParams } from '../types';
import { Sparkles, Zap, Heart, Send, Instagram, Cpu, Rocket } from 'lucide-react';

interface AboutProps {
  onNavigate: (view: AppView, params?: NavigationParams) => void;
}

export const About: React.FC<AboutProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  const roadmap = [
    {
      year: '2025',
      title: t('about.roadmap.2025.title'),
      desc: t('about.roadmap.2025.desc'),
      status: 'completed'
    },
    {
      year: '2026',
      title: t('about.roadmap.2026.title'),
      desc: t('about.roadmap.2026.desc'),
      status: 'current'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-24 pb-20 overflow-hidden">

      {/* Hero Section */}
      <div className="text-center space-y-8 animate-fade-in-up pt-10 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] -z-10"></div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
          <Sparkles size={12} className="animate-pulse" /> The Future of Growth
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white leading-[1.1]">
          {t('about.title_prefix')} <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 filter drop-shadow-sm">{t('about.title_highlight')}</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-medium max-w-3xl mx-auto leading-relaxed">
          {t('about.subtitle')}
        </p>
      </div>

      {/* Intro Text Card with Glassmorphism */}
      <div className="relative group animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-violet-600 rounded-[2.5rem] blur-md opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-white/70 dark:bg-[#1a1a1e]/80 backdrop-blur-xl border border-white/60 dark:border-white/10 p-6 sm:p-10 md:p-14 rounded-[2.5rem] shadow-2xl">
          <p className="text-lg md:text-xl leading-relaxed text-slate-700 dark:text-slate-200 font-medium text-center">
            {t('about.intro')}
          </p>
        </div>
      </div>


      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/10 border border-indigo-100 dark:border-white/5 p-10 rounded-[2.5rem] hover:scale-[1.02] transition-all duration-500">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-indigo-600/30">
            <Zap size={32} />
          </div>
          <h3 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">{t('about.feature_1_title')}</h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
            {t('about.feature_1_desc')}
          </p>
        </div>
        <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/10 border border-fuchsia-100 dark:border-white/5 p-10 rounded-[2.5rem] hover:scale-[1.02] transition-all duration-500">
          <div className="w-16 h-16 bg-fuchsia-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-fuchsia-600/30">
            <Heart size={32} />
          </div>
          <h3 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">{t('about.feature_2_title')}</h3>
          <ul className="space-y-4 text-slate-600 dark:text-slate-300 text-lg">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-2 h-2 bg-fuchsia-500 rounded-full flex-shrink-0"></span>
              <span>
                <strong className="block text-slate-900 dark:text-white text-lg">{t('about.feature_2_li_1_title')}</strong>
                {t('about.feature_2_li_1_desc')}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 w-2 h-2 bg-fuchsia-500 rounded-full flex-shrink-0"></span>
              <span>
                <strong className="block text-slate-900 dark:text-white text-lg">{t('about.feature_2_li_2_title')}</strong>
                {t('about.feature_2_li_2_desc')}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* NEW: Roadmap Section */}
      <div className="py-10">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-16 text-slate-900 dark:text-white">{t('about.roadmap_title')}</h2>
        <div className="relative max-w-4xl mx-auto">
          {/* Center Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-slate-200 dark:bg-white/10 -translate-x-1/2"></div>

          <div className="space-y-12">
            {roadmap.map((item, idx) => (
              <div key={idx} className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className="flex-1 w-full md:w-auto">
                  <div className={`bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all ${idx % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold mb-2 uppercase ${item.status === 'completed' ? 'bg-green-100 text-green-700' :
                      item.status === 'current' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                      {item.year}
                    </span>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{item.title}</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{item.desc}</p>
                  </div>
                </div>
                <div className="relative flex items-center justify-center w-8 h-8 shrink-0 z-10">
                  <div className={`w-4 h-4 rounded-full ${item.status === 'completed' ? 'bg-green-500' : item.status === 'current' ? 'bg-blue-500' : 'bg-slate-300'} ring-4 ring-white dark:ring-[#0a0a0c]`}></div>
                </div>
                <div className="flex-1 w-full md:w-auto hidden md:block"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Philosophy/CTA Section */}
      <div className="bg-[#0f172a] dark:bg-black rounded-[3rem] p-12 md:p-20 text-center text-white shadow-2xl relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-black mb-8 tracking-tight">{t('about.why_title')}</h2>
          <p className="text-blue-100/80 max-w-3xl mx-auto mb-12 text-xl leading-relaxed">
            {t('about.why_desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate(AppView.INTIZOM, { tab: 'PLAN' })}
              className="bg-white text-blue-900 px-10 py-5 rounded-2xl font-bold text-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
            >
              <Rocket size={24} /> {t('about.cta_btn')}
            </button>
          </div>
        </div>
      </div>

      {/* Socials Section */}
      <div className="pt-10 border-t border-slate-200 dark:border-white/5">
        <h2 className="text-3xl font-bold text-center mb-10 text-slate-900 dark:text-white">{t('about.social_title')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Telegram */}
          <a
            href="https://t.me/hamrohai_rasmiy"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-6 p-6 rounded-[2rem] bg-white/50 dark:bg-white/5 border border-blue-100 dark:border-white/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-500/30 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
              <Send size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Telegram</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">@hamrohai_rasmiy</p>
            </div>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/hamrohai"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-6 p-6 rounded-[2rem] bg-white/50 dark:bg-white/5 border border-pink-100 dark:border-white/10 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:border-pink-200 dark:hover:border-pink-500/30 transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
              <Instagram size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Instagram</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">@hamrohai</p>
            </div>
          </a>
        </div>
      </div>

    </div>
  );
};
