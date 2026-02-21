
import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';

type Language = 'uz' | 'ru' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('hamroh_language');
    return (saved as Language) || 'uz';
  });

  useEffect(() => {
    localStorage.setItem('hamroh_language', language);
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    const langTranslations = TRANSLATIONS[language] as Record<string, unknown> | undefined;
    let value: unknown = langTranslations;
    for (const k of keys) {
      if (value != null && typeof value === 'object') {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = undefined;
        break;
      }
    }
    const result = value !== undefined && value !== null && typeof value === 'string' ? value : key;

    if (params && typeof result === 'string') {
      return Object.keys(params).reduce(
        (acc, paramKey) => acc.replace(new RegExp(`{${paramKey}}`, 'g'), String(params[paramKey])),
        result
      );
    }
    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};
