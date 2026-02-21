
import React, { useState, useEffect } from 'react';
import { ListTodo, Plus, X, Check, Save, Edit2, Trash2, Clock } from 'lucide-react';
import { api } from '../../services/api';
import { Todo } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';

type TaskDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export const TodoList: React.FC = () => {
  const { t } = useLanguage();
  const { notify } = useToast();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isTaskFormExpanded, setIsTaskFormExpanded] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState<{
    title: string;
    description: string;
    difficulty: TaskDifficulty;
    deadline: string;
  }>({ title: '', description: '', difficulty: 'EASY', deadline: '' });

  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editTodoForm, setEditTodoForm] = useState<{
    title: string;
    description: string;
    difficulty: TaskDifficulty;
    deadline: string;
  } | null>(null);

  useEffect(() => {
    api.getTodos().then(setTodos);
  }, []);

  const handleAddTask = async () => {
    if (!newTaskForm.title.trim()) {
      notify(t('intizom.daily.task_name_required'), "error");
      return;
    }
    const taskToAdd = {
      title: newTaskForm.title,
      description: newTaskForm.description,
      difficulty: newTaskForm.difficulty,
      deadline: newTaskForm.deadline
    };
    const added = await api.saveTodo(taskToAdd);
    setTodos([added, ...todos]);
    setNewTaskForm({ title: '', description: '', difficulty: 'EASY', deadline: '' });
    setIsTaskFormExpanded(false);
    notify(t('intizom.tasks.task_added'), "success");
  };

  const handleToggleTodo = async (id: string) => {
    if (editingTodoId === id) return;
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updated);
    await api.toggleTodo(id);
    if (!todo.completed) notify(t('intizom.tasks.task_completed'), "success");
  };

  const handleDeleteTask = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setTodos(prev => prev.filter(t => t.id !== id));
    await api.deleteTodo(id);
    notify(t('intizom.tasks.task_deleted'), "info");
  };

  const handleEditTodo = (e: React.MouseEvent, todo: Todo) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingTodoId(todo.id);
    setEditTodoForm({
      title: todo.title,
      description: todo.description,
      difficulty: todo.difficulty,
      deadline: todo.deadline
    });
  };

  const handleSaveEditedTodo = async () => {
    if (!editingTodoId || !editTodoForm) return;
    const updatedTodos = todos.map(t => t.id === editingTodoId ? { ...t, ...editTodoForm } : t);
    setTodos(updatedTodos);
    const updatedTodo = updatedTodos.find(t => t.id === editingTodoId);
    if (updatedTodo) await api.updateTodo(updatedTodo);
    setEditingTodoId(null);
    setEditTodoForm(null);
    notify(t('intizom.tasks.task_updated'), "success");
  };

  const getDifficultyColor = (d: TaskDifficulty) => {
    switch (d) {
      case 'EASY': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300';
      case 'MEDIUM': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300';
      case 'HARD': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
    }
  };

  const getDifficultyLabel = (d: TaskDifficulty) => {
    switch (d) {
      case 'EASY': return t('intizom.tasks.diff_easy');
      case 'MEDIUM': return t('intizom.tasks.diff_medium');
      case 'HARD': return t('intizom.tasks.diff_hard');
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
      <div className={`bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-[2rem] p-6 shadow-sm transition-all duration-300 overflow-hidden backdrop-blur-md ${isTaskFormExpanded ? 'ring-2 ring-indigo-500/20' : ''}`}>
        {!isTaskFormExpanded ? (
          <div className="flex gap-4 items-center cursor-pointer" onClick={() => setIsTaskFormExpanded(true)}>
            <div className="w-12 h-12 bg-slate-100 dark:bg-white/10 rounded-xl flex items-center justify-center text-slate-400">
              <Plus size={24} />
            </div>
            <span className="text-slate-500 font-medium text-lg">{t('intizom.tasks.new_task')}</span>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t('intizom.tasks.create_title')}</h3>
              <button onClick={() => setIsTaskFormExpanded(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input type="text" value={newTaskForm.title} onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })} placeholder={t('intizom.tasks.name_placeholder')} className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl font-medium outline-none focus:ring-2 focus:ring-violet-500" />
              <textarea value={newTaskForm.description} onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })} placeholder={t('intizom.tasks.desc_placeholder')} className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl font-medium outline-none focus:ring-2 focus:ring-violet-500 h-24 resize-none" />
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('intizom.tasks.difficulty')}</label>
                  <div className="flex gap-2">
                    {(['EASY', 'MEDIUM', 'HARD'] as TaskDifficulty[]).map((diff) => (
                      <button key={diff} onClick={() => setNewTaskForm({ ...newTaskForm, difficulty: diff })} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${newTaskForm.difficulty === diff ? (diff === 'HARD' ? 'bg-red-500 text-white border-red-500' : diff === 'MEDIUM' ? 'bg-orange-500 text-white border-orange-500' : 'bg-green-500 text-white border-green-500') : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/10'}`}>{getDifficultyLabel(diff)}</button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('intizom.tasks.deadline')}</label>
                  <input type="datetime-local" value={newTaskForm.deadline} onChange={(e) => setNewTaskForm({ ...newTaskForm, deadline: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl font-medium outline-none text-sm text-slate-800 dark:text-white" />
                </div>
              </div>
            </div>
            <button onClick={handleAddTask} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2"><Plus size={20} /> {t('common.add')}</button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {todos.map(todo => {
          const isEditing = editingTodoId === todo.id;
          return (
            <div key={todo.id} onClick={() => handleToggleTodo(todo.id)} className={`group relative p-6 rounded-2xl border cursor-pointer transition-all duration-300 shadow-sm backdrop-blur-md ${todo.completed && !isEditing ? 'bg-slate-50/50 dark:bg-white/5 border-transparent opacity-60' : 'bg-white/70 dark:bg-white/5 border-white/60 dark:border-white/20 hover:bg-white dark:hover:bg-white/10 hover:shadow-md'}`}>
              {isEditing && editTodoForm ? (
                <div className="space-y-4 cursor-default" onClick={e => e.stopPropagation()}>
                  <input type="text" value={editTodoForm.title} onChange={(e) => setEditTodoForm({ ...editTodoForm, title: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-lg outline-none focus:ring-2 focus:ring-violet-500" autoFocus />
                  <textarea value={editTodoForm.description} onChange={(e) => setEditTodoForm({ ...editTodoForm, description: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 h-20 resize-none" />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex gap-2">
                      {(['EASY', 'MEDIUM', 'HARD'] as TaskDifficulty[]).map((diff) => (
                        <button key={diff} onClick={() => setEditTodoForm({ ...editTodoForm, difficulty: diff })} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${editTodoForm.difficulty === diff ? (diff === 'HARD' ? 'bg-red-500 text-white border-red-500' : diff === 'MEDIUM' ? 'bg-orange-500 text-white border-orange-500' : 'bg-green-500 text-white border-green-500') : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/10'}`}>{getDifficultyLabel(diff)}</button>
                      ))}
                    </div>
                    <input type="datetime-local" value={editTodoForm.deadline} onChange={(e) => setEditTodoForm({ ...editTodoForm, deadline: e.target.value })} className="px-3 py-1.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold outline-none" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setEditingTodoId(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-xs">{t('common.cancel')}</button>
                    <button onClick={handleSaveEditedTodo} className="px-3 py-1.5 bg-green-500 text-white rounded-lg font-bold text-xs flex items-center gap-1"><Save size={14} /> {t('common.save')}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col">
                      <span className={`text-lg font-bold ${todo.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{todo.title}</span>
                      {todo.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{todo.description}</p>}
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${todo.completed ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 dark:border-slate-600 group-hover:border-violet-500'}`}>{todo.completed && <Check size={14} strokeWidth={4} />}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border border-transparent ${getDifficultyColor(todo.difficulty)}`}>{getDifficultyLabel(todo.difficulty)}</span>
                    {todo.deadline && (
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 border ${new Date(todo.deadline) < new Date() && !todo.completed ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-500/20' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10'}`}><Clock size={12} />{new Date(todo.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>

                  <div className="absolute bottom-4 right-4 flex gap-2 z-20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => handleEditTodo(e, todo)} className="p-2 text-slate-400 hover:text-blue-500 bg-white dark:bg-white/10 rounded-full shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-transparent"><Edit2 size={16} /></button>
                    <button onClick={(e) => handleDeleteTask(e, todo.id)} className="p-2 text-slate-400 hover:text-red-500 bg-white dark:bg-white/10 rounded-full shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-transparent"><Trash2 size={16} /></button>
                  </div>
                </>
              )}
            </div>
          )
        })}
        {todos.length === 0 && (
          <div className="text-center py-12 text-slate-400 font-medium flex flex-col items-center gap-4 bg-white/70 dark:bg-white/5 rounded-3xl border border-white/60 dark:border-white/10 backdrop-blur-md">
            <ListTodo size={48} className="opacity-20" />
            {t('intizom.tasks.empty')}
          </div>
        )}
      </div>
    </div>
  );
};
