'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, Translations } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'qoldai-language';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && translations[saved]) {
      setLanguageState(saved);
    } else {
      const browserLang = navigator.language.slice(0, 2).toLowerCase();
      if (browserLang === 'kk' || browserLang === 'kz') {
        setLanguageState('kz');
      } else if (browserLang === 'en') {
        setLanguageState('en');
      }
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = translations[language] as Translations;

  if (!mounted) {
    return (
      <I18nContext.Provider value={{ language: 'ru', setLanguage, t: translations.ru as Translations }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language)}
      className={`bg-transparent border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${className}`}
      title="Change language"
    >
      <option value="ru">RU</option>
      <option value="kz">KZ</option>
      <option value="en">EN</option>
    </select>
  );
}
