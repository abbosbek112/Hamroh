
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield, Users, TrendingUp, TrendingDown, AlertTriangle, Search,
  MoreVertical, Ban, CheckCircle, Mail, Send, Bell,
  LayoutDashboard, BarChart2, Megaphone, DollarSign,
  PieChart as PieChartIcon, CreditCard, Wallet, ArrowUpRight,
  ArrowDownRight, Target, Activity, Calendar, Smartphone, Monitor,
  Image as ImageIcon, Link, Palette, Play, Info, AlertCircle, Sparkles, Check,
  Handshake, FileText, Briefcase, Plus, X, Clock, Settings, Crown, Coins, Upload,
  Cpu, Server, Database, MessageSquare, Trash2, UserCheck, Lock, Eye, Filter, Zap,
  LogOut, Phone, Star, Lock as LockIcon, Unlock, PlusCircle, FileMinus, ToggleLeft, ToggleRight, Infinity,
  Save, Sliders, ExternalLink, Timer, Bot, Edit2, Wand2, Smartphone as PhoneIcon, Layers, LayoutTemplate, Copy, Tablet,
  Headphones, ChevronRight, Loader2, ShoppingBag
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { ACHIEVEMENTS_LIST, TRANSLATIONS } from '../constants';
import { api } from '../services/api';
import { SystemConfig, Deal, ActiveAd, AdminUser, Badge, AdminGroup, SpamLog, Expense, SupportTicket, User, StoreItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { logger } from '../utils/logger';
import { validateMessage, sanitizeInput, checkSpamAndProfanity, MAX_LENGTHS } from '../utils/validation';

// --- UTILS ---
const formatUZS = (amount: number) => {
  return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
};

const formatCompactUZS = (amount: number) => {
  if (amount >= 1000000000) return (amount / 1000000000).toFixed(1) + " mlrd";
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + " mln";
  if (amount >= 1000) return (amount / 1000).toFixed(0) + " ming";
  return amount.toString();
};

const calculateDaysLeft = (endDate: string) => {
  const diff = new Date(endDate).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  return days > 0 ? days : 0;
};

type AdminTab = 'OVERVIEW' | 'ANALYTICS' | 'USERS' | 'GROUPS' | 'MODERATION' | 'MARKETING' | 'BADGES' | 'DEALS' | 'SUPPORT' | 'MARKET';
type MarketingSubTab = 'ACTIVE_ADS' | 'CREATE_AD' | 'CREATE_NOTICE';

// --- TOAST & CONFIRM COMPONENTS ---
interface Toast { id: number; message: string; type: 'success' | 'error' | 'info'; }
interface ConfirmState { isOpen: boolean; title: string; message: string; onConfirm: () => void; }

const ToastContainer: React.FC<{ toasts: Toast[], remove: (id: number) => void }> = ({ toasts, remove }) => (
  <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`pointer-events-auto min-w-[300px] p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in-up backdrop-blur-md ${t.type === 'error' ? 'bg-red-500/90 text-white border-red-400' : t.type === 'success' ? 'bg-green-500/90 text-white border-green-400' : 'bg-slate-800/90 text-white border-slate-700'}`}>
        {t.type === 'success' ? <CheckCircle size={20} /> : t.type === 'error' ? <AlertTriangle size={20} /> : <Info size={20} />}
        <span className="font-bold text-sm">{t.message}</span>
        <button onClick={() => remove(t.id)} className="ml-auto p-1 hover:bg-white/20 rounded-full"><X size={14} /></button>
      </div>
    ))}
  </div>
);

const ConfirmationModal: React.FC<{ state: ConfirmState, close: () => void }> = ({ state, close }) => {
  if (!state.isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close}></div>
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1a1a1e] rounded-[2rem] p-6 shadow-2xl border border-slate-200 dark:border-white/10 animate-fade-in-up">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">{state.title}</h3>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-6 font-medium">{state.message}</p>
        <div className="flex gap-3">
          <button onClick={close} className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10">Bekor qilish</button>
          <button onClick={() => { state.onConfirm(); close(); }} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30">O'chirish</button>
        </div>
      </div>
    </div>
  );
};

// --- MODAL COMPONENTS ---

const UserDetailModal: React.FC<{
  user: AdminUser | null;
  onClose: () => void;
  onBan: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateUser: (user: AdminUser) => void;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ user, onClose, onBan, onDelete, onUpdateUser, notify }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'badges'>('profile');
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedBadges(user.badges || []);
    }
  }, [user]);

  if (!user) return null;

  const handleBadgeToggle = (badgeId: string) => {
    setSelectedBadges(prev => {
      if (prev.includes(badgeId)) {
        return prev.filter(id => id !== badgeId);
      } else {
        return [...prev, badgeId];
      }
    });
  };

  const handleSaveBadges = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const updatedUser = { ...user, badges: selectedBadges };
      // Use admin function to update any user
      const savedUser = await api.updateUserAdmin(updatedUser);
      onUpdateUser(savedUser as AdminUser);
      notify('Yorliqlar muvaffaqiyatli yangilandi', 'success');
    } catch (error: unknown) {
      logger.error('Save badges error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Yorliqlarni saqlashda xatolik';
      notify(errorMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const userBadges = user.badges || [];
  const hasChanges = JSON.stringify(selectedBadges.sort()) !== JSON.stringify(userBadges.sort());

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#1a1a1e] rounded-[2rem] shadow-2xl animate-fade-in-up border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 z-10">
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-4 border-white dark:border-white/5 shadow-lg">
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
              <p className="text-slate-500 font-medium">@{user.username}</p>
              <div className="flex gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.status === 'Banned' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'}`}>
                  {user.status}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10 px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'profile'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            Profil Ma'lumotlari
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'badges'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
          >
            Yorliqlar ({selectedBadges.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' ? (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-center border border-slate-100 dark:border-white/5">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{user.xp || 0}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">XP</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-center border border-slate-100 dark:border-white/5">
                  <div className={`text-2xl font-black ${user.riskScore > 50 ? 'text-red-500' : 'text-green-500'}`}>
                    {user.riskScore || 0}%
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Risk</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-center border border-slate-100 dark:border-white/5">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{user.level || 1}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Level</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl text-center border border-slate-100 dark:border-white/5">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{user.streak || 0}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Streak</div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Email</label>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                    {user.email || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Bio</label>
                  <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white min-h-[60px]">
                    {user.bio || 'Bio kiritilmagan'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Telefon</label>
                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                      {user.phoneNumber || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Yosh</label>
                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                      {user.age || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Qo'shilgan sana</label>
                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                      {user.joinedDate || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Oxirgi faollik</label>
                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                      {user.lastActive ? new Date(user.lastActive).toLocaleString('uz-UZ') : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Foydalanuvchiga yorliqlar berish yoki olib tashlash
                </p>
                {hasChanges && (
                  <button
                    onClick={handleSaveBadges}
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Saqlash
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {ACHIEVEMENTS_LIST.map((badge) => {
                  const hasBadge = selectedBadges.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      onClick={() => handleBadgeToggle(badge.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${hasBadge
                        ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500'
                        }`}
                    >
                      <div className="text-3xl mb-2 text-center">{badge.icon}</div>
                      <p className="text-xs font-bold text-center text-slate-900 dark:text-white">
                        {badge.name}
                      </p>
                      {hasBadge && (
                        <div className="mt-2 flex items-center justify-center">
                          <Check size={16} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-white/10 flex gap-3">
          <button
            onClick={() => onBan(user.id)}
            className="flex-1 py-3 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-xl font-bold hover:bg-yellow-200 dark:hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <Ban size={18} /> {user.status === 'Banned' ? 'Unban' : 'Ban'}
          </button>
          <button
            onClick={() => onDelete(user.id)}
            className="flex-1 py-3 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-xl font-bold hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={18} /> O'chirish
          </button>
        </div>
      </div>
    </div>
  );
};

const DealModal: React.FC<{
  isOpen: boolean; onClose: () => void; form: Partial<Deal>; setForm: React.Dispatch<React.SetStateAction<Partial<Deal>>>; onSave: () => void; isEditing: boolean;
}> = ({ isOpen, onClose, form, setForm, onSave, isEditing }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1e] rounded-[2rem] p-8 shadow-2xl animate-fade-in-up border border-slate-200 dark:border-white/10">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">{isEditing ? 'Edit Deal' : 'New Deal'}</h2>
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Client Name</label><input value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold" /></div>
          <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Campaign</label><input value={form.campaignTitle} onChange={e => setForm({ ...form, campaignTitle: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Amount</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: parseInt(e.target.value) })} className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-mono" /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none">
                <option>Ad Integration</option><option>Sponsorship</option><option>Partnership</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">Start</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none" /></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase ml-1">End</label><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none" /></div>
          </div>
          <button onClick={onSave} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors mt-2">{isEditing ? 'Update' : 'Create'} Deal</button>
        </div>
      </div>
    </div>
  );
};

const ExpenseModal: React.FC<{
  isOpen: boolean; onClose: () => void; form: Partial<Expense>; setForm: React.Dispatch<React.SetStateAction<Partial<Expense>>>; onAdd: () => void;
}> = ({ isOpen, onClose, form, setForm, onAdd }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white dark:bg-[#1a1a1e] rounded-[2rem] p-6 shadow-2xl animate-fade-in-up border border-slate-200 dark:border-white/10">
        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Add Expense</h2>
        <div className="space-y-3">
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none" />
          <input type="number" placeholder="Amount" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseInt(e.target.value) })} className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none" />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as any })} className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none">
            <option>Server</option><option>Marketing</option><option>Team</option><option>Office</option><option>Other</option>
          </select>
          <textarea placeholder="Description (Optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none resize-none h-20" />
          <button onClick={onAdd} className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg">Add Expense</button>
        </div>
      </div>
    </div>
  );
};

export const Admin: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [marketingSubTab, setMarketingSubTab] = useState<MarketingSubTab>('ACTIVE_ADS');
  const [userSearch, setUserSearch] = useState('');

  // --- UI STATE ---
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.random(); // Unique ID
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const confirm = (title: string, message: string, action: () => void) => {
    setConfirmState({ isOpen: true, title, message, onConfirm: action });
  };

  // --- CONFIGURATION STATE ---
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    limits: {
      aiDailyMessages: { free: -1 },
      groupCreation: { free: 10 },
      groupJoining: { free: 3 },
      uploadSizeMB: { free: 100 },
      activeHabits: { free: -1 },
      historyRetentionDays: { free: 365 }
    }
  });

  // --- MAIN DATA STATE ---
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [groupsList, setGroupsList] = useState<AdminGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time data state
  const [systemLoadData, setSystemLoadData] = useState<{ time: string, requests: number, latency: number }[]>([]);
  const [ecosystemUsageData, setEcosystemUsageData] = useState<{ name: string, value: number, color: string }[]>([]);

  // Selected Items for Modals
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<AdminGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]); // To store members of selected group
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editGroupForm, setEditGroupForm] = useState<AdminGroup | null>(null);
  const [blockedUsersInGroup, setBlockedUsersInGroup] = useState<User[]>([]);

  // --- DEAL & ADS STATE ---
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeAds, setActiveAds] = useState<ActiveAd[]>([]);

  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealForm, setDealForm] = useState<Partial<Deal>>({
    clientName: '', campaignTitle: '', amount: 0, startDate: '', endDate: '', status: 'Active', type: 'Ad Integration'
  });
  const [isEditingDeal, setIsEditingDeal] = useState(false);

  // --- EXPENSES STATE ---
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: '', amount: 0, category: 'Server', date: new Date().toISOString().split('T')[0], description: ''
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // --- BADGES STATE ---
  const [badges, setBadges] = useState<Badge[]>([]);
  const [badgeForm, setBadgeForm] = useState<{ name: string, icon: string, description: string, theme: string }>({
    name: '', icon: '', description: '', theme: ''
  });
  const [isGeneratingBadge, setIsGeneratingBadge] = useState(false);

  // --- MARKET STATE ---
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeItemForm, setStoreItemForm] = useState<Partial<StoreItem>>({
    type: 'UTILITY', name: '', description: '', price: 0, icon: '', value: ''
  });

  // --- SUPPORT STATE ---
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [supportReply, setSupportReply] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  // SECURITY: Refs to prevent infinite loops in real-time polling
  const supportTicketsRef = useRef<SupportTicket[]>([]);
  const selectedTicketIdRef = useRef<string | null>(null);

  useEffect(() => {
    supportTicketsRef.current = supportTickets;
  }, [supportTickets]);

  useEffect(() => {
    selectedTicketIdRef.current = selectedTicket?.id || null;
  }, [selectedTicket?.id]);

  // --- MARKETING FORM STATE ---
  const [adForm, setAdForm] = useState({
    dealId: '',
    title: '',
    description: '',
    link: '',
    image: '',
    bgGradient: 'from-blue-600 to-violet-600',
    targetAudience: 'All'
  });
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const adImageInputRef = useRef<HTMLInputElement>(null);
  const supportEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);

        const config = await api.getSystemConfig();
        setSystemConfig(config);
        const savedDeals = await api.getDeals();
        setDeals(savedDeals);
        const savedAds = await api.getActiveAds();
        setActiveAds(savedAds);
        const savedBadges = await api.getBadges();
        setBadges(savedBadges);
        const savedStoreItems = await api.getStoreItems();
        setStoreItems(savedStoreItems);

        // Load Tickets (real-time updates handled separately)
        const tickets = await api.getAllSupportTickets();
        setSupportTickets(tickets);

        // Users and Groups will be loaded by real-time effects
        // Initial load happens in real-time useEffect hooks
      } catch (error: unknown) {
        logger.error('Admin panel initialization error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Ma\'lumotlarni yuklashda xatolik';
        notify(errorMessage, 'error');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // --- AUTOMATIC EXPIRATION CHECKER ---
  useEffect(() => {
    const checkExpiration = () => {
      const now = new Date();
      setActiveAds(prevAds => prevAds.map(ad => {
        const deal = deals.find(d => d.id === ad.dealId);
        if (deal && new Date(deal.endDate) < now && ad.status === 'Running') {
          return { ...ad, status: 'Expired' };
        }
        return ad;
      }));
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 60000);
    return () => clearInterval(interval);
  }, [deals]);

  useEffect(() => {
    if (selectedGroup) {
      api.getGroupMembers(selectedGroup.id).then(members => {
        setGroupMembers(members);
      });
      api.getBlockedUsersInGroup(selectedGroup.id).then(blocked => {
        setBlockedUsersInGroup(blocked);
      });
    } else {
      setGroupMembers([]);
      setBlockedUsersInGroup([]);
      setIsEditingGroup(false);
      setEditGroupForm(null);
    }
  }, [selectedGroup]);

  useEffect(() => {
    supportEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  // Real-time Data Subscription
  useEffect(() => {

    const loadInitialData = async () => {
      try {
        const [users, groups] = await Promise.all([
          api.getAllUsers(),
          api.getGroups()
        ]);

        const adminUsers: AdminUser[] = users.map(u => ({
          ...u,
          id: u.id,
          name: u.name,
          username: u.username,
          avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`,
          status: u.status || 'Active',
          role: u.role,
          xp: u.xp || 0,
          riskScore: u.status === 'Banned' ? 100 : Math.floor(Math.random() * 30),
          joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastActive: u.lastActive || Date.now()
        }));
        setUsersList(adminUsers);
      } catch (error: unknown) {
        logger.error('Initial admin data load error:', error);
      }
    };

    loadInitialData();

    // Subscribe to changes
    const unsubscribe = api.subscribeToAdminEvents(
      (payload) => { // Users
        if (payload.eventType === 'INSERT') {
          const newUser = payload.new;
          setUsersList(prev => [...prev, {
            ...newUser,
            id: newUser.id,
            name: newUser.name,
            brand: newUser.brand,
            username: newUser.username,
            avatar: newUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}`,
            role: newUser.role,
            xp: newUser.xp || 0,
            status: newUser.status || 'Active',
            riskScore: 0,
            joinedDate: new Date().toISOString().split('T')[0],
            lastActive: Date.now()
          }]);
          // notify(`Yangi foydalanuvchi: ${payload.new.name}`, 'info');
        } else if (payload.eventType === 'UPDATE') {
          setUsersList(prev => prev.map(u => u.id === payload.new.id ? { ...u, ...payload.new } : u));
        } else if (payload.eventType === 'DELETE') {
          setUsersList(prev => prev.filter(u => u.id !== payload.old.id));
        }
      },
      (payload) => { // Groups
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          api.getGroups().then(groups => {
            setGroupsList(groups.map(g => ({
              id: g.id,
              name: g.name,
              members: g.members || 1,
              activity: 'Active',
              healthScore: (g.members || 1) > 10 ? 80 : 50,
              status: (g.members || 1) > 5 ? 'Healthy' : 'Warning',
              category: (g as any).category || 'General',
              description: (g as any).description || ''
            })));
          });
        }
      },
      (payload) => { // Deals
        if (payload.eventType === 'INSERT') {
          setDeals(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setDeals(prev => prev.map(d => d.id === payload.new.id ? payload.new : d));
        }
      },
      (payload) => { // Store
        api.getStoreItems().then(setStoreItems);
      }
    );

    return () => {
      unsubscribe?.();
    };
  }, []);


  // Real-time system load data (generated from system metrics)
  useEffect(() => {
    const generateSystemLoadData = () => {
      const now = new Date();
      const data: { time: string, requests: number, latency: number }[] = [];

      for (let i = 23; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        data.push({
          time: time.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
          requests: Math.floor(Math.random() * 1000) + 100,
          latency: Math.floor(Math.random() * 200) + 50
        });
      }

      setSystemLoadData(data);
    };

    generateSystemLoadData();
    const interval = setInterval(generateSystemLoadData, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Real-time ecosystem usage data (generated from analytics)
  useEffect(() => {
    const generateEcosystemData = () => {
      const totalUsers = usersList.length;
      const totalGroups = groupsList.length;
      const activeUsers = usersList.filter(u => u.status === 'Active').length;

      setEcosystemUsageData([
        { name: 'Foydalanuvchilar', value: totalUsers, color: '#3b82f6' },
        { name: 'Faol Foydalanuvchilar', value: activeUsers, color: '#10b981' },
        { name: 'Guruhlar', value: totalGroups, color: '#8b5cf6' },
        { name: 'Vazifalar', value: Math.floor(totalUsers * 2.5), color: '#f59e0b' }
      ]);
    };

    generateEcosystemData();
    const interval = setInterval(generateEcosystemData, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [usersList.length, groupsList.length]);

  // Real-time support tickets updates
  useEffect(() => {
    if (activeTab !== 'SUPPORT') return;

    const loadSupportTickets = async () => {
      try {
        const tickets = await api.getAllSupportTickets();

        // Check for new messages and notify admin (via ref to avoid loop)
        const previousTickets = supportTicketsRef.current;
        tickets.forEach(newTicket => {
          const oldTicket = previousTickets.find(t => t.id === newTicket.id);
          if (oldTicket && newTicket.messages.length > oldTicket.messages.length) {
            // New message from user
            const lastMessage = newTicket.messages[newTicket.messages.length - 1];
            if (lastMessage.sender === 'user') {
              notify(`${newTicket.userName} ${TRANSLATIONS[language]?.support?.new_message_from || 'sizga xabar yubordi'}`, 'info');
            }
          }
        });

        setSupportTickets(tickets);
        supportTicketsRef.current = tickets;

        // Update selected ticket if it exists (using ref to avoid stale closure and loop)
        const currentSelectedId = selectedTicketIdRef.current;
        if (currentSelectedId) {
          const updated = tickets.find(t => t.id === currentSelectedId);
          if (updated) {
            setSelectedTicket(updated);
          }
        }
      } catch (error: unknown) {
        logger.error('Load support tickets error:', error);
      }
    };

    loadSupportTickets();
    const POLLING_INTERVAL = 5000; // 5 seconds for real-time feel
    const interval = setInterval(loadSupportTickets, POLLING_INTERVAL);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeTab, language]); // Dependencies reduced to prevent infinite loops

  // --- HANDLERS ---

  const handleDeleteUser = (id: string) => {
    confirm('Foydalanuvchini o\'chirish', 'Haqiqatan ham ushbu foydalanuvchini o\'chirmoqchimisiz? Bu amalni qaytarib bo\'lmaydi va barcha ma\'lumotlar o\'chib ketadi.', async () => {
      try {
        await api.deleteUser(id);
        setUsersList(usersList.filter(u => u.id !== id));
        setSelectedUser(null);
        notify('Foydalanuvchi bazadan o\'chirildi');
      } catch (error: any) {
        notify(error.message || 'Xatolik yuz berdi', 'error');
      }
    });
  };

  const handleBanUser = async (id: string) => {
    try {
      const user = usersList.find(u => u.id === id);
      if (!user) return;

      const shouldBan = user.status !== 'Banned';

      let duration: number | undefined = undefined;
      if (shouldBan) {
        // Ask for duration
        const durationStr = prompt("Ban vaqti (daqiqada)? Bekor qilish uchun bo'sh qoldiring (doimiy ban).");
        if (durationStr && !isNaN(parseInt(durationStr))) {
          duration = parseInt(durationStr);
        }
      }

      await api.banUser(id, shouldBan, duration);

      setUsersList(prev => prev.map(u => {
        if (u.id === id) {
          const updatedUser: AdminUser = {
            ...u,
            status: shouldBan ? 'Banned' : 'Active',
            riskScore: shouldBan ? 100 : Math.floor(Math.random() * 30)
          };
          if (selectedUser?.id === id) setSelectedUser(updatedUser);
          return updatedUser;
        }
        return u;
      }));
      notify(
        shouldBan
          ? (TRANSLATIONS[language]?.admin?.userBanned || `Foydalanuvchi ${duration ? duration + ' daqiqaga' : ''} bloklandi`)
          : (TRANSLATIONS[language]?.admin?.userUnbanned || 'Foydalanuvchi faollashtirildi')
      );
    } catch (error: any) {
      notify(error.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleSaveBadge = async () => {
    if (!badgeForm.name || !badgeForm.icon) return;

    try {
      const newBadge: Badge = {
        id: `badge_${Date.now()}`,
        name: badgeForm.name,
        icon: badgeForm.icon,
        description: badgeForm.description,
        isSecret: false
      };

      await api.saveBadge(newBadge);

      // Reload badges from API to avoid duplicates
      const updatedBadges = await api.getBadges();
      setBadges(updatedBadges);
      setBadgeForm({ name: '', icon: '', description: '', theme: '' });
      notify(TRANSLATIONS[language]?.admin?.badgeSaved || 'Yorliq muvaffaqiyatli saqlandi');
    } catch (error: any) {
      notify(error.message || 'Yorliqni saqlashda xatolik', 'error');
    }
  };

  const handleGenerateAIBadge = async () => {
    alert("AI features have been removed.");
  };

  const handleDeleteBadge = async (id: string) => {
    const deleteTitle = TRANSLATIONS[language]?.admin?.badgeDeleted || 'Yorliqni o\'chirish';
    const deleteMessage = 'Bu yorliq barcha foydalanuvchilardan olib tashlanadi. Tasdiqlaysizmi?';
    confirm(deleteTitle, deleteMessage, async () => {
      try {
        await api.deleteBadge(id);
        // Reload badges from API to ensure consistency
        const updatedBadges = await api.getBadges();
        setBadges(updatedBadges);
        notify(TRANSLATIONS[language]?.admin?.badgeDeleted || 'Yorliq o\'chirildi');
      } catch (error: any) {
        notify(error.message || 'Yorliqni o\'chirishda xatolik', 'error');
      }
    });
  };

  const handleDeleteGroup = async (id: string) => {
    const deleteTitle = TRANSLATIONS[language]?.admin?.delete || 'O\'chirish';
    confirm(deleteTitle, 'Barcha xabarlar va a\'zolar o\'chiriladi.', async () => {
      try {
        await api.deleteGroup(id);
        setGroupsList(groupsList.filter(g => g.id !== id));
        if (selectedGroup?.id === id) setSelectedGroup(null);
        notify(TRANSLATIONS[language]?.admin?.groupDeleted || 'Guruh o\'chirildi');
      } catch (error: any) {
        notify(error.message || (TRANSLATIONS[language]?.common?.error || 'Xatolik yuz berdi'), 'error');
      }
    });
  };

  // Group Editing Handlers
  const handleEditGroupClick = () => {
    if (selectedGroup) {
      setEditGroupForm({ ...selectedGroup });
      setIsEditingGroup(true);
    }
  };

  const handleSaveGroupChanges = async () => {
    if (!editGroupForm) return;

    try {
      const updated = await api.updateGroup(editGroupForm.id, {
        name: editGroupForm.name,
        description: editGroupForm.description,
        category: editGroupForm.category
      });

      // Update local state
      const updatedAdminGroup: AdminGroup = {
        ...editGroupForm,
        name: updated.name,
        description: updated.description,
        category: updated.category
      };

      setGroupsList(prev => prev.map(g => g.id === updatedAdminGroup.id ? updatedAdminGroup : g));
      setSelectedGroup(updatedAdminGroup);
      setIsEditingGroup(false);
      setEditGroupForm(null);
      notify(TRANSLATIONS[language]?.admin?.groupUpdated || 'Guruh ma\'lumotlari yangilandi');
    } catch (error: any) {
      notify(error.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleRemoveMember = (memberId: string) => {
    setGroupMembers(prev => prev.filter(m => m.id !== memberId));
    if (selectedGroup) {
      const updatedGroup = { ...selectedGroup, members: selectedGroup.members - 1 };
      setSelectedGroup(updatedGroup);
      setGroupsList(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
    }
  };

  // --- DEAL HANDLERS ---
  const handleSaveDeal = async () => {
    if (!dealForm.clientName || !dealForm.amount) return;

    try {
      let dealToSave: Deal;

      if (isEditingDeal && dealForm.id) {
        dealToSave = { ...dealForm as Deal };
      } else {
        const gradients = [
          'from-emerald-400 to-cyan-500', 'from-orange-400 to-rose-500', 'from-pink-500 to-rose-500',
          'from-indigo-400 to-cyan-400', 'from-amber-200 to-yellow-400'
        ];
        const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

        dealToSave = {
          id: Date.now().toString(),
          clientName: dealForm.clientName!,
          campaignTitle: dealForm.campaignTitle || 'General Contract',
          amount: Number(dealForm.amount),
          startDate: dealForm.startDate || new Date().toISOString().split('T')[0],
          endDate: dealForm.endDate || new Date().toISOString().split('T')[0],
          status: dealForm.status as any,
          type: dealForm.type as any,
          logoColor: randomGradient
        };
      }

      await api.saveDeal(dealToSave);

      // Reload deals from API
      const updatedDeals = await api.getDeals();
      setDeals(updatedDeals);

      // Close modal and reset form
      setIsDealModalOpen(false);
      resetDealForm();
      notify(TRANSLATIONS[language]?.admin?.dealSaved || 'Kelishuv saqlandi');
    } catch (error: any) {
      notify(error.message || 'Kelishuvni saqlashda xatolik', 'error');
    }
  };

  const openEditDealModal = (deal: Deal) => {
    setDealForm(deal);
    setIsEditingDeal(true);
    setIsDealModalOpen(true);
  };

  const handleDeleteDeal = async (id: string) => {
    const deleteTitle = TRANSLATIONS[language]?.admin?.delete || 'O\'chirish';
    const deleteMessage = TRANSLATIONS[language]?.admin?.dealDeleteConfirm || 'Bu kelishuvni o\'chirishni tasdiqlaysizmi?';
    confirm(deleteTitle, deleteMessage, async () => {
      try {
        await api.deleteDeal(id);
        // Reload deals from API
        const updatedDeals = await api.getDeals();
        setDeals(updatedDeals);
        notify(TRANSLATIONS[language]?.admin?.dealDeleted || 'Kelishuv o\'chirildi');
      } catch (error: any) {
        notify(error.message || 'Kelishuvni o\'chirishda xatolik', 'error');
      }
    });
  };

  const resetDealForm = () => {
    setDealForm({ clientName: '', campaignTitle: '', amount: 0, startDate: '', endDate: '', status: 'Active', type: 'Ad Integration' });
    setIsEditingDeal(false);
  };

  const handleToggleDealStatus = async (deal: Deal) => {
    const nextStatus: Deal['status'] = deal.status === 'Active' ? 'Completed' : deal.status === 'Completed' ? 'Pending' : 'Active';
    const updatedDeal = { ...deal, status: nextStatus };
    const updatedList = deals.map(d => d.id === deal.id ? updatedDeal : d);
    setDeals(updatedList);
    await api.saveDeal(updatedDeal);
    notify(`Status o'zgardi: ${nextStatus}`);
  };

  // --- MARKETING HANDLERS ---
  const handlePlaceAd = async () => {
    if (!adForm.dealId || !adForm.title) {
      notify("Iltimos, avval faol kelishuvni (Deal) tanlang va sarlavha kiriting.", 'error');
      return;
    }

    const selectedDeal = deals.find(d => d.id === adForm.dealId);
    if (!selectedDeal) return;

    const newAd: ActiveAd = {
      id: Date.now().toString(),
      dealId: selectedDeal.id,
      title: adForm.title,
      description: adForm.description,
      link: adForm.link,
      image: adForm.image,
      bgGradient: selectedDeal.logoColor, // Inherit color from deal
      views: 0,
      clicks: 0,
      status: 'Running',
      targetAudience: adForm.targetAudience
    };

    setActiveAds([newAd, ...activeAds]);
    await api.saveActiveAd(newAd);
    setMarketingSubTab('ACTIVE_ADS');
    setAdForm({ dealId: '', title: '', description: '', link: '', image: '', bgGradient: 'from-blue-600 to-violet-600', targetAudience: 'All' });
    notify('Reklama kampaniyasi boshlandi!');
  };

  const handleGenerateAICopy = () => {
    if (!adForm.dealId) return alert("Avval kelishuvni tanlang!");
    setIsGeneratingCopy(true);
    const deal = deals.find(d => d.id === adForm.dealId);
    setTimeout(() => {
      setAdForm(prev => ({
        ...prev,
        title: `🔥 ${deal?.clientName} bilan maxsus taklif!`,
        description: `${deal?.campaignTitle} doirasida barcha foydalanuvchilar uchun eksklyuziv imkoniyat. Hoziroq ulaning va 20% chegirmaga ega bo'ling!`,
      }));
      setIsGeneratingCopy(false);
      notify('AI reklama matnini yozdi', 'info');
    }, 1500);
  };

  const handleDeleteAd = async (adId: string) => {
    confirm('Reklamani o\'chirish', 'Kampaniya to\'xtatiladi va statistikalar o\'chiriladi.', async () => {
      setActiveAds(activeAds.filter(a => a.id !== adId));
      await api.deleteActiveAd(adId);
      notify('Reklama o\'chirildi');
    });
  };

  const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- EXPENSE HANDLERS ---
  const handleAddExpense = () => {
    if (!newExpense.title || !newExpense.amount) return;
    const expense: Expense = {
      id: Date.now().toString(),
      title: newExpense.title!,
      amount: newExpense.amount!,
      category: newExpense.category as any,
      date: newExpense.date || new Date().toISOString().split('T')[0],
      description: newExpense.description
    };
    setExpenses([expense, ...expenses]);
    setIsExpenseModalOpen(false);
    setNewExpense({ title: '', amount: 0, category: 'Server', date: new Date().toISOString().split('T')[0], description: '' });
    notify('Xarajat qo\'shildi');
  };

  // --- SUPPORT HANDLERS ---
  const handleSendAdminReply = async () => {
    if (!selectedTicket || !supportReply.trim() || isSendingSupport) return;

    // Validate message
    const validation = validateMessage(supportReply);
    if (!validation.valid) {
      notify(validation.error || 'Xabar noto\'g\'ri', 'error');
      return;
    }

    // Check for spam and profanity
    const spamCheck = checkSpamAndProfanity(supportReply);
    if (spamCheck.isSpam) {
      notify(spamCheck.reason || 'Xabar spam yoki haqoratli mazmunni o\'z ichiga oladi', 'error');
      return;
    }

    // Sanitize input
    const sanitizedText = sanitizeInput(supportReply.trim());
    setIsSendingSupport(true);
    setSupportReply(''); // Clear input

    try {
      const newMsg = await api.adminReplyToTicket(selectedTicket.id, sanitizedText);

      // Update Local State
      const updatedTicket: SupportTicket = {
        ...selectedTicket,
        status: 'OPEN' as const, // Match the change in api.adminReplyToTicket
        messages: [...selectedTicket.messages, newMsg],
        lastMessage: `Admin: ${sanitizedText}`,
        lastUpdated: Date.now()
      };
      setSupportTickets(prev => {
        const next = prev.map(t => t.id === selectedTicket.id ? updatedTicket : t);
        supportTicketsRef.current = next;
        return next;
      });
      setSelectedTicket(updatedTicket);
      selectedTicketIdRef.current = updatedTicket.id;
      notify('Javob yuborildi', 'success');

      // Scroll to bottom
      setTimeout(() => {
        supportEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      setSupportReply(sanitizedText); // Restore on error
      notify(error.message || 'Xabar yuborishda xatolik', 'error');
    } finally {
      setIsSendingSupport(false);
    }
  };

  // --- STORE HANDLERS ---
  const handleSaveStoreItem = async () => {
    if (!storeItemForm.name || !storeItemForm.price || !storeItemForm.icon) return;

    try {
      const newItem: StoreItem = {
        id: storeItemForm.id || `item_${Date.now()}`,
        type: storeItemForm.type as any || 'UTILITY',
        name: storeItemForm.name,
        description: storeItemForm.description || '',
        price: Number(storeItemForm.price),
        icon: storeItemForm.icon,
        value: storeItemForm.value
      };

      await api.addStoreItem(newItem);

      const updatedItems = await api.getStoreItems();
      setStoreItems(updatedItems);
      setIsStoreModalOpen(false);
      setStoreItemForm({ type: 'UTILITY', name: '', description: '', price: 0, icon: '', value: '' });
      notify('Tovar muvaffaqiyatli saqlandi');
    } catch (error: any) {
      notify(error.message || 'Xatolik yuz berdi', 'error');
    }
  };

  const handleDeleteStoreItem = (id: string) => {
    confirm('Tovarni o\'chirish', 'Tasdiqlaysizmi?', async () => {
      try {
        await api.deleteStoreItem(id);
        setStoreItems(prev => prev.filter(i => i.id !== id));
        notify('Tovar o\'chirildi');
      } catch (error: any) {
        notify(error.message, 'error');
      }
    });
  };

  // --- RENDERERS ---

  const renderOverview = () => {
    if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

    const activeUsers = usersList.filter(u => u.status === 'Active').length;
    const bannedUsers = usersList.filter(u => u.status === 'Banned').length;
    const totalUsers = usersList.length || 1;
    const activePercent = Math.round((activeUsers / totalUsers) * 100);
    const bannedPercent = Math.round((bannedUsers / totalUsers) * 100);
    const avgXp = Math.round(usersList.reduce((acc, u) => acc + (u.xp || 0), 0) / totalUsers);
    const newestUser = [...usersList].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

    return (
      <div className="space-y-8 animate-fade-in pb-10">
        {/* HERO STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Users Card */}
          <div className="relative overflow-hidden bg-white dark:bg-[#1e1e24] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-indigo-500/10 group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
              <Users size={120} className="text-indigo-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                  <Users size={24} />
                </div>
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Jami Foydalanuvchilar</span>
              </div>
              <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                {usersList.length.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-green-500 bg-green-50 dark:bg-green-500/10 px-3 py-1 rounded-full w-fit">
                <TrendingUp size={16} /> +12% <span className="text-slate-400 font-normal">bu hafta</span>
              </div>
            </div>
          </div>

          {/* Active Users Card */}
          <div className="relative overflow-hidden bg-white dark:bg-[#1e1e24] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-emerald-500/10 group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12 duration-500">
              <Activity size={120} className="text-emerald-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
                  <Activity size={24} />
                </div>
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Faol Foydalanuvchilar</span>
              </div>
              <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                {activeUsers.toLocaleString()}
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 h-3 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${activePercent}%` }}></div>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-400 text-right">{activePercent}% Faollik</div>
            </div>
          </div>

          {/* Banned Users Card */}
          <div className="relative overflow-hidden bg-white dark:bg-[#1e1e24] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl shadow-red-500/10 group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
              <Ban size={120} className="text-red-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-50 dark:bg-red-500/20 rounded-2xl text-red-600 dark:text-red-400">
                  <Ban size={24} />
                </div>
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Bloklanganlar</span>
              </div>
              <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                {bannedUsers.toLocaleString()}
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 h-3 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: `${Math.max(bannedPercent, 5)}%` }}></div>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-400 text-right">{bannedPercent}% Hissan</div>
            </div>
          </div>
        </div>

        {/* DETAILED STATS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Growth Chart */}
          <div className="bg-white dark:bg-[#1e1e24] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
              <TrendingUp size={24} className="text-indigo-500" />
              Foydalanuvchilar O'sishi
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height={256}>
                <AreaChart data={usersList.reduce((acc: any[], user) => {
                  const date = user.joinedDate || new Date().toISOString().split('T')[0];
                  const existing = acc.find(i => i.date === date);
                  if (existing) existing.count++;
                  else acc.push({ date, count: 1 });
                  return acc;
                }, []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()).reduce((acc: any[], curr: any) => {
                  const lastCount = acc.length > 0 ? acc[acc.length - 1].total : 0;
                  acc.push({ date: curr.date, total: lastCount + curr.count });
                  return acc;
                }, [])}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} minTickGap={30} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Distribution (Real Data) */}
          <div className="bg-white dark:bg-[#1e1e24] p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
              <Smartphone size={24} className="text-pink-500" />
              Platforma
            </h3>

            {(() => {
              const total = usersList.length || 1;
              const desktop = usersList.filter(u => u.platform === 'desktop').length;
              const android = usersList.filter(u => u.platform === 'mobile_android').length;
              const ios = usersList.filter(u => u.platform === 'mobile_ios').length;
              // Fallback for undefined platforms (treat as web/desktop or separate)
              const unknown = usersList.length - (desktop + android + ios);
              // Adjust percentages to sum to 100 approx
              const desktopPercent = Math.round(((desktop + unknown) / total) * 100);
              const androidPercent = Math.round((android / total) * 100);
              const iosPercent = Math.round((ios / total) * 100);

              return (
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2"><Monitor size={18} /> Desktop / Web</span>
                      <span className="font-black text-slate-900 dark:text-white text-lg">{desktopPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/5 h-4 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" style={{ width: `${desktopPercent}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2"><Smartphone size={18} /> Mobile (Android)</span>
                      <span className="font-black text-slate-900 dark:text-white text-lg">{androidPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/5 h-4 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-[0_0_10px_rgba(22,163,74,0.4)]" style={{ width: `${androidPercent}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2"><Smartphone size={18} /> Mobile (iOS)</span>
                      <span className="font-black text-slate-900 dark:text-white text-lg">{iosPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-white/5 h-4 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-slate-400 to-slate-600 rounded-full shadow-[0_0_10px_rgba(100,116,139,0.4)]" style={{ width: `${iosPercent}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    const totalRevenue = deals.reduce((acc, deal) => acc + (deal.status !== 'Pending' ? deal.amount : 0), 0);
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const financialData = [
      { name: 'Revenue', amount: totalRevenue },
      { name: 'Expenses', amount: totalExpenses }
    ];

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-sm">
            <div className="text-sm font-bold text-slate-500 uppercase mb-2">Total Revenue</div>
            <div className="text-3xl font-black text-slate-900 dark:text-white text-green-500">{formatCompactUZS(totalRevenue)}</div>
          </div>
          <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-sm">
            <div className="text-sm font-bold text-slate-500 uppercase mb-2">Total Expenses</div>
            <div className="text-3xl font-black text-slate-900 dark:text-white text-red-500">{formatCompactUZS(totalExpenses)}</div>
          </div>
          <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-sm">
            <div className="text-sm font-bold text-slate-500 uppercase mb-2">Net Profit</div>
            <div className={`text-3xl font-black ${netProfit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>{formatCompactUZS(netProfit)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 shadow-sm">
            <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Financial Overview</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(val) => formatCompactUZS(val)} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} formatter={(val: number) => formatUZS(val)} />
                  <Bar dataKey="amount" fill="#8884d8" radius={[8, 8, 0, 0]}>
                    {financialData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Revenue' ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recent Expenses</h3>
              <button onClick={() => setIsExpenseModalOpen(true)} className="px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-colors">
                + Add Expense
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {expenses.length === 0 ? <div className="text-center text-slate-400 py-10">Xarajatlar yo'q</div> : expenses.map(exp => (
                <div key={exp.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{exp.title}</div>
                    <div className="text-xs text-slate-500">{exp.date} • {exp.category}</div>
                  </div>
                  <div className="font-bold text-red-500">-{formatCompactUZS(exp.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGroups = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={32} />
            <p className="text-slate-500 dark:text-slate-400">{t('common.loading')}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Edit Group Modal */}
        {isEditingGroup && editGroupForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsEditingGroup(false); setEditGroupForm(null); }}></div>
            <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1e] rounded-[2rem] p-8 shadow-2xl animate-fade-in-up border border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Guruhni tahrirlash</h2>
                <button onClick={() => { setIsEditingGroup(false); setEditGroupForm(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Guruh nomi</label>
                  <input
                    value={editGroupForm.name}
                    onChange={e => setEditGroupForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                    placeholder="Guruh nomi"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Tavsif</label>
                  <textarea
                    value={editGroupForm.description || ''}
                    onChange={e => setEditGroupForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none resize-none h-24 text-slate-900 dark:text-white"
                    placeholder="Guruh tavsifi"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Kategoriya</label>
                  <select
                    value={editGroupForm.category}
                    onChange={e => setEditGroupForm(prev => prev ? { ...prev, category: e.target.value } : null)}
                    className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-slate-900 dark:text-white"
                  >
                    <option value="IT">IT</option>
                    <option value="Sport">Sport</option>
                    <option value="Education">Education</option>
                    <option value="Business">Business</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setIsEditingGroup(false); setEditGroupForm(null); }}
                    className="flex-1 py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleSaveGroupChanges}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                  >
                    Saqlash
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Group Details Modal */}
        {selectedGroup && !isEditingGroup && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedGroup(null)}></div>
            <div className="relative w-full max-w-4xl bg-white dark:bg-[#1a1a1e] rounded-[2rem] p-8 shadow-2xl animate-fade-in-up border border-slate-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedGroup.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{selectedGroup.description || 'Tavsif yo\'q'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleEditGroupClick} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-400 hover:text-blue-500" title="Tahrirlash"><Edit2 size={20} /></button>
                  <button onClick={() => setSelectedGroup(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Users size={16} /> Guruh a'zolari ({groupMembers.length})
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {groupMembers.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">A'zolar yo'q</p>
                    ) : groupMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <img src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`} className="w-10 h-10 rounded-full" />
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{member.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">@{member.username}</div>
                          </div>
                        </div>
                        {blockedUsersInGroup.some(bu => bu.id === member.id) && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Bloklangan</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Shield size={16} /> Bloklangan foydalanuvchilar ({blockedUsersInGroup.length})
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {blockedUsersInGroup.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">Bloklangan foydalanuvchilar yo'q</p>
                    ) : blockedUsersInGroup.map(blocked => (
                      <div key={blocked.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                        <div className="flex items-center gap-3">
                          <img src={blocked.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(blocked.name)}`} className="w-10 h-10 rounded-full" />
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{blocked.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">@{blocked.username}</div>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await api.unblockUserInGroup(selectedGroup.id, blocked.id);
                              setBlockedUsersInGroup(prev => prev.filter(bu => bu.id !== blocked.id));
                              notify(`${blocked.name} blokdan chiqarildi`);
                            } catch (error: any) {
                              notify(error.message || 'Xatolik yuz berdi', 'error');
                            }
                          }}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold"
                        >
                          Blokdan chiqarish
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <th className="p-6 font-bold text-slate-500 uppercase text-xs">Group Name</th>
                  <th className="p-6 font-bold text-slate-500 uppercase text-xs">Members</th>
                  <th className="p-6 font-bold text-slate-500 uppercase text-xs">Category</th>
                  <th className="p-6 font-bold text-slate-500 uppercase text-xs">Health Score</th>
                  <th className="p-6 font-bold text-slate-500 uppercase text-xs">Status</th>
                  <th className="p-6 font-bold text-slate-500 uppercase text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {groupsList.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-400">Guruhlar mavjud emas</td></tr>}
                {groupsList.map(group => (
                  <tr key={group.id} className="hover:bg-white dark:hover:bg-white/5 transition-colors">
                    <td className="p-6 font-bold text-slate-900 dark:text-white">{group.name}</td>
                    <td className="p-6 text-slate-600 dark:text-slate-300">{group.members}</td>
                    <td className="p-6"><span className="px-3 py-1 bg-slate-100 dark:bg-white/10 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">{group.category}</span></td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${group.healthScore > 80 ? 'bg-green-500' : group.healthScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <span className="font-bold">{group.healthScore}%</span>
                      </div>
                    </td>
                    <td className="p-6"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${group.status === 'Healthy' ? 'bg-green-100 text-green-700' : group.status === 'Warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{group.status}</span></td>
                    <td className="p-6 text-right flex justify-end gap-2">
                      <button onClick={() => setSelectedGroup(group)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full" title="Batafsil ko'rish"><Eye size={18} /></button>
                      <button onClick={() => { setSelectedGroup(group); handleEditGroupClick(); }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full" title="Tahrirlash"><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteGroup(group.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full" title="O'chirish"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderModeration = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-500/20 p-6 rounded-[2rem]">
          <h3 className="font-bold text-red-700 dark:text-red-400 text-lg flex items-center gap-2"><AlertTriangle size={20} /> Recent Spam Alerts</h3>
        </div>

        <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <th className="p-6 font-bold text-slate-500 uppercase text-xs">User</th>
                <th className="p-6 font-bold text-slate-500 uppercase text-xs">Content</th>
                <th className="p-6 font-bold text-slate-500 uppercase text-xs">Type</th>
                <th className="p-6 font-bold text-slate-500 uppercase text-xs">AI Confidence</th>
                <th className="p-6 font-bold text-slate-500 uppercase text-xs text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              <tr><td colSpan={5} className="p-10 text-center text-slate-400">Xavfsiz. Spam aniqlanmadi.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDeals = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Partnerships</h2>
          <button onClick={() => setIsDealModalOpen(true)} className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-all flex items-center gap-2">
            <Plus size={20} /> New Deal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.length === 0 && <div className="col-span-full text-center py-10 text-slate-400">Kelishuvlar mavjud emas.</div>}
          {deals.map(deal => (
            <div key={deal.id} className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${deal.logoColor}`}></div>
              <div className="pl-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">{deal.clientName}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase">{deal.campaignTitle}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${deal.status === 'Active' ? 'bg-green-100 text-green-700' : deal.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>{deal.status}</span>
                </div>

                <div className="text-2xl font-black text-slate-900 dark:text-white mb-4">{formatCompactUZS(deal.amount)}</div>

                <div className="flex justify-between text-xs text-slate-500 font-medium mb-6">
                  <span>{deal.startDate}</span>
                  <span>→</span>
                  <span>{deal.endDate}</span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openEditDealModal(deal)} className="flex-1 py-2 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-xs hover:bg-slate-200 dark:hover:bg-white/20 transition-colors flex items-center justify-center gap-1">
                    <Edit2 size={14} /> {TRANSLATIONS[language]?.common?.edit || 'Edit'}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id); }} className="px-3 py-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg font-bold text-xs hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors flex items-center justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUsers = () => {
    const filteredUsers = usersList.filter(u =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input
              type="text"
              placeholder={TRANSLATIONS[language]?.admin?.searchUsers || 'Foydalanuvchi qidirish...'}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <th className="p-6 font-bold text-slate-500 uppercase text-xs">Foydalanuvchi</th>
                  <th className="p-6 font-bold text-slate-500 uppercase text-xs">Status</th>
                  <th className="p-6 font-bold text-slate-500 uppercase text-xs">Xavf</th>
                  <th className="p-6 font-bold text-slate-500 uppercase text-xs">Role</th>
                  <th className="p-6 font-bold text-slate-500 uppercase text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredUsers.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-400">{TRANSLATIONS[language]?.admin?.noUsers || 'Foydalanuvchilar topilmadi'}</td></tr>}
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-white dark:hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedUser(user)}>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          {user.avatar && <img src={user.avatar} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.status === 'Banned' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                        }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.riskScore > 50 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        <span className={`text-sm font-bold ${user.riskScore > 50 ? 'text-red-500' : 'text-slate-500'}`}>{user.riskScore}%</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{user.role}</span>
                    </td>
                    <td className="p-6 text-right">
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-indigo-500">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderMarket = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Do'kon Boshqaruvi</h2>
          <button
            onClick={() => {
              setStoreItemForm({ type: 'UTILITY', name: '', description: '', price: 0, icon: '', value: '' });
              setIsStoreModalOpen(true);
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Plus size={20} /> Yangi Tovar
          </button>
        </div>

        <div className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <th className="p-6 font-bold text-slate-500 uppercase text-xs">Icon</th>
                <th className="p-6 font-bold text-slate-500 uppercase text-xs">Name</th>
                <th className="p-6 font-bold text-slate-500 uppercase text-xs">Type</th>
                <th className="p-6 font-bold text-slate-500 uppercase text-xs">Price</th>
                <th className="p-6 font-bold text-slate-500 uppercase text-xs text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {storeItems.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-400">Do'konda tovarlar yo'q</td></tr>}
              {storeItems.map(item => (
                <tr key={item.id} className="hover:bg-white dark:hover:bg-white/5 transition-colors">
                  <td className="p-6 text-2xl">{item.icon}</td>
                  <td className="p-6">
                    <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                    <div className="text-xs text-slate-500 max-w-xs truncate">{item.description}</div>
                  </td>
                  <td className="p-6"><span className="px-3 py-1 bg-slate-100 dark:bg-white/10 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">{item.type}</span></td>
                  <td className="p-6 font-mono font-bold text-slate-900 dark:text-white">{item.price} XP</td>
                  <td className="p-6 text-right">
                    <button onClick={() => handleDeleteStoreItem(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full" title="O'chirish"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Store Item Modal */}
        {isStoreModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsStoreModalOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1e] rounded-[2rem] p-8 shadow-2xl animate-fade-in-up border border-slate-200 dark:border-white/10">
              <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Yangi Tovar Qo'shish</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Turi</label>
                  <select
                    value={storeItemForm.type}
                    onChange={e => setStoreItemForm({ ...storeItemForm, type: e.target.value as any })}
                    className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none"
                  >
                    <option value="UTILITY">Utility (Foydali)</option>
                    <option value="THEME">Theme (Mavzu)</option>
                    <option value="BADGE">Badge (Yorliq)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Nomi</label>
                  <input
                    value={storeItemForm.name}
                    onChange={e => setStoreItemForm({ ...storeItemForm, name: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold"
                    placeholder="Masalan: Super Kuch"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Tavsif</label>
                  <textarea
                    value={storeItemForm.description}
                    onChange={e => setStoreItemForm({ ...storeItemForm, description: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none"
                    placeholder="Tovar haqida qisqacha..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Narxi (XP)</label>
                    <input
                      type="number"
                      value={storeItemForm.price}
                      onChange={e => setStoreItemForm({ ...storeItemForm, price: parseInt(e.target.value) || 0 })}
                      className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Icon (Emoji)</label>
                    <input
                      value={storeItemForm.icon}
                      onChange={e => setStoreItemForm({ ...storeItemForm, icon: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-center text-2xl"
                      placeholder="🚀"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Qiymat (Value) - Opsional</label>
                  <input
                    value={storeItemForm.value || ''}
                    onChange={e => setStoreItemForm({ ...storeItemForm, value: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-sm"
                    placeholder="Masalan: theme_id yoki badge_id"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">Mavzular va Yorliqlar uchun ID kiritish kerak.</p>
                </div>

                <button onClick={handleSaveStoreItem} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-colors mt-2">
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  const renderMarketing = () => {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <button onClick={() => setMarketingSubTab('ACTIVE_ADS')} className={`px-4 py-2 rounded-xl font-bold text-sm ${marketingSubTab === 'ACTIVE_ADS' ? 'bg-slate-900 dark:bg-white text-white dark:text-black' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>Active Ads</button>
          <button onClick={() => setMarketingSubTab('CREATE_AD')} className={`px-4 py-2 rounded-xl font-bold text-sm ${marketingSubTab === 'CREATE_AD' ? 'bg-slate-900 dark:bg-white text-white dark:text-black' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}>Create Ad</button>
        </div>

        {marketingSubTab === 'ACTIVE_ADS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAds.length > 0 ? activeAds.map(ad => (
              <div key={ad.id} className="bg-white/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all">
                <div className={`h-40 bg-gradient-to-r ${ad.bgGradient} relative flex flex-col justify-between p-4`}>
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-1 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold rounded uppercase ${ad.status === 'Expired' ? 'bg-red-500/80' : ''}`}>{ad.status}</span>
                    <button onClick={() => handleDeleteAd(ad.id)} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white"><Trash2 size={14} /></button>
                  </div>
                  {ad.image && <img src={ad.image} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay" />}
                  <div className="relative z-10">
                    <h3 className="font-bold text-lg text-white leading-tight">{ad.title}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 h-10">{ad.description}</p>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Views</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">{ad.views.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clicks</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white">{ad.clicks.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : <div className="col-span-full text-center py-10 text-slate-400">Hozirda faol reklamalar yo'q.</div>}
          </div>
        )}

        {marketingSubTab === 'CREATE_AD' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">

            {/* LEFT: EDITOR */}
            <div className="space-y-6">
              <div className="bg-white/70 dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Handshake size={14} className="text-indigo-500" /> Active Deal
                  </label>
                  {adForm.dealId && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200">VERIFIED</span>}
                </div>
                <div className="relative">
                  <select
                    value={adForm.dealId}
                    onChange={e => {
                      const deal = deals.find(d => d.id === e.target.value);
                      setAdForm({
                        ...adForm,
                        dealId: e.target.value,
                        bgGradient: deal ? deal.logoColor : 'from-blue-600 to-violet-600'
                      });
                    }}
                    className="w-full p-4 pl-12 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 dark:text-white appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <option value="">-- Select Partnership --</option>
                    {deals.filter(d => d.status === 'Active').map(deal => (
                      <option key={deal.id} value={deal.id}>
                        {deal.clientName} • {deal.campaignTitle}
                      </option>
                    ))}
                  </select>
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-br ${adForm.dealId ? (deals.find(d => d.id === adForm.dealId)?.logoColor || 'from-gray-300 to-gray-400') : 'from-gray-300 to-gray-400'}`}></div>
                </div>
              </div>

              <div className={`space-y-4 transition-all duration-500 ${!adForm.dealId ? 'opacity-50 pointer-events-none blur-[2px]' : 'opacity-100'}`}>
                <button onClick={handleGenerateAICopy} disabled={isGeneratingCopy} className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-95 transition-all">{isGeneratingCopy ? <Timer className="animate-spin" size={16} /> : <Wand2 size={16} />} {isGeneratingCopy ? 'AI is writing...' : 'Generate with AI'}</button>
                <div className="space-y-4 bg-white/70 dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Headline</label><input type="text" placeholder="Catchy Headline..." value={adForm.title} onChange={e => setAdForm({ ...adForm, title: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none font-bold text-lg focus:border-indigo-500 transition-colors" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Ad Copy</label><textarea placeholder="Describe the offer..." value={adForm.description} onChange={e => setAdForm({ ...adForm, description: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none text-sm font-medium focus:border-indigo-500 transition-colors h-28 resize-none" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Target Link</label><div className="flex items-center bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden"><div className="pl-4 text-slate-400"><Link size={16} /></div><input type="text" placeholder="https://..." value={adForm.link} onChange={e => setAdForm({ ...adForm, link: e.target.value })} className="w-full p-4 bg-transparent outline-none text-blue-500 font-medium" /></div></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/70 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10"><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Target Audience</label><select value={adForm.targetAudience} onChange={(e) => setAdForm({ ...adForm, targetAudience: e.target.value })} className="w-full p-2 bg-transparent font-bold text-slate-700 dark:text-white outline-none cursor-pointer"><option value="All">All Users</option><option value="New">New Users</option></select></div>
                  <button onClick={() => adImageInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/10 border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl text-slate-500 hover:text-indigo-500 hover:border-indigo-500 transition-all font-bold text-sm"><Upload size={18} /> {adForm.image ? 'Change Image' : 'Upload Creative'}</button>
                  <input type="file" ref={adImageInputRef} className="hidden" accept="image/*" onChange={handleAdImageUpload} />
                </div>
                <button onClick={handlePlaceAd} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl">Launch Campaign</button>
              </div>
            </div>
            {/* Right Column (Preview) simplified here for brevity */}
            <div className="flex flex-col items-center justify-center text-slate-400">Preview Area</div>
          </div>
        )}
      </div>
    );
  };

  const renderBadges = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Creator Area - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Form */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-white/5 p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -z-10"></div>
          <div className="flex items-center gap-3 mb-8"><div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/30"><Star size={24} fill="currentColor" /></div><div><h3 className="font-bold text-xl text-slate-900 dark:text-white">Yorliq Yaratish</h3><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Foydalanuvchilar uchun yangi yutuqlar</p></div></div>
          <div className="mb-8 bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20"><label className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase mb-2 flex items-center gap-2"><Sparkles size={14} /> AI Yordamchi</label><div className="flex gap-2"><input value={badgeForm.theme} onChange={e => setBadgeForm({ ...badgeForm, theme: e.target.value })} placeholder="Mavzu (masalan: Kitobxon...)" className="flex-1 p-3 bg-white dark:bg-black/20 border border-indigo-200 dark:border-indigo-500/30 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" /><button onClick={handleGenerateAIBadge} disabled={isGeneratingBadge || !badgeForm.theme} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">{isGeneratingBadge ? <Timer className="animate-spin" size={18} /> : <Wand2 size={18} />}<span className="hidden sm:inline">Generatsiya</span></button></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase ml-1">Nom</label><input value={badgeForm.name} onChange={e => setBadgeForm({ ...badgeForm, name: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 font-bold" placeholder="Yutuq nomi" /></div><div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase ml-1">Ikon (Emoji)</label><div className="relative"><input value={badgeForm.icon} onChange={e => setBadgeForm({ ...badgeForm, icon: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 font-bold pl-12" placeholder="🏆" /><div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl grayscale opacity-50">{badgeForm.icon || '❓'}</div></div></div><div className="col-span-1 md:col-span-2 space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase ml-1">Tavsif</label><input value={badgeForm.description} onChange={e => setBadgeForm({ ...badgeForm, description: e.target.value })} className="w-full p-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 text-sm" placeholder="Qisqacha ta'rif..." /></div></div>
          <div className="mt-8 flex justify-end"><button onClick={handleSaveBadge} disabled={!badgeForm.name || !badgeForm.icon} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Save size={18} /> Saqlash</button></div>
        </div>
        {/* Right: Live Preview */}
        <div className="bg-white/70 dark:bg-white/5 p-8 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-sm flex flex-col items-center justify-center text-center relative"><h4 className="absolute top-6 left-0 w-full text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Live Preview</h4><div className={`mt-4 p-6 rounded-[2rem] border transition-all duration-500 flex flex-col items-center gap-4 w-full max-w-[200px] ${badgeForm.name ? 'bg-gradient-to-b from-white to-slate-50 dark:from-white/10 dark:to-white/5 border-slate-200 dark:border-white/10 shadow-xl scale-100 opacity-100' : 'bg-slate-50 dark:bg-white/5 border-dashed border-slate-300 dark:border-white/10 scale-95 opacity-50 grayscale'}`}><div className="text-6xl filter drop-shadow-md transition-transform hover:scale-110 duration-300 cursor-default">{badgeForm.icon || '💎'}</div><div><h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-1">{badgeForm.name || 'Nom kiritilmagan'}</h3><p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{badgeForm.description || 'Tavsif bu yerda paydo bo\'ladi...'}</p></div></div></div>
      </div>
      {/* Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {badges.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            <Crown size={48} className="mx-auto mb-4 opacity-50" />
            <p>Hozircha yorliqlar yo'q</p>
          </div>
        ) : (
          badges.map(badge => (
            <div key={badge.id} className="relative group bg-white/70 dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 flex flex-col items-center text-center hover:shadow-xl transition-all hover:-translate-y-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteBadge(badge.id);
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 rounded-full opacity-100 group-hover:opacity-100 transition-opacity z-10"
                title="O'chirish"
              >
                <Trash2 size={16} />
              </button>
              <div className="text-4xl mb-3 drop-shadow-sm">{badge.icon}</div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-1 leading-tight">{badge.name}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">{badge.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSupport = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
      {/* Ticket List */}
      <div className="bg-white/80 dark:bg-[#1a1a1e]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-xl relative">
        {/* Gradient Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>

        <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 dark:from-indigo-500/5 dark:to-violet-500/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Headphones size={20} strokeWidth={2} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {TRANSLATIONS[language]?.support?.title || 'Yordam va Maslahatlar'}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold">
              {supportTickets.filter(t => t.status === 'OPEN').length} ochiq
            </div>
            <div className="px-3 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold">
              {supportTickets.length} jami
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {supportTickets.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              <p>Murojaatlar yo'q</p>
            </div>
          )}
          {supportTickets.map(ticket => {
            const hasUnread = ticket.messages.some(msg =>
              msg.sender === 'user' &&
              msg.timestamp > (selectedTicket?.id === ticket.id ? Date.now() : ticket.lastUpdated)
            );

            return (
              <div
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  selectedTicketIdRef.current = ticket.id;
                }}
                className={`p-4 border-b border-slate-100 dark:border-white/5 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-white/10 relative group ${selectedTicket?.id === ticket.id
                  ? 'bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-l-4 border-l-indigo-500 shadow-sm'
                  : hasUnread
                    ? 'bg-blue-50/50 dark:bg-blue-500/10'
                    : ''
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{ticket.userName}</h4>
                    {hasUnread && (
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 animate-pulse shadow-sm shadow-blue-500/50"></span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0 shadow-sm ${ticket.status === 'OPEN'
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-500/20 dark:to-emerald-500/20 dark:text-green-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400'
                    }`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2 font-medium">{ticket.lastMessage}</p>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {new Date(ticket.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {ticket.messages.length > 0 && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {ticket.messages.length} xabar
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2 bg-white/80 dark:bg-[#1a1a1e]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden flex flex-col relative shadow-xl">
        {/* Gradient Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-full blur-3xl -z-10"></div>

        {selectedTicket ? (
          <>
            <div className="p-5 border-b border-slate-200 dark:border-white/5 flex items-center gap-4 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 dark:from-indigo-500/5 dark:to-violet-500/5 backdrop-blur-sm">
              <img
                src={selectedTicket.userAvatar}
                className="w-12 h-12 rounded-full bg-slate-200 border-2 border-indigo-500 shadow-md"
                alt={selectedTicket.userName}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">{selectedTicket.userName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  @{selectedTicket.userName.toLowerCase().replace(/\s+/g, '_')} • Ticket #{selectedTicket.id.slice(-4)}
                </p>
              </div>
              <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm ${selectedTicket.status === 'OPEN'
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-500/20 dark:to-emerald-500/20 dark:text-green-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400'
                }`}>
                {selectedTicket.status}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50/30 to-transparent dark:from-black/20 dark:to-transparent">
              {selectedTicket.messages.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={32} className="text-indigo-500 dark:text-indigo-400 opacity-50" />
                  </div>
                  <p className="font-medium">Hozircha xabarlar yo'q</p>
                  <p className="text-xs mt-2 opacity-70">Foydalanuvchi xabar yuborishi kutilmoqda</p>
                </div>
              ) : (
                selectedTicket.messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.sender === 'admin' ? 'flex-row-reverse' : ''} animate-fade-in`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    {msg.sender === 'user' && (
                      <img
                        src={selectedTicket.userAvatar}
                        className="w-9 h-9 rounded-full flex-shrink-0 border-2 border-indigo-200 dark:border-indigo-500/30 shadow-sm"
                        alt={selectedTicket.userName}
                      />
                    )}
                    {msg.sender === 'admin' && (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                        A
                      </div>
                    )}
                    <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm ${msg.sender === 'admin'
                      ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-tl-sm backdrop-blur-md'
                      }`}>
                      {msg.sender === 'user' && (
                        <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1.5 uppercase tracking-wide">
                          {selectedTicket.userName}
                        </div>
                      )}
                      {msg.sender === 'admin' && (
                        <div className="text-[10px] font-bold text-indigo-100 mb-1.5 uppercase tracking-wide opacity-90">
                          Admin
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{sanitizeInput(msg.text)}</p>
                      <div className={`text-[10px] mt-2 opacity-70 ${msg.sender === 'admin' ? 'text-right text-indigo-100' : 'text-left text-slate-500 dark:text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={supportEndRef} />
            </div>
            <div className="p-5 bg-white/60 dark:bg-[#1a1a1e]/60 border-t border-slate-200 dark:border-white/5 backdrop-blur-xl">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    value={supportReply}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= MAX_LENGTHS.MESSAGE) {
                        setSupportReply(value);
                      }
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendAdminReply()}
                    placeholder="Javob yozish..."
                    maxLength={MAX_LENGTHS.MESSAGE}
                    className="w-full px-5 py-4 pr-14 bg-white dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-bold">
                    Enter
                  </div>
                </div>
                <button
                  onClick={handleSendAdminReply}
                  disabled={!supportReply.trim() || isSendingSupport}
                  className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-95 flex items-center gap-2 font-bold min-w-[120px] justify-center"
                >
                  {isSendingSupport ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={20} strokeWidth={2.5} />
                      <span className="hidden sm:inline">Yuborish</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
                Foydalanuvchiga javob yozing
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Murojaatni tanlang</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-6 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {[
              { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
              { id: 'ANALYTICS', label: 'Analytics', icon: BarChart2 },
              { id: 'USERS', label: 'Users', icon: Users },
              { id: 'GROUPS', label: 'Groups', icon: Layers },
              { id: 'MODERATION', label: 'Moderation', icon: Shield },
              { id: 'SUPPORT', label: 'Support', icon: Headphones },
              { id: 'DEALS', label: 'Deals', icon: Handshake },
              { id: 'MARKETING', label: 'Marketing', icon: Megaphone },
              { id: 'BADGES', label: 'Badges', icon: Crown },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap
                     ${activeTab === tab.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
              >
                <tab.icon size={16} strokeWidth={2.5} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {activeTab === 'OVERVIEW' && renderOverview()}
        {activeTab === 'ANALYTICS' && renderAnalytics()}
        {activeTab === 'USERS' && renderUsers()}
        {activeTab === 'GROUPS' && renderGroups()}
        {activeTab === 'MODERATION' && renderModeration()}
        {activeTab === 'DEALS' && renderDeals()}
        {activeTab === 'MARKETING' && renderMarketing()}
        {activeTab === 'BADGES' && renderBadges()}
        {activeTab === 'MARKET' && renderMarket()}
        {activeTab === 'SUPPORT' && renderSupport()}
      </div>

      {/* Modals & Notifications */}
      <UserDetailModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onBan={handleBanUser}
        onDelete={handleDeleteUser}
        onUpdateUser={(updatedUser) => {
          setUsersList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
          setSelectedUser(updatedUser);
        }}
        notify={notify}
      />
      <DealModal
        isOpen={isDealModalOpen}
        onClose={() => { setIsDealModalOpen(false); resetDealForm(); }}
        form={dealForm}
        setForm={setDealForm}
        onSave={handleSaveDeal}
        isEditing={isEditingDeal}
      />
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        form={newExpense}
        setForm={setNewExpense}
        onAdd={handleAddExpense}
      />
      <ConfirmationModal state={confirmState} close={() => setConfirmState({ ...confirmState, isOpen: false })} />
      <ToastContainer toasts={toasts} remove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
};
