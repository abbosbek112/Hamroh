/**
 * Audio qo'shishning eng yaxshi usuli - Misol komponent
 * 
 * Bu komponent useAudio hook'ni qanday ishlatishni ko'rsatadi
 */

import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../hooks';
import rainSound from '@/src/assets/sounds/rain.mp3';
import fireSound from '@/src/assets/sounds/fire.mp3';
import forestSound from '@/src/assets/sounds/forest.mp3';

const SOUNDS = [
  { id: 'rain', name: 'Yomg\'ir', url: rainSound },
  { id: 'fire', name: 'Olov', url: fireSound },
  { id: 'forest', name: 'O\'rmon', url: forestSound },
];

export const AudioExample: React.FC = () => {
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);

  // Tanlangan sound uchun audio hook
  const selectedSound = SOUNDS.find(s => s.id === selectedSoundId);
  const { play, pause, stop, isPlaying, isLoading, error, setVolume: setAudioVolume } = useAudio(
    selectedSound?.url || null,
    {
      volume,
      loop: true,
      onPlay: () => console.log('Audio started'),
      onPause: () => console.log('Audio paused'),
      onError: (err) => console.error('Audio error:', err),
    }
  );

  // Volume o'zgarganda audio volume'ni ham yangilash
  useEffect(() => {
    setAudioVolume(volume);
  }, [volume, setAudioVolume]);

  // Sound tanlanganda avtomatik play qilish
  useEffect(() => {
    if (selectedSoundId && !isPlaying) {
      play();
    }
  }, [selectedSoundId]); // Faqat sound o'zgarganda

  const handleSoundSelect = (soundId: string) => {
    if (selectedSoundId === soundId) {
      // Xuddi shu sound tanlangan bo'lsa, to'xtatish
      stop();
      setSelectedSoundId(null);
    } else {
      // Yangi sound tanlash
      stop(); // Eski sound'ni to'xtatish
      setSelectedSoundId(soundId);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
        Audio Misol
      </h2>

      {/* Sound selector */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400">
          Sound tanlang:
        </h3>
        <div className="flex gap-2">
          {SOUNDS.map((sound) => (
            <button
              key={sound.id}
              onClick={() => handleSoundSelect(sound.id)}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedSoundId === sound.id
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {sound.name}
            </button>
          ))}
        </div>
      </div>

      {/* Play/Pause controls */}
      {selectedSoundId && (
        <div className="mb-6 space-y-4">
          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-400 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {isLoading ? (
              <>Yuklanmoqda...</>
            ) : isPlaying ? (
              <>
                <Pause size={20} />
                To'xtatish
              </>
            ) : (
              <>
                <Play size={20} />
                Ijro etish
              </>
            )}
          </button>

          {/* Volume control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <Volume2 size={16} />
                Volume
              </span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              Xatolik: {error.message}
            </div>
          )}

          {/* Status */}
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Holat: {isLoading ? 'Yuklanmoqda...' : isPlaying ? 'Ijro etilmoqda' : 'To\'xtatilgan'}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm text-slate-600 dark:text-slate-400">
        <p className="font-semibold mb-2">Qanday ishlatish:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Sound tanlang (Yomg'ir, Olov, yoki O'rmon)</li>
          <li>Ijro etish tugmasini bosing</li>
          <li>Volume'ni sozlang</li>
        </ol>
      </div>
    </div>
  );
};

