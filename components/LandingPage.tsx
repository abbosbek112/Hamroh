
import React, { useState, useEffect, useRef } from 'react';
import {
   ArrowRight, Zap, Check, TrendingUp, Users,
   MessageCircle, Moon, Sun, Menu, X,
   Calendar, Clock, Trophy, BookOpen, Smile, Sparkles, Target, Flame, Bell,
   ChevronDown, Star, Mail, Twitter, Linkedin, Heart, Send, Instagram
} from 'lucide-react';
import { Auth } from './Auth';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { LiquidBackground } from './LiquidBackground';

interface LandingPageProps {
   onLogin: (user: User) => void;
   toggleTheme: () => void;
   isDarkMode: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, toggleTheme, isDarkMode }) => {
   const [isAuthOpen, setIsAuthOpen] = useState(false);
   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
   const [faqOpen, setFaqOpen] = useState<number | null>(null);
   const { t, language, setLanguage } = useLanguage();

   const phoneRef = useRef<HTMLDivElement>(null);

   const features = [
      { title: t('landing.f_chat_title'), desc: t('landing.f_chat_desc'), icon: Smile, gradient: "from-blue-500 to-cyan-500" },
      { title: t('landing.f_planner_title'), desc: t('landing.f_planner_desc'), icon: Calendar, gradient: "from-purple-500 to-pink-500" },
      { title: t('landing.f_community_title'), desc: t('landing.f_community_desc'), icon: Users, gradient: "from-green-500 to-emerald-500" },
      { title: t('landing.f_focus_title'), desc: t('landing.f_focus_desc'), icon: Clock, gradient: "from-orange-500 to-red-500" },
      { title: t('landing.f_journal_title'), desc: t('landing.f_journal_desc'), icon: BookOpen, gradient: "from-indigo-500 to-violet-500" },
      { title: t('landing.f_stats_title'), desc: t('landing.f_stats_desc'), icon: Trophy, gradient: "from-yellow-500 to-amber-500" }
   ];

   const steps = [
      { id: 1, title: t('landing.how_it_works.step_1_title'), desc: t('landing.how_it_works.step_1_desc') },
      { id: 2, title: t('landing.how_it_works.step_2_title'), desc: t('landing.how_it_works.step_2_desc') },
      { id: 3, title: t('landing.how_it_works.step_3_title'), desc: t('landing.how_it_works.step_3_desc') },
      { id: 4, title: t('landing.how_it_works.step_4_title'), desc: t('landing.how_it_works.step_4_desc') },
   ];

   const testimonials = [
      { text: t('landing.testimonials.t1_text'), name: t('landing.testimonials.t1_name'), color: 'bg-indigo-500' },
      { text: t('landing.testimonials.t2_text'), name: t('landing.testimonials.t2_name'), color: 'bg-pink-500' },
      { text: t('landing.testimonials.t3_text'), name: t('landing.testimonials.t3_name'), color: 'bg-emerald-500' },
   ];

   const faqs = [
      { q: t('landing.faq_1_q'), a: t('landing.faq_1_a') },
      { q: t('landing.faq_2_q'), a: t('landing.faq_2_a') },
      { q: t('landing.faq_3_q'), a: t('landing.faq_3_a') },
      { q: t('landing.faq_4_q'), a: t('landing.faq_4_a') },
   ];

   return (
      <div className="min-h-screen font-sans overflow-x-hidden relative selection:bg-indigo-500/30 text-slate-900 dark:text-white">

         {/* GLOBAL 3D BACKGROUND */}
         <LiquidBackground />

         {/* --- NAVBAR --- */}
         <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6 transition-all duration-300">
            <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/70 dark:bg-[#0a0a0c]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl px-6 py-3 shadow-lg dark:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
               <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(99,102,241,0.5)] text-white group-hover:scale-105 transition-transform relative overflow-hidden">
                     <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                     H
                  </div>
                  <span className="font-bold text-xl tracking-tight">Hamroh AI</span>
               </div>

               <div className="hidden md:flex items-center gap-4">
                  {/* Language Switcher */}
                  <div className="flex gap-1 bg-slate-100/50 dark:bg-white/5 p-1 rounded-xl border border-white/20 dark:border-white/5">
                     {['UZ', 'RU', 'EN'].map((lang) => (
                        <button
                           key={lang}
                           onClick={() => setLanguage(lang.toLowerCase() as any)}
                           className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${language === lang.toLowerCase()
                              ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                              }`}
                        >
                           {lang}
                        </button>
                     ))}
                  </div>

                  {/* Theme Toggle Button */}
                  <button
                     onClick={toggleTheme}
                     className="p-2.5 rounded-xl bg-slate-100/50 dark:bg-white/5 border border-white/20 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm hover:shadow-md"
                     title={isDarkMode ? t('nav.light_mode') : t('nav.dark_mode')}
                  >
                     {isDarkMode ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
                  </button>

                  <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>

                  <button
                     onClick={() => setIsAuthOpen(true)}
                     className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                     {t('landing.login')}
                  </button>
               </div>

               <button className="md:hidden p-2 text-slate-700 dark:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
               </button>
            </div>
         </nav>

         {/* --- HERO SECTION --- */}
         <section className="relative pt-44 pb-20 px-6 min-h-screen flex flex-col items-center justify-center overflow-hidden perspective-2000">
            <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">

               {/* LEFT: CONTENT */}
               <div className="text-center lg:text-left space-y-8 order-2 lg:order-1 relative z-20 isolate">

                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200 dark:border-violet-500/30 bg-indigo-50 dark:bg-violet-500/10 text-indigo-600 dark:text-violet-300 text-xs font-bold uppercase tracking-widest animate-fade-in-up hover:bg-indigo-100 dark:hover:bg-violet-500/20 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)] relative z-20">
                     <Sparkles size={12} className="animate-pulse" />
                     <span>{t('landing.badge')}</span>
                  </div>

                  <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[1] animate-fade-in-up relative z-20" style={{ animationDelay: '0.1s' }}>
                     <span className="block text-slate-900 dark:text-white relative z-20">{t('landing.hero_title_1')}</span>
                     <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 pb-4 relative z-20">
                        {t('landing.hero_title_2')}
                     </span>
                  </h1>

                  {/* REMOVED: Description, Buttons, Social Proof as per request "buni ochir" */}

               </div>

               {/* RIGHT: 3D PHONE MOCKUP (INTERACTIVE) */}
               <div className="order-1 lg:order-2 flex justify-center lg:justify-end relative perspective-1000">
                  <div
                     ref={phoneRef}
                     className="relative w-[320px] h-[640px] md:w-[340px] md:h-[680px] transform-style-3d transition-transform duration-100 ease-out"
                     style={{
                        transform: `rotateY(calc(var(--mouse-x) * 15deg - 7.5deg)) rotateX(calc(var(--mouse-y) * -15deg + 7.5deg))`
                     }}
                  >
                     {/* Floating Glow Behind Phone */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[90%] bg-indigo-500/20 dark:bg-indigo-600/30 blur-[80px] rounded-full -z-10 animate-pulse-slow"></div>

                     {/* Phone Body with Rim Light */}
                     <div className="absolute inset-0 bg-white dark:bg-[#0a0a0c] rounded-[3.5rem] border-[6px] border-slate-100 dark:border-[#1a1a1e] shadow-2xl dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-black/5 dark:ring-white/20 relative z-10">

                        {/* Rim Light Reflection */}
                        <div className="absolute inset-0 rounded-[3.2rem] ring-1 ring-inset ring-white/50 dark:ring-white/10 pointer-events-none z-50"></div>

                        {/* Screen Content */}
                        <div className="flex-1 h-full bg-slate-50 dark:bg-[#0a0a0c] relative flex flex-col">
                           {/* Header Mesh */}
                           <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-100/50 dark:from-indigo-900/40 to-transparent pointer-events-none"></div>

                           {/* App Header */}
                           <div className="h-20 pt-6 px-6 flex items-center justify-between z-10">
                              <div className="w-8 h-8 rounded-full bg-white dark:bg-white/10 shadow-sm flex items-center justify-center"><Menu size={14} className="text-slate-600 dark:text-white" /></div>
                              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500">HAMROH</span>
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md"></div>
                           </div>

                           {/* App Body */}
                           <div className="p-6 space-y-5 relative z-10">

                              {/* Main Stats Card */}
                              <div className="bg-white dark:bg-white/5 backdrop-blur-xl p-5 rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-lg dark:shadow-none transform translate-z-10 hover:scale-105 transition-transform group">
                                 <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-xl text-green-600 dark:text-green-400"><TrendingUp size={18} /></div>
                                    <div className="text-right">
                                       <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-500/20 text-[8px] font-bold text-red-500 dark:text-red-400 uppercase">
                                          <Clock size={8} /> {t('landing.mock_reminder')}
                                       </div>
                                       <div className="text-[10px] text-slate-400 mt-1">{t('landing.mock_reading_time')}</div>
                                    </div>
                                 </div>
                                 <div className="text-4xl font-black text-slate-900 dark:text-white mb-2">1,240 <span className="text-sm text-slate-400">XP</span></div>
                                 <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                                    <div className="h-full w-3/4 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                 </div>
                              </div>

                              {/* Streak Card */}
                              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 rounded-[2rem] flex items-center gap-4 shadow-xl shadow-indigo-500/20 dark:shadow-indigo-900/50 transform translate-z-20 hover:translate-x-1 transition-transform border border-white/10 relative overflow-hidden text-white">
                                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                                 <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-inner border border-white/10">
                                    <Flame size={24} fill="currentColor" />
                                 </div>
                                 <div>
                                    <div className="text-3xl font-black leading-none">12</div>
                                    <div className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest mt-0.5">{t('landing.mock_streak')}</div>
                                 </div>
                              </div>

                              {/* Tasks List */}
                              <div className="space-y-2.5 pt-2">
                                 {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none hover:bg-slate-50 dark:hover:bg-white/10 transition-colors">
                                       <div className={`w-5 h-5 rounded-full flex items-center justify-center ${i === 1 ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'border border-slate-300 dark:border-white/20'}`}>
                                          {i === 1 && <Check size={10} strokeWidth={4} />}
                                       </div>
                                       <div className="flex-1 space-y-1.5">
                                          <div className="h-1.5 w-24 bg-slate-200 dark:bg-white/20 rounded-full"></div>
                                          <div className="h-1.5 w-16 bg-slate-100 dark:bg-white/10 rounded-full"></div>
                                       </div>
                                    </div>
                                 ))}
                              </div>

                              {/* Bottom Nav */}
                              <div className="absolute bottom-6 left-6 right-6 h-16 bg-white/90 dark:bg-[#1a1a1e]/90 backdrop-blur-2xl rounded-3xl flex justify-around items-center border border-slate-100 dark:border-white/5 shadow-lg">
                                 <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30"><Target size={18} /></div>
                                 <Calendar size={20} className="text-slate-400" />
                                 <Users size={20} className="text-slate-400" />
                              </div>

                           </div>
                        </div>
                     </div>

                     {/* SATELLITE ELEMENTS (Floating outside phone) */}
                     <div className="absolute -left-8 bottom-32 w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center shadow-[0_10px_40px_rgba(34,197,94,0.3)] border-4 border-white dark:border-[#050505] transform translate-z-40 animate-float-medium z-20 hover:scale-110 transition-transform">
                        <Check size={40} strokeWidth={4} className="text-white" />
                     </div>

                     <div className="absolute -right-10 top-20 bg-white/80 dark:bg-white/10 backdrop-blur-xl p-3 pr-6 rounded-2xl border border-white/50 dark:border-white/10 flex items-center gap-3 shadow-2xl transform translate-z-50 animate-float-slow z-20">
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-500 dark:text-violet-300"><Bell size={14} /></div>
                        <div className="space-y-1">
                           <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/40 rounded-full"></div>
                           <div className="w-8 h-1.5 bg-slate-100 dark:bg-white/20 rounded-full"></div>
                        </div>
                     </div>

                  </div>
               </div>
            </div>
         </section>

         {/* --- FEATURES GRID --- */}
         <section className="py-32 px-6 max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
               <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-slate-900 dark:text-white">{t('landing.features_title')}</h2>
               <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{t('landing.features_desc')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {features.map((feature, idx) => (
                  <div key={idx} className="group bg-white/60 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 backdrop-blur-sm p-8 rounded-[2rem] border border-white/60 dark:border-white/5 hover:border-white/80 dark:hover:border-white/10 transition-all duration-500 relative overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none">
                     <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full blur-[60px] opacity-0 group-hover:opacity-20 dark:group-hover:opacity-40 transition-opacity duration-700`}></div>

                     <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-6 shadow-lg relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon size={28} strokeWidth={2} />
                     </div>

                     <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white relative z-10">{feature.title}</h3>
                     <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed relative z-10">{feature.desc}</p>
                  </div>
               ))}
            </div>
         </section>

         {/* --- HOW IT WORKS --- */}
         <section className="py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
               <h2 className="text-4xl font-black text-center mb-16 text-slate-900 dark:text-white">{t('landing.how_it_works.title')}</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {steps.map((step, idx) => (
                     <div key={step.id} className="relative flex flex-col items-center text-center group">
                        {/* Connector Line */}
                        {idx < steps.length - 1 && (
                           <div className="hidden lg:block absolute top-8 left-[60%] w-full h-[2px] bg-gradient-to-r from-indigo-500/20 to-transparent"></div>
                        )}

                        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/5 border border-indigo-100 dark:border-white/10 flex items-center justify-center text-2xl font-black text-indigo-600 dark:text-indigo-400 shadow-lg mb-6 relative z-10 group-hover:scale-110 transition-transform duration-300">
                           {step.id}
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{step.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{step.desc}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* --- TESTIMONIALS --- */}
         <section className="py-24 bg-slate-50/50 dark:bg-white/5 border-y border-slate-200/50 dark:border-white/5 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6">
               <h2 className="text-4xl font-black text-center mb-16 text-slate-900 dark:text-white">{t('landing.testimonials.title')}</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {testimonials.map((test, idx) => (
                     <div key={idx} className="bg-white dark:bg-black/20 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-white/5 hover:-translate-y-2 transition-transform duration-300">
                        <div className="flex gap-1 mb-6">
                           {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} className="text-yellow-400 fill-yellow-400" />)}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed italic">"{test.text}"</p>
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-full ${test.color} flex items-center justify-center text-white font-bold`}>
                              {test.name.charAt(0)}
                           </div>
                           <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm">{test.name.split(',')[0]}</div>
                              <div className="text-xs text-slate-500">{test.name.split(',')[1]}</div>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* --- FAQ SECTION --- */}
         <section className="py-24 px-6 max-w-3xl mx-auto">
            <h2 className="text-4xl font-black text-center mb-12 text-slate-900 dark:text-white">{t('landing.faq_title')}</h2>
            <div className="space-y-4">
               {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300">
                     <button
                        onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                        className="w-full p-6 text-left flex justify-between items-center font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                     >
                        {faq.q}
                        <ChevronDown className={`transition-transform duration-300 ${faqOpen === idx ? 'rotate-180' : ''}`} />
                     </button>
                     <div className={`px-6 text-slate-600 dark:text-slate-300 leading-relaxed overflow-hidden transition-all duration-300 ${faqOpen === idx ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {faq.a}
                     </div>
                  </div>
               ))}
            </div>
         </section>

         {/* --- FINAL CTA --- */}
         <section className="py-20 px-6">
            <div className="max-w-5xl mx-auto bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
               <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-[100px] pointer-events-none"></div>

               <div className="relative z-10">
                  <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">{t('landing.cta_title')}</h2>
                  <p className="text-indigo-100 text-xl mb-10 max-w-2xl mx-auto">
                     {t('landing.cta_desc')}
                  </p>
                  <button
                     onClick={() => setIsAuthOpen(true)}
                     className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-bold text-xl hover:scale-105 hover:shadow-2xl transition-all shadow-lg"
                  >
                     {t('landing.cta_btn')}
                  </button>
               </div>
            </div>
         </section>

         {/* --- FOOTER --- */}
         <footer className="relative z-10 border-t border-slate-200 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-16">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

                  {/* Brand Column */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(99,102,241,0.5)] text-white">
                           H
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Hamroh AI</span>
                     </div>
                     <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        {t('landing.footer_desc') || "Sizning shaxsiy yordamchingiz - kunlik vazifalar, jamiyat va o'sish uchun bitta platforma."}
                     </p>
                     <div className="flex gap-3">
                        <a
                           href="https://t.me/hamroh_ai"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600 flex items-center justify-center text-white hover:scale-110 transition-all shadow-lg hover:shadow-xl"
                           title="Telegram kanalimiz"
                        >
                           <Send size={18} />
                        </a>
                        <a
                           href="https://instagram.com/hamroh_ai"
                           target="_blank"
                           rel="noopener noreferrer"
                           className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 hover:from-pink-600 hover:via-red-600 hover:to-orange-600 flex items-center justify-center text-white hover:scale-110 transition-all shadow-lg hover:shadow-xl"
                           title="Instagram sahifamiz"
                        >
                           <Instagram size={18} />
                        </a>
                     </div>
                  </div>

                  {/* Stats / Fun Facts Column */}
                  <div>
                     <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-500" />
                        {t('landing.footer.stats_title') || 'Qiziq Statistika'}
                     </h3>
                     <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-xs mt-0.5 shadow-lg">
                              <Trophy size={14} />
                           </div>
                           <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm">10,000+</div>
                              <div className="text-slate-500 dark:text-slate-400 text-xs">Yutuqlar</div>
                           </div>
                        </li>
                        <li className="flex items-start gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs mt-0.5 shadow-lg">
                              <Flame size={14} />
                           </div>
                           <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm">50,000+</div>
                              <div className="text-slate-500 dark:text-slate-400 text-xs">Focus Soatlari</div>
                           </div>
                        </li>
                        <li className="flex items-start gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs mt-0.5 shadow-lg">
                              <Users size={14} />
                           </div>
                           <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm">5,000+</div>
                              <div className="text-slate-500 dark:text-slate-400 text-xs">Faol Foydalanuvchilar</div>
                           </div>
                        </li>
                     </ul>
                  </div>

                  {/* Badges / Achievements Column */}
                  <div>
                     <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Star size={18} className="text-yellow-500 fill-yellow-500" />
                        {t('landing.footer.badges_title') || 'Top Yutuqlar'}
                     </h3>
                     <ul className="space-y-3">
                        <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors cursor-pointer group">
                           <span className="text-lg group-hover:scale-110 transition-transform">🔥</span>
                           <span>{t('landing.footer.badge_1')}</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors cursor-pointer group">
                           <span className="text-lg group-hover:scale-110 transition-transform">⚡</span>
                           <span>{t('landing.footer.badge_2')}</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors cursor-pointer group">
                           <span className="text-lg group-hover:scale-110 transition-transform">🎯</span>
                           <span>{t('landing.footer.badge_3')}</span>
                        </li>
                        <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors cursor-pointer group">
                           <span className="text-lg group-hover:scale-110 transition-transform">💎</span>
                           <span>{t('landing.footer.badge_4')}</span>
                        </li>
                     </ul>
                  </div>

                  {/* Fun Facts / Inspiration Column */}
                  <div>
                     <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Zap size={18} className="text-yellow-500" />
                        {t('landing.footer.funfacts_title') || 'Qiziq Ma\'lumotlar'}
                     </h3>
                     <ul className="space-y-3">
                        <li className="flex items-start gap-2">
                           <span className="text-indigo-500 dark:text-indigo-400 mt-0.5">•</span>
                           <span className="text-slate-600 dark:text-slate-400 text-sm">
                              {t('landing.footer.fact_1') || 'Har kuni 21 kun davomida qilingan harakat odatga aylanadi'}
                           </span>
                        </li>
                        <li className="flex items-start gap-2">
                           <span className="text-indigo-500 dark:text-indigo-400 mt-0.5">•</span>
                           <span className="text-slate-600 dark:text-slate-400 text-sm">
                              {t('landing.footer.fact_2') || 'Pomodoro texnikasi samaradorlikni 40% oshiradi'}
                           </span>
                        </li>
                        <li className="flex items-start gap-2">
                           <span className="text-indigo-500 dark:text-indigo-400 mt-0.5">•</span>
                           <span className="text-slate-600 dark:text-slate-400 text-sm">
                              {t('landing.footer.fact_3') || 'Jamiyat bilan birga o\'sish 3x tezroq'}
                           </span>
                        </li>
                        <li className="flex items-start gap-2">
                           <span className="text-indigo-500 dark:text-indigo-400 mt-0.5">•</span>
                           <span className="text-slate-600 dark:text-slate-400 text-sm">
                              {t('landing.footer.fact_4') || 'Kunlik 10 daqiqa o\'sish 365 kun = 60 soat'}
                           </span>
                        </li>
                     </ul>
                  </div>
               </div>

               {/* Bottom Bar */}
               <div className="pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                     &copy; 2025 Hamroh AI. {t('landing.footer.all_rights') || 'Barcha huquqlar himoyalangan.'}
                  </p>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                     <span>{t('landing.footer.made_with') || 'Yaratilgan'}</span>
                     <Heart size={14} className="text-red-500 fill-red-500" />
                     <span>{t('landing.footer.in_uzbekistan') || 'O\'zbekistonda'}</span>
                  </div>
               </div>
            </div>
         </footer>

         {/* Mobile Menu */}
         {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 bg-white/95 dark:bg-[#050505]/95 backdrop-blur-3xl flex flex-col items-center justify-center gap-8 md:hidden animate-fade-in">
               <div className="text-2xl font-bold text-slate-900 dark:text-white">Hamroh AI</div>
               <div className="flex gap-4">
                  {['UZ', 'RU', 'EN'].map(l => (
                     <button key={l} onClick={() => setLanguage(l.toLowerCase() as any)} className="px-4 py-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-900 dark:text-white font-bold">{l}</button>
                  ))}
               </div>

               {/* Mobile Theme Toggle */}
               <button
                  onClick={toggleTheme}
                  className="p-3 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center gap-2"
               >
                  {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                  <span className="font-bold">{isDarkMode ? t('nav.light_mode') : t('nav.dark_mode')}</span>
               </button>

               <button onClick={() => setIsAuthOpen(true)} className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-xl">{t('landing.login')}</button>
               <button onClick={() => setMobileMenuOpen(false)} className="absolute bottom-10 p-4 bg-slate-100 dark:bg-white/10 rounded-full text-slate-900 dark:text-white"><X /></button>
            </div>
         )}

         <Auth
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onLoginSuccess={onLogin}
         />

      </div>
   );
};
