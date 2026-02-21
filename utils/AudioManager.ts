/**
 * Custom Audio Manager Class
 * 
 * Bu class audio fayllarni professional tarzda boshqarish uchun
 */

export class AudioManager {
  private audioMap: Map<string, HTMLAudioElement> = new Map();
  private currentAudio: HTMLAudioElement | null = null;
  private globalVolume: number = 0.5;

  /**
   * Audio faylni yuklash
   */
  load(url: string, id: string, options?: { preload?: boolean }): void {
    if (this.audioMap.has(id)) return;
    
    const audio = new Audio(url);
    audio.preload = options?.preload !== false ? 'auto' : 'none';
    this.audioMap.set(id, audio);
  }

  /**
   * Audio'ni ijro etish
   */
  async play(
    id: string, 
    options?: { 
      loop?: boolean; 
      volume?: number;
      startTime?: number;
    }
  ): Promise<void> {
    const audio = this.audioMap.get(id);
    if (!audio) {
      console.warn(`Audio with id "${id}" not found. Load it first.`);
      return;
    }

    // Oldingi audio'ni to'xtatish
    if (this.currentAudio && this.currentAudio !== audio) {
      this.currentAudio.pause();
    }

    audio.loop = options?.loop || false;
    audio.volume = options?.volume ?? this.globalVolume;
    
    if (options?.startTime !== undefined) {
      audio.currentTime = options.startTime;
    }

    try {
      await audio.play();
      this.currentAudio = audio;
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }

  /**
   * Audio'ni to'xtatish
   */
  pause(id: string): void {
    const audio = this.audioMap.get(id);
    audio?.pause();
  }

  /**
   * Audio'ni to'xtatish va boshiga qaytarish
   */
  stop(id: string): void {
    const audio = this.audioMap.get(id);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Barcha audio'larni to'xtatish
   */
  stopAll(): void {
    this.audioMap.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.currentAudio = null;
  }

  /**
   * Volume o'zgartirish
   */
  setVolume(id: string, volume: number): void {
    const audio = this.audioMap.get(id);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Global volume o'zgartirish
   */
  setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    this.audioMap.forEach(audio => {
      audio.volume = this.globalVolume;
    });
  }

  /**
   * Audio holatini olish
   */
  isPlaying(id: string): boolean {
    const audio = this.audioMap.get(id);
    return audio ? !audio.paused : false;
  }

  /**
   * Audio'ni o'chirish
   */
  unload(id: string): void {
    const audio = this.audioMap.get(id);
    if (audio) {
      audio.pause();
      audio.src = '';
      this.audioMap.delete(id);
      
      if (this.currentAudio === audio) {
        this.currentAudio = null;
      }
    }
  }

  /**
   * Barcha audio'larni tozalash
   */
  cleanup(): void {
    this.audioMap.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.audioMap.clear();
    this.currentAudio = null;
  }

  /**
   * Audio'ni preload qilish
   */
  preload(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = this.audioMap.get(id);
      if (!audio) {
        reject(new Error(`Audio with id "${id}" not found`));
        return;
      }

      if (audio.readyState >= 2) {
        resolve();
        return;
      }

      const handleCanPlay = () => {
        audio.removeEventListener('canplaythrough', handleCanPlay);
        audio.removeEventListener('error', handleError);
        resolve();
      };

      const handleError = () => {
        audio.removeEventListener('canplaythrough', handleCanPlay);
        audio.removeEventListener('error', handleError);
        reject(new Error('Failed to preload audio'));
      };

      audio.addEventListener('canplaythrough', handleCanPlay, { once: true });
      audio.addEventListener('error', handleError, { once: true });
      audio.load();
    });
  }
}

// Singleton instance
export const audioManager = new AudioManager();

