/**
 * i18n Configuration
 *
 * Bootstraps react-i18next with:
 * - Support for 60 languages
 * - Browser language auto-detection (reads navigator.language / Accept-Language)
 * - Fallback to English when a string is missing in the detected language
 * - One namespace per feature area to keep JSON files focused
 * - Automatic RTL document direction for Right-to-Left languages
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources } from './resources';
import { SUPPORTED_LANGUAGES, isRTL } from './languages';

const supportedLngs = SUPPORTED_LANGUAGES.map((l) => l.code);

i18n
  // Detect language from: localStorage → navigator → htmlTag
  .use(LanguageDetector)
  // Wire into React
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs,
    fallbackLng: 'en',
    defaultNS: 'navbar',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

// Handle RTL/LTR text direction and lang attribute on language change
const updateDocumentDirection = (lng: string) => {
  const code = lng ? lng.split('-')[0] : 'en';
  document.documentElement.dir = isRTL(code) ? 'rtl' : 'ltr';
  document.documentElement.lang = code;
};

updateDocumentDirection(i18n.language);

i18n.on('languageChanged', (lng) => {
  updateDocumentDirection(lng);
});

export default i18n;
