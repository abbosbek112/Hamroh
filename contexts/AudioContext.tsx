/**
 * Global Audio Context
 * 
 * Barcha komponentlardan audio'ni boshqarish uchun
 */

import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface AudioContextType {
  play: (url: string, options?: { loop?: boolean; volume?: number }) => void;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  isPlaying: boolean;
  currentTrack: string | null;
  volume: number;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Event handlerlar
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setIsPlaying(false);
      logger.error('Audio playback error');
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrack]);

  const play = useCallback((url: string, options?: { loop?: boolean; volume?: number }) => {
    // URL validation
    if (!url || typeof url !== 'string' || url.trim() === '') {
      logger.error('[AudioContext] Invalid audio URL:', url);
      return;
    }

    // Debug log (faqat development'da)
    logger.debug('[AudioContext] Playing audio:', url.substring(0, 50) + '...', options);

    // Agar xuddi shu track bo'lsa va audio allaqachon ijro etilmoqdami, faqat pause qilish
    if (currentTrack === url && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Agar pause bo'lsa, qayta play qilish
        try {
          const playPromise = audioRef.current.play();
          if (playPromise && typeof playPromise === 'object' && typeof playPromise.catch === 'function') {
            playPromise.catch((error: any) => {
              logger.error('[AudioContext] Failed to play audio (toggle):', error);
            });
          }
        } catch (error) {
          logger.error('[AudioContext] Failed to play audio (toggle, sync):', error);
        }
      }
      return;
    }

    // Agar xuddi shu track bo'lsa lekin audio element yo'q bo'lsa, yangi yaratish
    // Yoki yangi track bo'lsa, eski audio'ni to'xtatish
    if (audioRef.current) {
      // Eski audio'ni to'xtatish
      try {
        audioRef.current.pause();
      } catch (e) {
        // Ignore pause errors
      }
    }

    // Audio element mavjud emas yoki yangi URL bo'lsa
    if (!audioRef.current || currentTrack !== url) {
      // Yangi audio element yaratish
      const audio = new Audio(url);
      audio.loop = options?.loop || false;
      audio.volume = options?.volume ?? volume;
      audio.preload = 'auto';

      // Error handling
      audio.addEventListener('error', (e) => {
        logger.error('[AudioContext] Audio load/play error:', {
          url: url.substring(0, 50),
          code: audio.error?.code,
          message: audio.error?.message,
        });
        setIsPlaying(false);
      }, { once: true });

      // Success handler
      audio.addEventListener('canplaythrough', () => {
        logger.debug('[AudioContext] Audio ready to play:', url.substring(0, 50) + '...');
      }, { once: true });

      audioRef.current = audio;
      setCurrentTrack(url);
    } else {
      // Xuddi shu audio element, faqat sozlamalarni yangilash
      if (audioRef.current) {
        audioRef.current.loop = options?.loop || false;
        audioRef.current.volume = options?.volume ?? volume;
      }
    }

    // Audio'ni ijro etish
    if (audioRef.current) {
      try {
        const playPromise = audioRef.current.play();
        if (playPromise && typeof playPromise === 'object' && typeof playPromise.catch === 'function') {
          playPromise.catch((error: any) => {
            logger.error('[AudioContext] Failed to play audio:', error);
            setIsPlaying(false);
          });
        }
      } catch (error) {
        logger.error('[AudioContext] Failed to play audio (sync error):', error);
        setIsPlaying(false);
      }
    }
  }, [currentTrack, isPlaying, volume]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <AudioContext.Provider
      value={{
        play,
        pause,
        stop,
        setVolume,
        isPlaying,
        currentTrack,
        volume
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useGlobalAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useGlobalAudio must be used within AudioProvider');
  }
  return context;
};

