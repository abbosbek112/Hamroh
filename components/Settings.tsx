
import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon, Camera, Trash2, LogOut, Loader2,
  Check, X, Shield, Star, Lock, Copy, Moon, Sun, Globe, Calendar, Mail,
  Palette, Sparkles
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { ACHIEVEMENTS_LIST, STORE_ITEMS } from '../constants';
import { compressImage } from '../utils/helpers';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { logger } from '../utils/logger';
import { notificationService } from '../utils/notifications';
import { ShareableAchievement } from './ShareableAchievement';
import { Bell, Share2 } from 'lucide-react';
import { Badge } from '../types';

const GlobalConfig = {
  maxImageSize: 5 * 1024 * 1024, // 5MB
};

interface SettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  user,
  onUpdateUser,
  onLogout,
  toggleTheme,
  isDarkMode
}) => {
  const { t, setLanguage } = useLanguage();
  const { notify } = useToast();

  const [formData, setFormData] = useState<User>(user);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState('');


  const [completeness, setCompleteness] = useState(0);
  const [shareBadge, setShareBadge] = useState<Badge | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let filled = 0;
    const fields = ['name', 'username', 'avatar', 'bio', 'email'];
    fields.forEach(f => {
      if (formData[f as keyof User]) filled++;
    });
    setCompleteness(Math.round((filled / fields.length) * 100));
  }, [formData]);

  useEffect(() => {
    if (formData.username === user.username) {
      setUsernameStatus('idle');
      return;
    }

    const isValidFormat = /^[a-zA-Z0-9_]+$/.test(formData.username);
    if (!isValidFormat || formData.username.length < 5) {
      setUsernameStatus('invalid');
      setUsernameError(t('settings.username_format'));
      return;
    }

    if (['admin', 'hamroh', 'root'].includes(formData.username.toLowerCase())) {
      setUsernameStatus('invalid');
      setUsernameError(t('settings.username_taken'));
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const isAvailable = await api.checkUsername(formData.username);
      if (isAvailable) {
        setUsernameStatus('valid');
        setUsernameError('');
      } else {
        setUsernameStatus('invalid');
        setUsernameError(t('settings.username_taken'));
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.username, user.username, t]);

  useEffect(() => {
    const isChanged = JSON.stringify(formData) !== JSON.stringify(user);
    setIsDirty(isChanged);
  }, [formData, user]);

  // Auto-save effect with debounce
  useEffect(() => {
    // Don't auto-save if:
    // - Data hasn't changed
    // - Currently saving
    if (!isDirty || isSaving) return;

    // If username changed, wait for validation to complete
    // Only save if username is valid or hasn't changed
    if (formData.username !== user.username) {
      if (usernameStatus === 'invalid' || usernameStatus === 'checking') {
        return; // Wait for validation
      }
    }

    // Debounce auto-save - wait 1 second after last change
    const timer = setTimeout(async () => {
      try {
        setIsSaving(true);
        const updatedUser = await api.updateUser(formData);
        onUpdateUser(updatedUser);
        setIsDirty(false);
        // No notification for auto-save to avoid spam
      } catch (error: unknown) {
        logger.error("Auto-save user settings error:", error);
        notify(t('common.error'), "error");
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, isDirty, isSaving, usernameStatus, user.username, onUpdateUser, notify, t]);

  const handleInputChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLanguageChange = async (lang: string) => {
    const newLang = lang.toLowerCase() as 'uz' | 'ru' | 'en';
    setLanguage(newLang);
    const updatedUser: User = { ...formData, language: newLang };
    setFormData(updatedUser);
    try {
      await api.updateUser(updatedUser);
      onUpdateUser(updatedUser);
    } catch (e: unknown) {
      logger.error("Language auto-save failed", e);
      notify(t('common.error'), "error");
    }
  };

  const handleAppThemeChange = async (themeKey: string | undefined) => {
    setIsSaving(true);
    try {
      const updatedFormData: User = { ...formData, appTheme: themeKey as any };
      setFormData(updatedFormData);
      const updatedUser = await api.updateUser(updatedFormData);
      onUpdateUser(updatedUser);
      notify(t('settings.theme_updated') || 'Mavzu yangilandi', 'success');
    } catch (e: unknown) {
      logger.error("App theme change failed", e);
      notify(t('common.error'), "error");
    } finally {
      setIsSaving(false);
    }
  };



  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > GlobalConfig.maxImageSize) {
      notify(t('settings.image_size_error'), "error");
      return;
    }

    setIsSaving(true);
    try {
      const compressedBase64 = await compressImage(file);
      const updatedFormData = { ...formData, avatar: compressedBase64 };
      setFormData(updatedFormData);

      // Auto-save avatar immediately
      const updatedUser = await api.updateUser(updatedFormData);
      onUpdateUser(updatedUser);
      // No notification - avatar change is visible immediately
    } catch (error: unknown) {
      logger.error("Avatar save error:", error);
      notify(t('common.error'), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarRemove = async () => {
    setIsSaving(true);
    try {
      const updatedFormData = { ...formData, avatar: '' };
      setFormData(updatedFormData);

      // Auto-save avatar removal immediately
      const updatedUser = await api.updateUser(updatedFormData);
      onUpdateUser(updatedUser);
      // No notification - avatar removal is visible immediately
    } catch (error: unknown) {
      logger.error("Avatar remove error:", error);
      notify(t('common.error'), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEquipBadge = async (badgeId: string) => {
    if (user.badges.includes(badgeId)) {
      setIsSaving(true);
      try {
        const updatedFormData = { ...formData, selectedBadgeId: badgeId };
        setFormData(updatedFormData);

        // Auto-save badge selection immediately
        const updatedUser = await api.updateUser(updatedFormData);
        onUpdateUser(updatedUser);
      } catch (error: unknown) {
        logger.error("Badge equip error:", error);
        notify(t('common.error'), "error");
      } finally {
        setIsSaving(false);
      }
    }
  };


  const copyProfileLink = () => {
    navigator.clipboard.writeText(`hamroh.ai/${formData.username}`);
    notify(t('settings.link_copied'), "info");
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* --- LEFT COLUMN: PROFILE CARD --- */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1a1a1e] border border-gray-200 dark:border-white/10 rounded-[2.5rem] p-0 flex flex-col items-center text-center shadow-sm relative overflow-hidden group">
            <div className="h-32 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 dark:from-violet-900 dark:to-fuchsia-900 relative">
              <div className="absolute bottom-0 left-0 h-1.5 bg-black/20 w-full">
                <div
                  className="h-full bg-green-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                  style={{ width: `${completeness}%` }}
                ></div>
              </div>
            </div>

            <div className="relative -mt-16 mb-4 z-10">
              <div className="w-32 h-32 rounded-full p-1.5 bg-white dark:bg-[#1a1a1e]">
                <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative border border-gray-200 dark:border-white/10">
                  {formData.avatar && (
                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>

              {/* Avatar Actions */}
              {/* Upload Avatar Button - Left side */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 left-1 p-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-white dark:border-[#0a0a0c] z-10"
                title="Avatar yuklash"
              >
                <Camera size={16} />
              </button>

              {/* Remove Avatar Button - Right side (Only show when avatar exists) */}
              {formData.avatar && (
                <button
                  onClick={handleAvatarRemove}
                  className="absolute bottom-1 right-1 p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-white dark:border-[#0a0a0c] z-10"
                  title="Avatar olib tashlash"
                >
                  <Trash2 size={14} />
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
            </div>

            <div className="mb-8 px-6 relative z-10">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                {formData.name}
                {formData.selectedBadgeId && (
                  <span title="Equipped Badge">{ACHIEVEMENTS_LIST.find(b => b.id === formData.selectedBadgeId)?.icon}</span>
                )}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">@{formData.username}</p>
              <p className="text-xs text-slate-400 font-semibold mt-2 py-1 px-3 bg-slate-100 dark:bg-white/5 rounded-full inline-block">
                {t('settings.profile_completeness').replace('%', completeness.toString())}
              </p>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: SETTINGS FORM --- */}
        <div className="lg:col-span-2 space-y-8">

          <section className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Sun size={20} className="text-orange-500" /> {t('settings.preferences') || 'Afzalliklar'}
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={toggleTheme}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">{t('settings.theme')}</span>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    {isDarkMode ? <Moon size={16} className="text-blue-400" /> : <Sun size={16} className="text-orange-400" />}
                    {isDarkMode ? 'Dark' : 'Light'}
                  </div>
                </button>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Globe size={16} /> {t('settings.language')}
                  </span>
                  <div className="flex gap-1">
                    {['UZ', 'RU', 'EN'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${formData.language === lang.toLowerCase()
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                          }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Unique Theme Selection */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 block">
                  {t('settings.app_theme') || 'Ilova Mavzulari'}
                </label>
                <div className="flex flex-wrap gap-3">
                  {/* Default Theme */}
                  <button
                    onClick={() => handleAppThemeChange(undefined)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border
                      ${!user.appTheme
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-indigo-300'}`}
                  >
                    <Sparkles size={16} /> Classic
                  </button>

                  {/* Purchased Themes */}
                  {STORE_ITEMS.filter(item => item.type === 'THEME').map(themeItem => {
                    const isOwned = !themeItem.isPremium || user.inventory?.includes(themeItem.id);
                    if (!isOwned) return null;

                    return (
                      <button
                        key={themeItem.id}
                        onClick={() => handleAppThemeChange(themeItem.value)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border
                          ${user.appTheme === themeItem.value
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-indigo-300'}`}
                      >
                        <Palette size={16} /> {t(themeItem.name)}
                      </button>
                    );
                  })}

                  {/* Locked Themes Hint */}
                  {STORE_ITEMS.filter(item => item.type === 'THEME' && item.isPremium && !user.inventory?.includes(item.id)).length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 text-[10px] font-bold text-slate-400 border border-dashed border-slate-200 dark:border-white/10">
                      <Lock size={12} /> {t('settings.locked_themes') || 'Boshqa mavzular do\'konda'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] p-8 shadow-sm mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Bell size={20} className="text-indigo-500" /> {t('settings.notifications')}
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{t('settings.enable_notifications')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('settings.notifications_desc')}</p>
              </div>
              <button
                onClick={async () => {
                  const granted = await notificationService.requestPermission();
                  if (granted) {
                    notify(t('settings.notifications_enabled'), "success");
                    notificationService.send(t('settings.notification_welcome_title'), { body: t('settings.notification_welcome_body') });
                  } else {
                    notify(t('settings.permission_denied'), "error");
                  }
                }}
                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
              >
                {notificationService.getPermission() === 'granted' ? `${t('common.active')} ✅` : t('common.enable')}
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <UserIcon size={20} className="text-blue-500" /> {t('settings.personal_info')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{t('settings.name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={user.email || ''}
                    readOnly
                    disabled
                    placeholder="example@mail.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                  {t('settings.email_future')}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{t('settings.age')}</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={formData.age || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      handleInputChange('age', val ? parseInt(val) : undefined);
                    }}
                    placeholder="25"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{t('settings.bio')}</label>
              <textarea
                rows={3}
                value={formData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none"
                placeholder={t('settings.bio_placeholder')}
                maxLength={70}
              />
              <p className="text-right text-[10px] text-slate-400">{formData.bio?.length || 0}/70</p>
            </div>
          </section>

          <section className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Shield size={20} className="text-green-500" /> {t('settings.account_security')}
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">{t('settings.username')}</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
                  className={`w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-black/20 border rounded-xl font-medium text-slate-900 dark:text-white outline-none transition-all ${usernameStatus === 'invalid' ? 'border-red-500 focus:ring-red-500' :
                    usernameStatus === 'valid' ? 'border-green-500 focus:ring-green-500' :
                      'border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-violet-500'
                    }`}
                />
                <div className="absolute right-4 top-3.5">
                  {usernameStatus === 'checking' && <Loader2 size={18} className="animate-spin text-slate-400" />}
                  {usernameStatus === 'valid' && <Check size={18} className="text-green-500" />}
                  {usernameStatus === 'invalid' && <X size={18} className="text-red-500" />}
                </div>
              </div>

              {usernameStatus === 'invalid' && <p className="text-xs text-red-500 font-medium">{usernameError}</p>}
              {usernameStatus === 'valid' && (
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-xs text-green-600 font-medium">{t('settings.username_available')}</p>
                  <button onClick={copyProfileLink} className="text-xs flex items-center gap-1 text-slate-400 hover:text-violet-600">
                    <Copy size={12} /> {t('settings.copy_link')}
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              {t('settings.badges')} <Star size={18} className="text-yellow-500 fill-yellow-500" />
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ACHIEVEMENTS_LIST.map((badge) => {
                const isUnlocked = user.badges.includes(badge.id);
                const isSelected = formData.selectedBadgeId === badge.id;

                return (
                  <div
                    key={badge.id}
                    className={`relative p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center gap-2 group
                      ${isUnlocked
                        ? isSelected
                          ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-500 ring-2 ring-violet-500/20'
                          : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-violet-300'
                        : 'bg-slate-50 dark:bg-black/20 border-transparent opacity-60 grayscale'
                      }
                    `}
                  >
                    <div
                      onClick={() => isUnlocked && handleEquipBadge(badge.id)}
                      className={`w-full flex flex-col items-center ${isUnlocked ? 'cursor-pointer' : ''}`}
                    >
                      <div className="text-3xl mb-1">
                        {(!isUnlocked && badge.isSecret) ? <Lock size={24} className="text-slate-400" /> : badge.icon}
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {(!isUnlocked && badge.isSecret) ? '???' : t(`badges.${badge.id}.name`)}
                      </p>
                    </div>

                    {/* Share Button (Only for unlocked badges) */}
                    {isUnlocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareBadge(badge);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 rounded-full text-indigo-500 transition-colors opacity-0 group-hover:opacity-100 z-10"
                        title="Ulashish"
                      >
                        <Share2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Share Modal */}
          {shareBadge && (
            <ShareableAchievement
              user={user}
              badge={shareBadge}
              onClose={() => setShareBadge(null)}
            />
          )}

          <div className="mt-8 mb-6 p-4 rounded-2xl border border-gray-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-white/5 shadow-sm">
            <button
              onClick={onLogout}
              className="px-6 py-3 rounded-xl text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2 text-sm"
            >
              <LogOut size={18} /> <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>

            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 size={18} className="animate-spin" />
                <span>{t('common.saving')}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
