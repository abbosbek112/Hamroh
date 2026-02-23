/**
 * Audio Configuration
 * 
 * Bu yerda audio URL'larni saqlash mumkin
 * Import qilingan fayllar yoki tashqi URL'lar ishlatilishi mumkin
 */

export interface SoundConfig {
  id: string;
  name: string;
  url: string | null; // Import qilingan fayl yoki URL
  icon?: any; // Icon component
  color?: string;
  bg?: string;
}

/**
 * Audio URL'larni konfiguratsiya qilish
 * 
 * Bu yerda URL'larni quyidagicha qo'shishingiz mumkin:
 * 1. Import qilingan fayllar (local)
 * 2. Tashqi URL'lar (CDN, API)
 * 3. Environment variable'lar orqali
 */
export const AUDIO_URLS = {
  // Local fayllar (public/ ichida saqlanadi)
  rain: '/sounds/rain.mp3',
  fire: '/sounds/fire.mp3',
  forest: '/sounds/forest.mp3',

  // Tashqi URL'lar (misollar)
  // rain: 'https://cdn.example.com/sounds/rain.mp3',
  // fire: 'https://cdn.example.com/sounds/fire.mp3',
  // forest: 'https://cdn.example.com/sounds/forest.mp3',

  // Environment variable orqali
  // rain: import.meta.env.VITE_AUDIO_RAIN_URL || rainSound,
  // fire: import.meta.env.VITE_AUDIO_FIRE_URL || fireSound,
  // forest: import.meta.env.VITE_AUDIO_FOREST_URL || forestSound,
};

/**
 * Audio URL'ni olish
 * 
 * @param soundId - Sound ID
 * @returns Audio URL yoki null
 */
export const getAudioUrl = (soundId: string): string | null => {
  return AUDIO_URLS[soundId as keyof typeof AUDIO_URLS] || null;
};

/**
 * URL'ni tekshirish (valid URL yoki import qilingan fayl)
 */
export const isValidAudioUrl = (url: string | null): boolean => {
  if (!url) return false;

  // Import qilingan fayl (blob: yoki data: yoki relative path)
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('/')) {
    return true;
  }

  // Tashqi URL (http:// yoki https://)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true;
  }

  // Relative path (./ yoki ../)
  if (url.startsWith('./') || url.startsWith('../')) {
    return true;
  }

  return false;
};

