
import React, { useState } from 'react';
import { Check, Trash2, Plus, Edit2, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { RoutineTask } from '../../types';
import { logger } from '../../utils/logger';
import { SectionIntro } from './SectionIntro';

interface PlannerProps {
  onPlanCreated: () => void; // Callback to switch tab
}

export const Planner: React.FC<PlannerProps> = ({ onPlanCreated }) => {
  const { t } = useLanguage();
  const { notify } = useToast();

  const [generatedSchedule, setGeneratedSchedule] = useState<{ time: string, activity: string }[]>([]);

  const handleUpdatePlanItem = (index: number, field: 'time' | 'activity', value: string) => {
    const updated = [...generatedSchedule];
    updated[index] = { ...updated[index], [field]: field === 'time' ? normalizeTime(value) : value };
    setGeneratedSchedule(updated);
  };

  const handleDeletePlanItem = (index: number) => {
    setGeneratedSchedule(generatedSchedule.filter((_, i) => i !== index));
  };

  const handleAddManualStep = () => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    setGeneratedSchedule([...generatedSchedule, { time: currentTime, activity: '' }]);
  };

  // Helper function to normalize time format to HH:MM
  const normalizeTime = (time: string): string => {
    if (!time) return '09:00';

    // Remove any extra characters and normalize to HH:MM format
    let cleaned = time.trim();

    // Replace dots with colons
    cleaned = cleaned.replace(/\./g, ':');

    // Remove any non-digit characters except colons
    cleaned = cleaned.replace(/[^\d:]/g, '');

    // Try to parse as HH:MM
    const parts = cleaned.split(':');
    if (parts.length >= 2) {
      const hours = parts[0].padStart(2, '0').slice(0, 2);
      const minutes = parts[1].padStart(2, '0').slice(0, 2);

      // Validate hours (0-23) and minutes (0-59)
      const h = Math.min(23, Math.max(0, parseInt(hours) || 0));
      const m = Math.min(59, Math.max(0, parseInt(minutes) || 0));

      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // If format is not recognized, return default
    return '09:00';
  };

  const savePlanToRoutine = async () => {
    const validItems = generatedSchedule.filter(item => item.activity && item.activity.trim().length > 0);

    if (validItems.length === 0) {
      notify(t('intizom.planner.min_one_activity'), "error");
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const tasksToSave = validItems.map((item) => ({
      time: normalizeTime(item.time),
      title: item.activity,
      completed: false,
      date: dateStr
    }));

    try {
      // Save all tasks and get back the saved tasks with UUIDs
      const savedTasks = await Promise.all(
        tasksToSave.map(task => api.saveRoutineTask(task as RoutineTask))
      );
      setGeneratedSchedule([]);
      notify(t('intizom.planner.plan_saved'), "success");
      onPlanCreated();
    } catch (e: unknown) {
      logger.error("Save error:", e);
      const errorMessage = e instanceof Error ? e.message : t('intizom.planner.save_error');
      notify(errorMessage, "error");
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
      <SectionIntro sectionKey="plan" />
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 md:p-12 rounded-[2.5rem] shadow-xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl -z-0 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-400 opacity-20 rounded-full blur-3xl -z-0 -translate-x-1/2 translate-y-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
            <Edit2 className="text-blue-200" size={32} /> {t('intizom.planner.title')}
          </h2>
          <p className="text-blue-100/90 mb-6 font-medium text-lg max-w-2xl">
            {t('intizom.planner.desc')}
          </p>
        </div>
      </div>

      {generatedSchedule.length === 0 && (
        <div className="flex justify-center animate-fade-in">
          <button
            onClick={() => {
              const now = new Date();
              const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
              setGeneratedSchedule([{ time: normalizeTime(currentTime), activity: '' }]);
            }}
            className="group relative px-8 py-4 bg-white/70 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 font-bold text-lg rounded-2xl flex items-center gap-3 transition-all border border-white/60 dark:border-white/10 shadow-lg hover:shadow-xl active:scale-95 backdrop-blur-md"
          >
            <Edit2 size={24} className="opacity-80 group-hover:opacity-100 text-indigo-600 dark:text-violet-400" />
            <span>{t('intizom.planner.manual_btn')}</span>
          </button>
        </div>
      )}

      {(generatedSchedule.length > 0) && (
        <div className="bg-white/70 dark:bg-white/5 shadow-sm border border-white/60 dark:border-white/20 p-8 rounded-[2rem] space-y-6 animate-fade-in-up backdrop-blur-md">
          <div className="flex justify-between items-center mb-2"><h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2"><Check className="text-green-500" /> {t('intizom.planner.confirm_title')}</h3></div>
          <div className="space-y-3">
            {generatedSchedule.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/10 transition-all hover:border-indigo-300 dark:hover:border-indigo-500/30">
                <div className="relative">
                  <input
                    type="time"
                    value={item.time}
                    onChange={(e) => handleUpdatePlanItem(idx, 'time', e.target.value)}
                    step="60"
                    lang="en-GB"
                    className="w-[90px] sm:w-32 px-3 py-3 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-center"
                  />
                </div>

                <input
                  type="text"
                  value={item.activity}
                  onChange={(e) => handleUpdatePlanItem(idx, 'activity', e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none font-medium p-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 min-w-0"
                  placeholder={t('intizom.planner.activity_placeholder')}
                />

                <button
                  onClick={() => handleDeletePlanItem(idx)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button onClick={handleAddManualStep} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center gap-2"><Plus size={20} /> {t('intizom.planner.manual_step')}</button>
          </div>
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-white/10">
            <button onClick={() => setGeneratedSchedule([])} className="px-6 py-3 text-slate-500 font-bold">{t('common.clear')}</button>
            <button onClick={savePlanToRoutine} className="px-8 py-3 bg-indigo-600 text-white rounded-xl shadow-lg font-bold flex items-center gap-2"><Save size={18} /> {t('common.save')}</button>
          </div>
        </div>
      )}
    </div>
  );
};
