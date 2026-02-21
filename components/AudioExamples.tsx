/**
 * Audio qo'shishning barcha usullari - Misollar
 */

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

// Import audio files
import rainSound from '@/src/assets/sounds/rain.mp3';
import fireSound from '@/src/assets/sounds/fire.mp3';
import forestSound from '@/src/assets/sounds/forest.mp3';

// ============================================
// USUL 1: HTML5 <audio> tegi
// ============================================
export const Method1_HTML5Audio: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-2">Usul 1: HTML5 &lt;audio&gt; tegi</h3>
      <audio
        ref={audioRef}
        src={rainSound}
        loop
        preload="auto"
        className="w-full"
        controls
      />
    </div>
  );
};

// ============================================
// USUL 2: useRef + useEffect Pattern
// ============================================
export const Method2_UseRefPattern: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(rainSound);
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-2">Usul 2: useRef + useEffect Pattern</h3>
      <button
        onClick={togglePlay}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        {isPlaying ? ' Pause' : ' Play'}
      </button>
    </div>
  );
};

// ============================================
// USUL 3: Multiple Audio Manager
// ============================================
export const Method3_MultipleAudio: React.FC = () => {
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const sounds = [
    { id: 'rain', name: 'Yomg\'ir', url: rainSound },
    { id: 'fire', name: 'Olov', url: fireSound },
    { id: 'forest', name: 'O\'rmon', url: forestSound },
  ];

  const playSound = (soundId: string, url: string) => {
    // Barcha audio'larni to'xtatish
    audioRefs.current.forEach(audio => audio.pause());

    // Cache'dan olish yoki yangi yaratish
    let audio = audioRefs.current.get(soundId);
    if (!audio) {
      audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0.5;
      audioRefs.current.set(soundId, audio);
    }

    audio.play();
    setSelectedSound(soundId);
  };

  const stopSound = () => {
    audioRefs.current.forEach(audio => audio.pause());
    setSelectedSound(null);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-2">Usul 3: Multiple Audio Manager</h3>
      <div className="flex gap-2">
        {sounds.map(sound => (
          <button
            key={sound.id}
            onClick={() => playSound(sound.id, sound.url)}
            className={`px-3 py-1 rounded ${
              selectedSound === sound.id
                ? 'bg-green-500 text-white'
                : 'bg-gray-200'
            }`}
          >
            {sound.name}
          </button>
        ))}
        <button
          onClick={stopSound}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Stop
        </button>
      </div>
    </div>
  );
};

// ============================================
// USUL 4: Audio Manager Class (Custom)
// ============================================
import { audioManager } from '../utils/AudioManager';

export const Method4_AudioManagerClass: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Audio'larni yuklash
    audioManager.load(rainSound, 'rain');
    audioManager.load(fireSound, 'fire');
    audioManager.load(forestSound, 'forest');

    return () => {
      audioManager.cleanup();
    };
  }, []);

  const playRain = async () => {
    await audioManager.play('rain', { loop: true });
    setIsPlaying(true);
  };

  const playFire = async () => {
    await audioManager.play('fire', { loop: true });
    setIsPlaying(true);
  };

  const stop = () => {
    audioManager.stopAll();
    setIsPlaying(false);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-2">Usul 4: Audio Manager Class</h3>
      <div className="flex gap-2">
        <button
          onClick={playRain}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          Rain
        </button>
        <button
          onClick={playFire}
          className="px-3 py-1 bg-orange-500 text-white rounded"
        >
          Fire
        </button>
        <button
          onClick={stop}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Stop
        </button>
      </div>
    </div>
  );
};

// ============================================
// USUL 5: Dynamic Import Pattern
// ============================================
export const Method5_DynamicImport: React.FC = () => {
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const soundModules = {
    rain: () => import('@/src/assets/sounds/rain.mp3'),
    fire: () => import('@/src/assets/sounds/fire.mp3'),
    forest: () => import('@/src/assets/sounds/forest.mp3'),
  };

  const loadAndPlay = async (soundName: keyof typeof soundModules) => {
    setIsLoading(true);
    try {
      const soundModule = await soundModules[soundName]();
      const audioUrl = soundModule.default;

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audio.loop = true;
      audio.volume = 0.5;
      await audio.play();

      audioRef.current = audio;
      setSelectedSound(soundName);
    } catch (error) {
      console.error('Audio load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-2">Usul 5: Dynamic Import Pattern</h3>
      <div className="flex gap-2">
        <button
          onClick={() => loadAndPlay('rain')}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Rain'}
        </button>
        <button
          onClick={() => loadAndPlay('fire')}
          disabled={isLoading}
          className="px-3 py-1 bg-orange-500 text-white rounded disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Fire'}
        </button>
      </div>
    </div>
  );
};

// ============================================
// BARCHA MISOLLAR
// ============================================
export const AllAudioMethods: React.FC = () => {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Audio Qo'shishning Barcha Usullari</h2>
      
      <Method1_HTML5Audio />
      <Method2_UseRefPattern />
      <Method3_MultipleAudio />
      <Method4_AudioManagerClass />
      <Method5_DynamicImport />
    </div>
  );
};

