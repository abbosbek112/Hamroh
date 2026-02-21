import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RotateCcw, Play, Pause, Volume2, CloudRain, Flame, Trees, Coffee, VolumeX, Upload } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { useGlobalAudio } from '../../contexts/AudioContext';
import { useFocus } from '../../contexts/FocusContext';
import { logger } from '../../utils/logger';
import { getAudioUrl } from '../../config/audioConfig';

export const FocusTimer: React.FC = () => {
  const { t } = useLanguage();
  const { notify } = useToast();
  const { play, pause, stop, isPlaying: globalIsPlaying, currentTrack, setVolume: setGlobalVolume } = useGlobalAudio();

  const {
    focusTime,
    isActive,
    focusMode,
    customMinutes,
    toggleTimer,
    resetTimer,
    setMode,
    setCustomMinutes,
    formatTime,
    initialTime
  } = useFocus();

  const [selectedSound, setSelectedSound] = useState<string>('none');
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // LocalStorage'dan custom audio'ni yuklash
  useEffect(() => {
    try {
      const savedCustomAudio = localStorage.getItem('hamroh_custom_audio');
      if (savedCustomAudio) {
        const audioData = JSON.parse(savedCustomAudio);

        // Base64 URL tekshirish
        if (audioData.url && audioData.url.startsWith('data:audio')) {
          setCustomAudioUrl(audioData.url);
          setCustomAudioName(audioData.name || 'Shaxsiy audio');
        } else {
          // Eski format (faqat URL) - yangilash
          if (savedCustomAudio.startsWith('data:audio')) {
            // Eski formatni yangi formatga o'girish
            const audioData = {
              url: savedCustomAudio,
              name: 'Shaxsiy audio',
              uploadedAt: Date.now()
            };
            localStorage.setItem('hamroh_custom_audio', JSON.stringify(audioData));
            setCustomAudioUrl(savedCustomAudio);
            setCustomAudioName('Shaxsiy audio');
          } else {
            // Noto'g'ri format - tozalash
            localStorage.removeItem('hamroh_custom_audio');
            localStorage.removeItem('hamroh_custom_audio_url'); // Eski key
          }
        }
      } else {
        // Eski format (hamroh_custom_audio_url) - yangilash
        const oldUrl = localStorage.getItem('hamroh_custom_audio_url');
        if (oldUrl && oldUrl.startsWith('data:audio')) {
          const audioData = {
            url: oldUrl,
            name: 'Shaxsiy audio',
            uploadedAt: Date.now()
          };
          localStorage.setItem('hamroh_custom_audio', JSON.stringify(audioData));
          localStorage.removeItem('hamroh_custom_audio_url');
          setCustomAudioUrl(oldUrl);
          setCustomAudioName('Shaxsiy audio');
        }
      }
    } catch (error) {
      logger.error('Failed to load custom audio:', error);
      // Xatolik bo'lsa, tozalash
      localStorage.removeItem('hamroh_custom_audio');
      localStorage.removeItem('hamroh_custom_audio_url');
    }
  }, []);

  // SOUND_CONFIG - useMemo bilan cache qilish
  const SOUND_CONFIG = useMemo(() => [
    { id: 'none', icon: VolumeX, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-white/10', url: null },
    { id: 'rain', icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20', url: getAudioUrl('rain') },
    { id: 'fire', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/20', url: getAudioUrl('fire') },
    { id: 'forest', icon: Trees, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/20', url: getAudioUrl('forest') },
    { id: 'cafe', icon: Coffee, color: 'text-amber-700 dark:text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/20', url: customAudioUrl }
  ], [customAudioUrl]);

  // Timer Logic


  // Global Audio Logic - Timer active bo'lganda audio'ni ijro etish
  useEffect(() => {
    const sound = SOUND_CONFIG.find(s => s.id === selectedSound);

    // Agar sound tanlanmagan yoki URL yo'q bo'lsa, audio'ni to'xtatish
    if (!sound?.url || selectedSound === 'none') {
      if (currentTrack) {
        pause();
      }
      return;
    }

    // Timer active bo'lsa, audio'ni ijro etish
    if (isActive) {
      // Faqat agar currentTrack o'zgarmagan bo'lsa play qilish
      // Bu audio tez-tez qayta boshidan boshlanishini oldini oladi
      if (currentTrack !== sound.url) {
        try {
          play(sound.url, { loop: true, volume: 0.5 });
        } catch (error) {
          logger.error('Failed to play audio:', error);
          notify(t('intizom.focus.audio_error'), 'error');
        }
      }
    } else {
      // Timer to'xtatilgan bo'lsa, audio'ni to'xtatish
      if (currentTrack === sound.url) {
        pause();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, selectedSound, currentTrack]);

  // Component unmount bo'lganda audio'ni to'xtatish
  useEffect(() => {
    return () => {
      const sound = SOUND_CONFIG.find(s => s.id === selectedSound);
      if (sound?.url && currentTrack === sound.url) {
        stop();
      }
    };
  }, [selectedSound, currentTrack, stop]);



  // Custom audio fayl tanlash
  const handleCustomAudioSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Faqat audio fayllarni qabul qilish
    if (!file.type.startsWith('audio/')) {
      notify(t('intizom.focus.select_audio'), 'error');
      return;
    }

    // Fayl hajmini tekshirish (max 5MB - localStorage limit uchun)
    if (file.size > 5 * 1024 * 1024) {
      notify(t('intizom.focus.file_size_error'), 'error');
      return;
    }

    try {
      // Faylni base64 formatiga o'girish
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Url = e.target?.result as string;

        // Audio ma'lumotlarini saqlash
        const audioData = {
          url: base64Url,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: Date.now()
        };

        // LocalStorage'ga saqlash
        localStorage.setItem('hamroh_custom_audio', JSON.stringify(audioData));

        // State'ni yangilash
        setCustomAudioUrl(base64Url);
        setCustomAudioName(file.name);

        notify(t('intizom.focus.file_saved', { name: file.name }), 'success');

        // Agar cafe tanlangan bo'lsa, avtomatik play qilish
        if (selectedSound === 'cafe' && isActive) {
          play(base64Url, { loop: true, volume: 0.5 });
        } else {
          // Avtomatik cafe'ni tanlash
          setSelectedSound('cafe');
        }
      };
      reader.onerror = () => {
        notify(t('intizom.focus.read_error'), 'error');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      logger.error('Custom audio load error:', error);
      notify(t('intizom.focus.upload_error'), 'error');
    }

    // Input'ni tozalash (xuddi shu faylni qayta tanlash uchun)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cafe iconchasiga click qilganda
  const handleCafeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Agar custom audio mavjud bo'lsa, oddiy tanlash
    if (customAudioUrl) {
      setSelectedSound('cafe');
      return;
    }

    // Agar custom audio yo'q bo'lsa, file input ochish
    if (fileInputRef.current) {
      // Kichik kechikish - ba'zi brauzerlar uchun kerak
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
    } else {
      notify(t('intizom.focus.input_not_found'), 'error');
    }
  };

  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-6 lg:py-12 min-h-[60vh]">
      <div className="relative mb-12 group">
        <div className={`absolute inset-0 rounded-full blur-[100px] transition-all duration-1000 ${isActive ? 'bg-violet-600/40 scale-110' : 'bg-blue-600/10 scale-90'}`}></div>
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
          <div className="absolute inset-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-200 dark:text-white/5" />
              <circle
                cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" fill="transparent"
                pathLength="100"
                strokeDasharray="100"
                strokeDashoffset={100 * (1 - focusTime / (initialTime || 1))}
                strokeLinecap="round"
                className={`text-violet-500 transition-all duration-1000 ease-linear ${isActive ? 'text-violet-500' : 'text-violet-400'}`}
              />
            </svg>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <span className="text-7xl sm:text-8xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter drop-shadow-2xl">
              {formatTime(focusTime)}
            </span>
            <span className={`text-sm sm:text-base font-bold mt-4 tracking-[0.3em] uppercase transition-colors ${isActive ? 'text-violet-500 animate-pulse' : 'text-slate-400'}`}>
              {isActive ? t('intizom.focus.status_focus') : t('intizom.focus.status_ready')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={resetTimer}
            className="p-4 rounded-full bg-white/70 dark:bg-white/5 text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-95 shadow-sm backdrop-blur-md"
            title={t('intizom.focus.restart')}
          >
            <RotateCcw size={24} />
          </button>

          <button
            onClick={toggleTimer}
            className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 active:scale-95 border-4 border-white/10
                  ${isActive
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/40'
                : 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/40'}`
            }
          >
            {isActive ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-1" />}
          </button>
          <div className="w-[56px]"></div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full px-6">
          <button
            onClick={() => setMode('POMODORO')}
            className={`relative overflow-hidden px-6 py-4 rounded-2xl text-sm font-bold transition-all border group backdrop-blur-md
                  ${focusMode === 'POMODORO'
                ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/25'
                : 'bg-white/70 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-white/60 dark:border-white/5 hover:border-violet-500/30'}`}
          >
            <span className="relative z-10 flex flex-col items-center gap-1">
              <span>{t('intizom.focus.pomodoro')}</span>
              <span className={`text-xs ${focusMode === 'POMODORO' ? 'text-violet-200' : 'text-slate-400'}`}>25 {t('intizom.focus.minutes')}</span>
            </span>
            {focusMode === 'POMODORO' && <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-30"></div>}
          </button>

          <div
            onClick={() => {
              if (focusMode !== 'CUSTOM') {
                setMode('CUSTOM');
              }
            }}
            className={`relative overflow-hidden px-6 py-4 rounded-2xl text-sm font-bold transition-all border cursor-pointer group backdrop-blur-md
                  ${focusMode === 'CUSTOM'
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25'
                : 'bg-white/70 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-white/60 dark:border-white/5 hover:border-blue-500/30'}`}
          >
            <div className="relative z-10 flex flex-col items-center gap-1">
              <span>{t('intizom.focus.personal')}</span>
              <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(e) => {
                    const val = Math.min(180, Math.max(1, parseInt(e.target.value) || 0));
                    setCustomMinutes(val);
                  }}
                  className={`w-12 text-lg font-bold bg-transparent text-center outline-none border-b-2 focus:border-white/80 transition-all py-1 ${focusMode === 'CUSTOM' ? 'text-white border-blue-300/50' : 'text-slate-700 dark:text-slate-200 border-slate-300 dark:border-white/20'}`}
                />
                <span className={`text-xs ${focusMode === 'CUSTOM' ? 'text-blue-200' : 'text-slate-400'}`}>{t('intizom.focus.minutes')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-6 pt-2">
          <div className="flex flex-col gap-3 p-4 bg-white/40 dark:bg-white/5 rounded-[2rem] border border-white/60 dark:border-white/5 backdrop-blur-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center flex items-center justify-center gap-2">
              <Volume2 size={12} /> {t('intizom.focus.atmosphere')}
            </span>
            <div className="flex justify-between items-center">
              {SOUND_CONFIG.map((sound) => (
                <div key={sound.id} className="relative">
                  <button
                    onClick={(e) => {
                      if (sound.id === 'cafe') {
                        handleCafeClick(e);
                      } else {
                        setSelectedSound(sound.id);
                      }
                    }}
                    title={sound.id === 'cafe'
                      ? (customAudioUrl ? `${t(`intizom.focus.sounds.${sound.id}`)} - ${customAudioName || ''}` : t('intizom.focus.upload_tooltip'))
                      : t(`intizom.focus.sounds.${sound.id}`)
                    }
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group cursor-pointer
                              ${selectedSound === sound.id
                        ? `${sound.bg} ${sound.color} shadow-lg scale-110 border-2 border-current`
                        : 'bg-white/50 dark:bg-white/5 text-slate-400 hover:bg-white dark:hover:bg-white/10'
                      }`}
                  >
                    {sound.id === 'cafe' && !customAudioUrl ? (
                      <Upload size={18} strokeWidth={selectedSound === sound.id ? 2.5 : 2} />
                    ) : (
                      <sound.icon size={20} strokeWidth={selectedSound === sound.id ? 2.5 : 2} className={selectedSound === sound.id && isActive && globalIsPlaying ? 'animate-pulse' : ''} />
                    )}
                    {selectedSound === sound.id && isActive && globalIsPlaying && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#1a1a1e]"></span>
                    )}
                    {sound.id === 'cafe' && customAudioUrl && (
                      <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white dark:border-[#1a1a1e]"></span>
                    )}
                  </button>
                  {sound.id === 'cafe' && selectedSound === sound.id && customAudioUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Custom audio'ni o'chirish
                        setCustomAudioUrl(null);
                        setCustomAudioName(null);
                        localStorage.removeItem('hamroh_custom_audio');
                        localStorage.removeItem('hamroh_custom_audio_url'); // Eski key
                        if (selectedSound === 'cafe') {
                          setSelectedSound('none');
                          stop();
                        }
                        notify(t('intizom.focus.audio_deleted'), 'success');
                      }}
                      className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition-all z-10"
                      title="Shaxsiy audioni o'chirish"
                    >
                      ×
                    </button>
                  )}
                  {sound.id === 'cafe' && customAudioName && (
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-[10px] text-slate-500 dark:text-slate-400 max-w-[80px] truncate">
                      {customAudioName}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleCustomAudioSelect}
              style={{ display: 'none' }}
              aria-label="Shaxsiy audio fayl yuklash"
            />
          </div>
        </div>
      </div>
    </div>
  );
};