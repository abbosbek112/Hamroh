
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight as ChevronRightIcon, Check, X as XIcon, Edit2, Trash2, Plus, Copy, Trash, Loader2 } from 'lucide-react';
import { StreakFlame } from '../StreakFlame';
import { api } from '../../services/api';
import { RoutineTask } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { logger } from '../../utils/logger';
import { SectionIntro } from './SectionIntro';

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

export const RoutineList: React.FC = () => {
  const { t } = useLanguage();
  const { notify } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>([]);
  const [streak, setStreak] = useState(0); // Fetch real streak later
  const [loadingRoutine, setLoadingRoutine] = useState(false);
  const [isAddingRoutine, setIsAddingRoutine] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [addRoutineForm, setAddRoutineForm] = useState({ title: '', time: '09:00' });

  // Get time-based empty state message
  const getEmptyStateMessage = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return t('intizom.daily.empty_states.morning');
    } else if (hour >= 12 && hour < 18) {
      return t('intizom.daily.empty_states.afternoon');
    } else if (hour >= 18 && hour < 22) {
      return t('intizom.daily.empty_states.evening');
    } else {
      return t('intizom.daily.empty_states.night');
    }
  };
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', time: '' });

  // ... (rest of the code omitted for brevity in thought process, but included in tool call)
  // Wait, I can't emit "rest of code omitted". I should target specific blocks.
  // I will use multiple replace_file_content calls or multi_replace.
  // multi_replace is better.

  useEffect(() => {
    setLoadingRoutine(true);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Initial fetch
    const fetchTasks = () => {
      api.getRoutine(dateStr).then(tasks => {
        const normalizedTasks = tasks.map(task => ({
          ...task,
          time: normalizeTime(task.time)
        }));
        const sorted = normalizedTasks.sort((a, b) => a.time.localeCompare(b.time));
        setRoutineTasks(sorted);
        setLoadingRoutine(false);
      });
    };

    fetchTasks();
    api.getSession().then(u => u && setStreak(u.streak));

    // Real-time subscription
    let cleanupSubscription: (() => void) | undefined;

    api.getSession().then(user => {
      if (user) {
        cleanupSubscription = api.subscribeToRoutines(user.id, (event) => {
          if (event.payload.new || event.payload.old) {
            // Refresh tasks on any change
            fetchTasks();
          }
        });
      }
    });

    return () => {
      if (cleanupSubscription) cleanupSubscription();
    };
  }, [currentDate]);

  const dailyProgress = routineTasks.length > 0
    ? Math.round((routineTasks.filter(t => t.completed).length / routineTasks.length) * 100)
    : 0;

  const handleToggleRoutineTask = async (taskId: string, time: string, date: string) => {
    if (editingTaskId === taskId) return;
    const task = routineTasks.find(t => t.id === taskId);
    if (!task) return;

    if (!task.completed) {
      const now = new Date();
      const taskDateTime = new Date(`${date}T${time}:00`);
      const bufferTime = new Date(taskDateTime.getTime() - 15 * 60000);
      if (now < bufferTime) {
        if (!window.confirm(t('intizom.daily.future_alert'))) {
          return;
        }
      }
    }

    const updated = routineTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setRoutineTasks(updated);
    await api.toggleRoutineTask(taskId);
    if (!task.completed) notify(t('intizom.daily.task_completed'), "success");
  };

  const handleDeleteRoutineTask = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setRoutineTasks(prev => prev.filter(t => t.id !== id));
    await api.deleteRoutineTask(id);
    notify(t('intizom.daily.task_deleted'), "info");
  };

  const handleDeleteAllTasks = async () => {
    if (routineTasks.length === 0) {
      notify(t('intizom.tasks.empty'), "info");
      return;
    }

    const confirmed = window.confirm(
      t('intizom.daily.delete_all_confirm', { count: routineTasks.length })
    );

    if (!confirmed) {
      return;
    }

    try {
      // Delete all tasks
      await Promise.all(
        routineTasks.map(task => api.deleteRoutineTask(task.id))
      );

      setRoutineTasks([]);
      notify(t('intizom.daily.delete_all_success'), "success");
    } catch (error: unknown) {
      logger.error('Delete all tasks error:', error);
      const errorMessage = error instanceof Error ? error.message : t('intizom.daily.delete_error');
      notify(errorMessage, "error");
    }
  };

  const handleEditRoutine = (e: React.MouseEvent, task: RoutineTask) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTaskId(task.id);
    setEditForm({ title: task.title, time: task.time });
  };

  const handleSaveNewRoutine = async () => {
    if (!addRoutineForm.title || !addRoutineForm.time) {
      notify(t('intizom.daily.fill_all_fields'), "error");
      return;
    }
    try {
      const newTask: Omit<RoutineTask, 'id'> & { id?: string } = {
        title: addRoutineForm.title,
        time: addRoutineForm.time,
        completed: false,
        date: currentDate.toISOString().split('T')[0]
      };
      // Save to database and get the UUID from database
      const savedTask = await api.saveRoutineTask(newTask as RoutineTask);
      // Update state with the saved task that has proper UUID
      const newTasks = [...routineTasks, savedTask].sort((a, b) => a.time.localeCompare(b.time));
      setRoutineTasks(newTasks);
      setAddRoutineForm({ title: '', time: '09:00' });
      setIsAddingRoutine(false);
      notify(t('intizom.daily.task_added'), "success");
    } catch (error: unknown) {
      logger.error('Save routine error:', error);
      const errorMessage = error instanceof Error ? error.message : t('intizom.daily.add_error');
      notify(errorMessage, "error");
    }
  };

  const handleSaveEditedRoutine = async () => {
    if (!editingTaskId) {
      logger.error('No editing task ID');
      notify(t('intizom.daily.edit_mode_not_found'), "error");
      return;
    }

    if (!editForm.title || !editForm.title.trim()) {
      notify(t('intizom.daily.task_name_required'), "error");
      return;
    }

    if (!editForm.time || !editForm.time.trim()) {
      notify(t('intizom.daily.time_required'), "error");
      return;
    }

    if (isSavingEdit) {
      return;
    }

    try {
      setIsSavingEdit(true);
      // Normalize time before saving
      const normalizedTime = normalizeTime(editForm.time);
      const normalizedForm = {
        title: editForm.title.trim(),
        time: normalizedTime
      };

      // Find the original task to preserve other properties
      const originalTask = routineTasks.find(t => t.id === editingTaskId);
      if (!originalTask) {
        logger.error('Original task not found:', editingTaskId);
        notify(t('intizom.daily.task_not_found'), "error");
        setEditingTaskId(null);
        return;
      }

      // Create updated task with all original properties
      const updatedTask: RoutineTask = {
        ...originalTask,
        title: normalizedForm.title,
        time: normalizedForm.time
      };

      // Update in database first
      await api.updateRoutineTask(updatedTask);

      // Then update local state
      const updatedTasks = routineTasks.map(t =>
        t.id === editingTaskId ? updatedTask : t
      ).sort((a, b) => a.time.localeCompare(b.time));

      setRoutineTasks(updatedTasks);
      setEditingTaskId(null);
      setEditForm({ title: '', time: '' });
      notify(t('intizom.daily.task_updated'), "success");
    } catch (error: unknown) {
      logger.error('Save edited routine error:', error);
      const errorMessage = error instanceof Error ? error.message : t('intizom.daily.update_error');
      if (errorMessage.toLowerCase().includes('unauthorized')) {
        notify(t('intizom.daily.session_expired'), "error");
      } else {
        notify(errorMessage, "error");
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCopyPreviousDay = async () => {
    // Prevent multiple clicks
    if (isCopying || routineTasks.length > 0) {
      return;
    }

    try {
      setIsCopying(true);

      // Check if today already has tasks - prevent duplicate copying
      const currentDateStr = currentDate.toISOString().split('T')[0];
      const todayTasks = await api.getRoutine(currentDateStr);

      if (todayTasks.length > 0) {
        // Update state if tasks already exist
        const normalizedTasks = todayTasks.map(task => ({
          ...task,
          time: normalizeTime(task.time)
        }));
        const sorted = normalizedTasks.sort((a, b) => a.time.localeCompare(b.time));
        setRoutineTasks(sorted);
        notify(t('intizom.daily.alert_copy_exists'), "info");
        return;
      }

      // Get yesterday's date
      const yesterday = new Date(currentDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Get yesterday's tasks
      const yesterdayTasks = await api.getRoutine(yesterdayStr);

      if (yesterdayTasks.length === 0) {
        notify(t('intizom.daily.alert_copy_no_data'), "info");
        return;
      }

      // Copy tasks to today (reset completed status)
      const tasksToCopy = yesterdayTasks.map(task => ({
        title: task.title,
        time: normalizeTime(task.time),
        completed: false,
        date: currentDateStr
      }));

      // Save all tasks
      const savedTasks = await Promise.all(
        tasksToCopy.map(task => api.saveRoutineTask(task as RoutineTask))
      );

      // Update state
      const normalizedTasks = savedTasks.map(task => ({
        ...task,
        time: normalizeTime(task.time)
      }));
      const sorted = normalizedTasks.sort((a, b) => a.time.localeCompare(b.time));
      setRoutineTasks(sorted);

      notify(t('intizom.daily.alert_copy_success', { count: savedTasks.length }), "success");
    } catch (error: unknown) {
      logger.error('Copy previous day error:', error);
      const errorMessage = error instanceof Error ? error.message : t('intizom.daily.copy_error');
      notify(errorMessage, "error");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <SectionIntro sectionKey="daily" />
      {/* Daily Header & Progress */}
      <div className="flex flex-col gap-4 sm:gap-6 mb-8">
        <div className="flex justify-between items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex-1 sm:flex-none flex items-center justify-between sm:justify-start gap-2 bg-gradient-to-r from-white/90 via-white/80 to-violet-50/30 dark:from-white/5 dark:via-white/5 dark:to-violet-950/20 px-3 sm:px-5 py-2 sm:py-3 rounded-2xl border border-white/60 dark:border-white/10 shadow-lg hover:shadow-xl transition-all backdrop-blur-xl group">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))}
              className="p-2 hover:bg-violet-100/50 dark:hover:bg-violet-500/20 rounded-xl transition-all group-hover:scale-110"
            >
              <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
            <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white min-w-[120px] sm:min-w-[140px] text-center px-2 sm:px-4">
              {currentDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
                ? <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">{t('common.today')}</span>
                : currentDate.toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric', month: 'short' })
              }
            </span>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))}
              className="p-2 hover:bg-violet-100/50 dark:hover:bg-violet-500/20 rounded-xl transition-all group-hover:scale-110"
            >
              <ChevronRightIcon size={20} className="text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          <div className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-3 sm:gap-4 bg-gradient-to-r from-white/90 via-white/80 to-orange-50/30 dark:from-white/5 dark:via-white/5 dark:to-orange-950/20 px-4 sm:px-5 py-2 sm:py-3 rounded-2xl border border-white/60 dark:border-white/10 shadow-lg hover:shadow-xl transition-all backdrop-blur-xl group">
            <StreakFlame streak={streak} size={28} />
            <div className="flex flex-col items-start">
              <span className="font-black text-2xl text-slate-900 dark:text-white leading-none bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{streak}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                {streak < 3 ? 'Spark' : streak < 7 ? 'Flame' : streak < 15 ? 'Blaze' : 'Legend'}
              </span>
            </div>
          </div>
        </div>

        {routineTasks.length > 0 && (
          <div className="bg-gradient-to-br from-white/90 via-white/80 to-violet-50/30 dark:from-white/5 dark:via-white/5 dark:to-violet-950/20 p-5 rounded-2xl border border-white/60 dark:border-white/10 shadow-xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-indigo-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3">
                <div className="flex justify-between items-center flex-1">
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">{t('intizom.daily.progress')}</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">{dailyProgress}%</span>
                </div>
                <button
                  onClick={handleDeleteAllTasks}
                  className="ml-4 p-2.5 text-red-500 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 rounded-xl transition-all flex items-center gap-2 shadow-sm hover:shadow-lg transform hover:scale-105"
                  title={t('intizom.daily.clear_all_title')}
                >
                  <Trash size={16} />
                  <span className="text-xs font-semibold hidden sm:inline">{t('common.clear')}</span>
                </button>
              </div>
              <div className="w-full bg-slate-200/80 dark:bg-white/10 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 transition-all duration-1000 ease-out shadow-lg relative overflow-hidden"
                  style={{ width: `${dailyProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="relative space-y-5">
        {/* Vertical timeline line - only show when there are tasks */}
        {routineTasks.length > 0 && (
          <div className="absolute left-[64px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-300 via-indigo-300 to-blue-300 dark:from-violet-500/30 dark:via-indigo-500/30 dark:to-blue-500/30 z-0"></div>
        )}

        {routineTasks.map((task, index) => {
          const isEditing = editingTaskId === task.id;
          return (
            <div
              key={task.id}
              className={`relative z-10 group transition-all duration-300 animate-fade-in ${task.completed && !isEditing ? 'opacity-70' : 'opacity-100'}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`p-4 sm:p-6 rounded-2xl border bg-gradient-to-br from-white/90 via-white/85 to-slate-50/50 dark:from-white/5 dark:via-white/5 dark:to-slate-900/20 border-white/60 dark:border-white/10 hover:shadow-xl hover:shadow-violet-500/10 transition-all backdrop-blur-xl relative overflow-hidden ${!isEditing ? 'cursor-pointer flex items-center gap-3 sm:gap-4 hover:-translate-y-1 hover:scale-[1.02]' : 'flex flex-col sm:flex-row items-center gap-3'}`}
                onClick={() => !isEditing && handleToggleRoutineTask(task.id, task.time, task.date)}
              >
                {/* Gradient overlay on hover (must not block inputs) */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-violet-500/0 via-indigo-500/0 to-blue-500/0 group-hover:from-violet-500/5 group-hover:via-indigo-500/5 group-hover:to-blue-500/5 transition-all duration-300"></div>

                {/* Time and Dot - LEFT SIDE */}
                <div className="flex items-center gap-3 flex-shrink-0 relative z-10">
                  <div className={`text-sm font-black w-[52px] text-right ${task.completed ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {isEditing ? '' : normalizeTime(task.time)}
                  </div>
                  <div className={`relative w-3 h-3 rounded-full ring-4 ring-white dark:ring-[#0a0a0c] transition-all z-10 shadow-lg ${task.completed
                    ? 'bg-gradient-to-br from-green-400 to-green-600'
                    : 'bg-gradient-to-br from-indigo-500 to-violet-600'
                    } group-hover:scale-125`}></div>
                </div>

                {isEditing ? (
                  <>
                    <input
                      type="time"
                      value={editForm.time}
                      onChange={(e) => setEditForm({ ...editForm, time: normalizeTime(e.target.value) })}
                      lang="en-GB"
                      step="60"
                      className="w-full sm:w-28 p-2 bg-slate-100 dark:bg-black/20 rounded-lg border border-slate-200 dark:border-white/10 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="flex-1 p-2 bg-slate-100 dark:bg-black/20 rounded-lg border border-slate-200 dark:border-white/10 font-medium outline-none focus:ring-2 focus:ring-violet-500"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSaveEditedRoutine();
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingTaskId(null);
                          setEditForm({ title: '', time: '' });
                        }
                      }}
                    />
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSaveEditedRoutine();
                        }}
                        className={`p-2 bg-green-500 text-white rounded-lg transition-all ${isSavingEdit ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-600'
                          }`}
                        type="button"
                        disabled={isSavingEdit}
                      >
                        {isSavingEdit ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingTaskId(null);
                          setEditForm({ title: '', time: '' });
                        }}
                        className="p-2 bg-slate-200 dark:bg-white/10 text-slate-500 rounded-lg hover:bg-slate-300 transition-all"
                        type="button"
                      >
                        <XIcon size={18} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-1 relative z-10">
                      <h3 className={`font-bold text-lg leading-tight ${task.completed ? 'text-green-700 dark:text-green-400 line-through opacity-75' : 'text-slate-900 dark:text-white'}`}>{task.title}</h3>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 relative z-10">
                      <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-20" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => handleEditRoutine(e, task)} aria-label={t('common.edit')} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-xl transition-all transform hover:scale-110"><Edit2 size={18} /></button>
                        <button onClick={(e) => handleDeleteRoutineTask(e, task.id)} aria-label={t('common.delete')} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-xl transition-all transform hover:scale-110"><Trash2 size={18} /></button>
                      </div>
                      {task.completed ? (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg ring-2 ring-green-200 dark:ring-green-500/30">
                          <Check className="text-white" size={20} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full border-2.5 border-slate-300 dark:border-slate-600 group-hover:border-indigo-500 dark:group-hover:border-indigo-400 transition-all bg-white dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10"></div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {routineTasks.length === 0 && !loadingRoutine && !isAddingRoutine && (
          <div className="text-center py-16 px-6 text-slate-500 dark:text-slate-400 font-medium bg-gradient-to-br from-white/70 via-white/60 to-violet-50/30 dark:from-white/5 dark:via-white/5 dark:to-violet-950/20 rounded-2xl border border-white/60 dark:border-white/10 backdrop-blur-xl shadow-lg">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-lg font-semibold">{getEmptyStateMessage()}</p>
            <p className="text-sm mt-2 text-slate-400 dark:text-slate-500">{t('intizom.daily.empty_subtitle')}</p>
          </div>
        )}

        <div className="pl-0 sm:pl-14 pt-2">
          {/* Copy Previous Day Button - Show only when there are no tasks */}
          {!isAddingRoutine && routineTasks.length === 0 && !isCopying && (
            <div className="mb-4">
              <button
                onClick={handleCopyPreviousDay}
                disabled={isCopying}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:via-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <Copy size={20} />
                {t('intizom.daily.copy_prev')}
              </button>
            </div>
          )}
          {isCopying && (
            <div className="mb-4 w-full py-4 bg-gradient-to-r from-indigo-500/70 via-violet-500/70 to-purple-500/70 text-white font-bold rounded-xl flex items-center justify-center gap-3 shadow-lg">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{t('intizom.daily.copying')}</span>
            </div>
          )}
          {isAddingRoutine ? (
            <div className="p-6 rounded-2xl border-2 bg-gradient-to-br from-white/90 via-white/80 to-violet-50/30 dark:from-white/5 dark:via-white/5 dark:to-violet-950/20 border-violet-300 dark:border-violet-500/30 shadow-xl animate-fade-in backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row gap-3 w-full items-center">
                <input
                  type="time"
                  value={addRoutineForm.time}
                  onChange={(e) => setAddRoutineForm({ ...addRoutineForm, time: normalizeTime(e.target.value) })}
                  lang="en-GB"
                  step="60"
                  className="w-full sm:w-28 p-3 bg-slate-100 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-sm outline-none focus:ring-2 focus:ring-violet-500"
                />
                <input
                  type="text"
                  value={addRoutineForm.title}
                  onChange={(e) => setAddRoutineForm({ ...addRoutineForm, title: e.target.value })}
                  placeholder={t('intizom.tasks.name_placeholder')}
                  className="flex-1 p-3 bg-slate-100 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/10 font-medium outline-none focus:ring-2 focus:ring-violet-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNewRoutine()}
                />
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button onClick={handleSaveNewRoutine} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">{t('common.add')}</button>
                  <button onClick={() => setIsAddingRoutine(false)} className="px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300">{t('common.cancel')}</button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingRoutine(true)}
              className="w-full py-4 border-2 border-dashed border-indigo-300 dark:border-indigo-500/30 rounded-2xl text-indigo-600 dark:text-indigo-400 font-bold hover:bg-gradient-to-r hover:from-indigo-50 hover:to-violet-50 dark:hover:from-indigo-500/10 dark:hover:to-violet-500/10 hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-400 dark:hover:border-indigo-400 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={22} strokeWidth={2.5} />
              {t('intizom.daily.add_task')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
