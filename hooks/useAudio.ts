import { useEffect, useRef, useState } from 'react';

interface UseAudioOptions {
  volume?: number;
  loop?: boolean;
  preload?: boolean;
  onError?: (error: Error) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

/**
 * Audio fayllar bilan ishlash uchun professional hook
 * 
 * @param src - Audio fayl URL (import qilingan fayl yoki string path)
 * @param options - Audio sozlamalari
 * @returns Audio boshqaruv funksiyalari va holat
 * 
 * @example
 * ```tsx
 * import rainSound from '@/src/assets/sounds/rain.mp3';
 * 
 * const { play, pause, stop, isPlaying, volume, setVolume } = useAudio(rainSound, {
 *   volume: 0.5,
 *   loop: true
 * });
 * ```
 */
export function useAudio(
  src: string | null,
  options: UseAudioOptions = {}
) {
  const {
    volume: initialVolume = 0.5,
    loop = false,
    preload = true,
    onError,
    onPlay,
    onPause,
    onEnded,
  } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(initialVolume);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Audio element yaratish va sozlash
  useEffect(() => {
    if (!src) {
      // Agar src bo'sh bo'lsa, audio element yaratmaymiz
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    // Yangi audio element yaratish
    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = initialVolume;
    audio.preload = preload ? 'auto' : 'none';

    // Event listenerlar
    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = (e: ErrorEvent) => {
      const error = new Error(`Audio load error: ${e.message || 'Unknown error'}`);
      setError(error);
      setIsLoading(false);
      setIsPlaying(false);
      onError?.(error);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    // Event listenerlarni qo'shish
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as EventListener);
    audio.addEventListener('loadstart', handleLoadStart);

    // Audio elementni saqlash
    audioRef.current = audio;

    // Cleanup
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as EventListener);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.pause();
      audio.src = '';
    };
  }, [src, loop, initialVolume, preload, onError, onPlay, onPause, onEnded]);

  // Volume o'zgartirish
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Play funksiyasi
  const play = async () => {
    if (!audioRef.current || !src) return;

    try {
      setIsLoading(true);
      const playPromise = audioRef.current.play();
      
      // playPromise null, undefined, yoki Promise bo'lishi mumkin
      if (playPromise && typeof playPromise === 'object' && typeof playPromise.then === 'function') {
        await playPromise;
      }
    } catch (error) {
      const err = error instanceof Error 
        ? error 
        : new Error('Failed to play audio');
      setError(err);
      setIsPlaying(false);
      setIsLoading(false);
      onError?.(err);
    }
  };

  // Pause funksiyasi
  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  // Stop funksiyasi (pause + reset)
  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Volume o'zgartirish funksiyasi
  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
  };

  // Audio vaqtini o'zgartirish
  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Joriy vaqtni olish
  const getCurrentTime = () => {
    return audioRef.current?.currentTime || 0;
  };

  // Umumiy vaqtni olish
  const getDuration = () => {
    return audioRef.current?.duration || 0;
  };

  return {
    // Funksiyalar
    play,
    pause,
    stop,
    seek,
    setVolume,
    getCurrentTime,
    getDuration,
    
    // Holatlar
    isPlaying,
    isLoading,
    volume,
    error,
    
    // Audio element (advanced usage uchun)
    audio: audioRef.current,
  };
}

