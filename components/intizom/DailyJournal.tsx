import React, { useState, useEffect } from 'react';
import { Send, Calendar as CalendarIcon, Book as BookIcon } from 'lucide-react';
import { api } from '../../services/api';
import { JournalEntry } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../utils/logger';
import { SectionIntro } from './SectionIntro';

export const DailyJournal: React.FC = () => {
  const { t, language } = useLanguage();
  const { notify } = useToast();
  const [journalInput, setJournalInput] = useState('');

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);


  useEffect(() => {
    api.getJournalEntries().then(setJournalEntries);
  }, [language]);



  const dailyPrompt = t('intizom.journal.daily_prompt');

  const handleSaveJournal = async () => {
    if (!journalInput.trim()) return;

    try {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        text: journalInput,
        mood: 'neutral', // Default mood since no AI analysis
        timestamp: Date.now()
      };

      await api.saveJournalEntry(newEntry);
      setJournalEntries([newEntry, ...journalEntries]);
      setJournalInput('');
      notify(t('common.saved'), "success");
    } catch (e: unknown) {
      logger.error("Save journal entry error:", e);
      notify(t('common.error'), "error");
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <SectionIntro sectionKey="journal" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/70 dark:bg-white/5 border border-indigo-100 dark:border-blue-500/10 p-8 rounded-[2rem] shadow-sm relative overflow-hidden backdrop-blur-md">
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 dark:bg-blue-500/10 rounded-bl-[4rem] -z-10"></div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">{t('intizom.journal.today_question')}</h3>
            <p className="text-xl font-medium text-slate-800 dark:text-slate-100 italic">"{dailyPrompt}"</p>
          </div>
          <div className="bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/20 p-6 rounded-[2rem] shadow-sm backdrop-blur-md">
            <textarea
              value={journalInput}
              onChange={(e) => setJournalInput(e.target.value)}
              placeholder={t('intizom.journal.placeholder')}
              className="w-full h-40 bg-transparent border-none outline-none resize-none placeholder-slate-400/50 text-lg font-medium text-slate-900 dark:text-white"
            />
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
              <span className="text-xs text-slate-400 font-medium"></span>
              <button
                onClick={handleSaveJournal}
                disabled={!journalInput}
                className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                <Send size={18} strokeWidth={2.5} /> {t('common.save')}
              </button>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 pl-2">{t('intizom.journal.history')}</h3>
          {journalEntries.length === 0 ? (
            <p className="text-sm text-slate-400 italic pl-2">{t('common.no_data')}</p>
          ) : (
            journalEntries.map(entry => (
              <div key={entry.id} className="bg-white/70 dark:bg-white/5 p-5 rounded-2xl border border-white/60 dark:border-white/10 hover:shadow-md transition-all backdrop-blur-md">
                <div className="flex justify-between items-start mb-2">
                  <span className="text--[10px] font-bold uppercase text-slate-400">{new Date(entry.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-3 mb-3">{entry.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
