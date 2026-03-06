import React, { useState, useEffect, useRef } from 'react';
import { AppView, ParentStudentLink, User } from '../types';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { logger } from '../utils/logger';
import {
    Users, Search, UserPlus, CheckCircle2, AlertCircle, Loader2, ListTodo, Flame,
    Clock, Calendar, Sparkles, ChevronDown, Check, X, BarChart3, Shield, ArrowLeft, Star
} from 'lucide-react';

// --- Parent Control Helpers ---
const StatCard = ({ icon: Icon, label, value, sub, color, gradient }: any) => (
    <div className="relative p-6 bg-white dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
        <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity -mr-10 -mt-10 pointer-events-none`}></div>
        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className={color.replace('bg-', 'text-')} />
                </div>
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</div>
            </div>
            <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2">
                    {value}
                </div>
                <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Sparkles size={12} className={color.replace('bg-', 'text-').replace('500', '400')} /> {sub}
                </div>
            </div>
        </div>
    </div>
);

const ProgressBar = ({ value, max, color, label, onReadClick }: any) => {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">{label}</span>
                    <span className={`text-[11px] font-bold py-1 px-2.5 ${color.replace('bg-', 'bg-').replace('500', '50 dark:bg-opacity-10')} ${color.replace('bg-', 'text-')} rounded-xl`}>
                        {value}/{max}
                    </span>
                </div>
                <button
                    onClick={onReadClick}
                    className={`text-[10px] font-black ${color.replace('bg-', 'text-')} uppercase tracking-widest hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}
                >
                    Batafsil
                </button>
            </div>
            <div className="h-4 w-full bg-slate-200 dark:bg-black/40 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full ${color} transition-all duration-1000 ease-out relative`} style={{ width: `${pct}%` }}>
                    <div className="absolute inset-0 bg-white/20 dark:bg-white/10 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
                </div>
            </div>
        </div>
    );
};

const ChildDetailModal = ({ title, items, type, onClose }: {
    title: string;
    items: any[];
    type: 'todo' | 'routine';
    onClose: () => void;
}) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#1a1a1e] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    {type === 'todo' ? <ListTodo className="text-indigo-500" /> : <CheckCircle2 className="text-violet-500" />}
                    {title}
                </h3>
                <button onClick={onClose} aria-label="Yopish" className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
                {items.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-medium">Ma'lumot topilmadi</div>
                ) : items.map((item, i) => (
                    <div key={i} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.completed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}>
                            <Check size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={`text-sm font-bold truncate ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>
                                {type === 'todo' ? item.text : item.title}
                            </div>
                            {type === 'todo' && item.category && (
                                <div className="text-[10px] font-black uppercase text-indigo-500/70">{item.category}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const ParentControlComponent = ({ linkedStudents, onLinkChild, loading }: {
    linkedStudents: ParentStudentLink[];
    onLinkChild: (code: string) => Promise<boolean>;
    loading: boolean;
}) => {
    const [selectedChild, setSelectedChild] = useState<string | null>(linkedStudents[0]?.studentId || null);
    const [childData, setChildData] = useState<any>(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [linkCode, setLinkCode] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(linkedStudents.length === 0);
    const [activeModal, setActiveModal] = useState<'todo' | 'routine' | null>(null);

    useEffect(() => {
        if (selectedChild) {
            loadChildData(selectedChild);
        } else {
            setChildData(null);
        }
    }, [selectedChild]);

    // If there are no linked students, always show link input
    useEffect(() => {
        if (linkedStudents.length === 0) {
            setShowLinkInput(true);
            setSelectedChild(null);
        } else if (!selectedChild) {
            // Auto-select first child when populated
            setSelectedChild(linkedStudents[0].studentId);
            setShowLinkInput(false);
        }
    }, [linkedStudents, selectedChild]);

    const loadChildData = async (studentId: string) => {
        setDataLoading(true);
        try {
            const data = await api.getStudentDataForParent(studentId);
            setChildData(data || { todos: [], routines: [], tasks: [], user: null });
        } catch (e) {
            logger.error('Error loading child data', e);
        } finally {
            setDataLoading(false);
        }
    };

    const { notify } = useToast();
    const handleLink = async () => {
        if (!linkCode.trim()) return;
        const success = await onLinkChild(linkCode.trim());
        if (success) {
            setLinkCode('');
            setShowLinkInput(false);
        } else {
            notify("Ulanishda xatolik. Kodni tekshiring.", "error");
        }
    };

    if (loading) return <div className="text-center py-8"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div>;

    const todosTotal = childData?.todos?.length || 0;
    const todosCompleted = childData?.todos?.filter((t: any) => t.completed).length || 0;
    const todoPct = todosTotal > 0 ? Math.round((todosCompleted / todosTotal) * 100) : 0;

    const routinesTotal = childData?.routines?.length || 0;
    const routinesCompleted = childData?.routines?.filter((t: any) => t.completed).length || 0;
    const routinePct = routinesTotal > 0 ? Math.round((routinesCompleted / routinesTotal) * 100) : 0;

    const streak = childData?.user?.streak || 0;
    const focusHours = childData?.user?.focusMinutes ? (childData.user.focusMinutes / 60).toFixed(1) : 0;
    const pendingTasks = childData?.tasks?.filter((t: any) => !t.completed) || [];

    return (
        <div className="space-y-8">
            {showLinkInput ? (
                <div className="bg-slate-50 dark:bg-white/5 rounded-[2rem] p-8 border-2 border-dashed border-indigo-200 dark:border-indigo-500/30">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <UserPlus className="text-indigo-500" /> Farzandni Bog'lash
                    </h4>
                    <p className="text-sm font-medium text-slate-500 mb-6">Farzandingiz bergan 36 xonali ID kodini kiriting</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input type="text" value={linkCode}
                            onChange={e => setLinkCode(e.target.value)}
                            placeholder="ID kod bu yerga..."
                            className="flex-1 px-5 py-4 bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/10 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 dark:text-white text-base font-mono font-medium shadow-sm transition-all" />
                        <button onClick={handleLink}
                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all w-full sm:w-auto">Qo'shish</button>
                        {linkedStudents.length > 0 && (
                            <button onClick={() => setShowLinkInput(false)}
                                className="px-6 py-4 bg-slate-200/50 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">Bekor</button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between mb-2 bg-slate-50 dark:bg-white/5 p-2 rounded-3xl border border-slate-100 dark:border-white/5">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar w-full">
                        {linkedStudents.map(link => (
                            <button key={link.studentId}
                                onClick={() => setSelectedChild(link.studentId)}
                                className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border-2 ${selectedChild === link.studentId
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-white dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'}`}>
                                <div className="w-7 h-7 rounded-full bg-white/20 p-0.5 shadow-inner flex items-center justify-center overflow-hidden">
                                    <img src={link.studentAvatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${link.studentId}`}
                                        alt="" className="w-full h-full rounded-full object-cover" />
                                </div>
                                {link.studentName || 'Farzand'}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowLinkInput(true)}
                        className="p-3 bg-white dark:bg-white/5 text-slate-500 rounded-2xl border-2 border-transparent hover:border-indigo-200 hover:text-indigo-500 transition-colors flex-shrink-0 shadow-sm ml-2">
                        <UserPlus size={20} />
                    </button>
                </div>
            )}

            {dataLoading ? (
                <div className="text-center py-12"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div>
            ) : childData && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        <StatCard icon={ListTodo} label="Vazifalar" value={`${todosCompleted}/${todosTotal}`}
                            sub={`${todoPct}% tayyor`} color="bg-indigo-500" gradient="bg-indigo-500" />
                        <StatCard icon={CheckCircle2} label="Tartib" value={`${routinesCompleted}/${routinesTotal}`}
                            sub={`${routinePct}% tayyor`} color="bg-violet-500" gradient="bg-violet-500" />
                        <StatCard icon={Flame} label="Streak" value={`${streak} kun`}
                            sub="Ketma-ket" color="bg-orange-500" gradient="bg-orange-500" />
                        <StatCard icon={Clock} label="Fokus" value={`${focusHours}h`}
                            sub="Jami vaqt" color="bg-cyan-500" gradient="bg-cyan-500" />
                    </div>

                    <div className="bg-white dark:bg-[#1a1a1e] rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 dark:border-white/5 shadow-sm">
                        <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                            <BarChart3 size={16} className="text-indigo-500" /> Kunlik Progress
                        </h5>
                        <div className="space-y-5">
                            <ProgressBar
                                label="📋 Rejalar"
                                value={todosCompleted} max={todosTotal} color="bg-indigo-500"
                                onReadClick={() => setActiveModal('todo')}
                            />
                            <ProgressBar
                                label="🔄 Kunlik Tartib"
                                value={routinesCompleted} max={routinesTotal} color="bg-violet-500"
                                onReadClick={() => setActiveModal('routine')}
                            />
                        </div>
                    </div>

                    {activeModal === 'todo' && (
                        <ChildDetailModal
                            title="Farzand Rejalari"
                            items={childData?.todos || []}
                            type="todo"
                            onClose={() => setActiveModal(null)}
                        />
                    )}

                    {activeModal === 'routine' && (
                        <ChildDetailModal
                            title="Kunlik Tartib"
                            items={childData?.routines || []}
                            type="routine"
                            onClose={() => setActiveModal(null)}
                        />
                    )}

                    {pendingTasks.length > 0 && (
                        <div className="bg-white dark:bg-[#1a1a1e] rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 dark:border-white/5 shadow-sm">
                            <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <ListTodo size={16} className="text-rose-500" /> Ustozdan Vazifa
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {pendingTasks.map((task: any) => (
                                    <div key={task.id} className="p-5 bg-rose-50/50 dark:bg-rose-500/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors rounded-2xl border border-rose-100 dark:border-white/5">
                                        <div className="text-sm font-bold text-slate-800 dark:text-white mb-2">{task.title}</div>
                                        {task.deadline && (
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/50 dark:bg-white/10 rounded-lg text-[11px] font-bold text-rose-500">
                                                <Calendar size={12} /> {new Date(task.deadline).toLocaleDateString('uz-UZ')} gacha
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


interface ParentPortalProps {
    onNavigate: (view: AppView) => void;
    user: User;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({ onNavigate, user }) => {
    const [linkedStudents, setLinkedStudents] = useState<ParentStudentLink[]>([]);
    const [parentLoading, setParentLoading] = useState(true);
    const { notify } = useToast();

    useEffect(() => {
        loadLinkedStudents();
    }, []);

    const loadLinkedStudents = async () => {
        try {
            const links = await api.getMyLinkedStudents();
            setLinkedStudents(links || []);
        } catch (e) {
            logger.error('Error loading linked students', e);
        } finally {
            setParentLoading(false);
        }
    };

    const handleLinkChild = async (studentId: string) => {
        try {
            await api.linkParentToStudent(studentId);
            await loadLinkedStudents();
            return true;
        } catch (e) {
            logger.error('Error linking parent to student', e);
            return false;
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020205] text-slate-900 dark:text-gray-100 font-sans selection:bg-indigo-500/30">

            {/* Header Area */}
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 p-8 sm:p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <button
                        onClick={() => onNavigate(AppView.SETTINGS)}
                        className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold border border-white/20 transition-all hover:-translate-x-1"
                    >
                        <ArrowLeft size={16} /> Sozlamalarga qaytish
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-black tracking-widest mb-4 border border-white/20">
                                <Shield size={14} /> OTA-ONA NAZORATI
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black mb-3">Farzandingiz Yutuqlari</h1>
                            <p className="text-indigo-100 text-sm sm:text-base font-medium max-w-md leading-relaxed">Platformadagi barcha faollik, bajarilgan rejalar va kuning tartibini bevosita kuzatib boring.</p>
                        </div>

                        {/* Decorative Element */}
                        <div className="hidden md:flex items-center justify-center pr-8">
                            <div className="w-28 h-28 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 flex items-center justify-center transform rotate-12 hover:rotate-0 hover:scale-110 transition-all duration-500">
                                <Star size={48} className="text-yellow-300 fill-yellow-300 drop-shadow-2xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 sm:p-8 -mt-8 relative z-20 pb-24">
                <div className="bg-white dark:bg-[#1a1a1e] rounded-[3rem] shadow-xl border border-slate-200/50 dark:border-white/5 p-6 sm:p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="relative z-10">
                        <ParentControlComponent
                            linkedStudents={linkedStudents}
                            onLinkChild={handleLinkChild}
                            loading={parentLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
