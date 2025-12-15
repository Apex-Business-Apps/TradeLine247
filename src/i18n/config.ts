import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

export const SUPPORTED_LOCALES = ['en', 'fr-CA'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Check if translations are enabled from user preferences
const checkTranslationsEnabled = (): boolean => {
  try {
    const prefs = localStorage.getItem('user-preferences');
    if (prefs) {
      const parsed = JSON.parse(prefs);
      return parsed?.state?.translationsEnabled === true;
    }
  } catch {
    // If parsing fails, default to disabled (English only)
  }
  return false;
};

// Force English if translations are disabled
const enforceEnglishIfDisabled = () => {
  if (!checkTranslationsEnabled() && i18n.language !== 'en') {
    i18n.changeLanguage('en');
  }
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LOCALES,
    defaultNS: 'common',
    ns: ['common', 'dashboard'],
    
    interpolation: {
      escapeValue: false,
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    react: {
      useSuspense: false,
    },
  })
  .then(() => {
    // After initialization, check and enforce English if translations disabled
    enforceEnglishIfDisabled();
  });

// Override changeLanguage to prevent language changes when translations are disabled
const originalChangeLanguage = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = (lng?: string, callback?: (error: any, t: any) => void) => {
  if (!checkTranslationsEnabled() && lng !== 'en') {
    // If translations are disabled, only allow English
    return originalChangeLanguage('en', callback);
  }
  return originalChangeLanguage(lng, callback);
};

export default i18n;

