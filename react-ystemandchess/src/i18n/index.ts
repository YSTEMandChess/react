/**
 * i18n Configuration
 *
 * Bootstraps react-i18next with:
 * - Browser language auto-detection (reads navigator.language / Accept-Language)
 * - Fallback to English when a string is missing in the detected language
 * - One namespace per feature area to keep JSON files focused
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ─── English ────────────────────────────────────────────────────────────────
import enNavbar   from './locales/en/navbar.json';
import enHome     from './locales/en/home.json';
import enFooter   from './locales/en/footer.json';
import enLessons  from './locales/en/lessons.json';
import enAuth     from './locales/en/auth.json';
import enPlay     from './locales/en/play.json';
import enPrograms from './locales/en/programs.json';
import enMentor   from './locales/en/mentor.json';

// ─── Spanish ────────────────────────────────────────────────────────────────
import esNavbar   from './locales/es/navbar.json';
import esHome     from './locales/es/home.json';
import esFooter   from './locales/es/footer.json';
import esLessons  from './locales/es/lessons.json';
import esAuth     from './locales/es/auth.json';
import esPlay     from './locales/es/play.json';
import esPrograms from './locales/es/programs.json';
import esMentor   from './locales/es/mentor.json';

// ─── French ─────────────────────────────────────────────────────────────────
import frNavbar   from './locales/fr/navbar.json';
import frHome     from './locales/fr/home.json';
import frFooter   from './locales/fr/footer.json';
import frLessons  from './locales/fr/lessons.json';
import frAuth     from './locales/fr/auth.json';
import frPlay     from './locales/fr/play.json';
import frPrograms from './locales/fr/programs.json';
import frMentor   from './locales/fr/mentor.json';

// ─── Arabic ─────────────────────────────────────────────────────────────────
import arNavbar   from './locales/ar/navbar.json';
import arHome     from './locales/ar/home.json';
import arFooter   from './locales/ar/footer.json';
import arLessons  from './locales/ar/lessons.json';
import arAuth     from './locales/ar/auth.json';
import arPlay     from './locales/ar/play.json';
import arPrograms from './locales/ar/programs.json';
import arMentor   from './locales/ar/mentor.json';

// ─── Chinese (Simplified) ────────────────────────────────────────────────────
import zhNavbar   from './locales/zh/navbar.json';
import zhHome     from './locales/zh/home.json';
import zhFooter   from './locales/zh/footer.json';
import zhLessons  from './locales/zh/lessons.json';
import zhAuth     from './locales/zh/auth.json';
import zhPlay     from './locales/zh/play.json';
import zhPrograms from './locales/zh/programs.json';
import zhMentor   from './locales/zh/mentor.json';

// ─── Kazakh ──────────────────────────────────────────────────────────────────
import kkNavbar   from './locales/kk/navbar.json';
import kkHome     from './locales/kk/home.json';
import kkFooter   from './locales/kk/footer.json';
import kkLessons  from './locales/kk/lessons.json';
import kkAuth     from './locales/kk/auth.json';
import kkPlay     from './locales/kk/play.json';
import kkPrograms from './locales/kk/programs.json';
import kkMentor   from './locales/kk/mentor.json';

i18n
  // Detect language from: localStorage → navigator → htmlTag → path → subdomain
  .use(LanguageDetector)
  // Wire into React
  .use(initReactI18next)
  .init({
    // Bundled resources — no HTTP calls, no extra latency
    resources: {
      en: { navbar: enNavbar, home: enHome, footer: enFooter, lessons: enLessons, auth: enAuth, play: enPlay, programs: enPrograms, mentor: enMentor },
      es: { navbar: esNavbar, home: esHome, footer: esFooter, lessons: esLessons, auth: esAuth, play: esPlay, programs: esPrograms, mentor: esMentor },
      fr: { navbar: frNavbar, home: frHome, footer: frFooter, lessons: frLessons, auth: frAuth, play: frPlay, programs: frPrograms, mentor: frMentor },
      ar: { navbar: arNavbar, home: arHome, footer: arFooter, lessons: arLessons, auth: arAuth, play: arPlay, programs: arPrograms, mentor: arMentor },
      zh: { navbar: zhNavbar, home: zhHome, footer: zhFooter, lessons: zhLessons, auth: zhAuth, play: zhPlay, programs: zhPrograms, mentor: zhMentor },
      kk: { navbar: kkNavbar, home: kkHome, footer: kkFooter, lessons: kkLessons, auth: kkAuth, play: kkPlay, programs: kkPrograms, mentor: kkMentor },
    },

    // Supported language codes — also handles region variants like 'es-MX' → 'es'
    supportedLngs: ['en', 'es', 'fr', 'ar', 'zh', 'kk'],

    // Fall back to English when a key is missing in the detected language
    fallbackLng: 'en',

    // Default namespace used when no namespace is specified in t()
    defaultNS: 'navbar',

    interpolation: {
      // React already escapes values — no need for i18next to do it too
      escapeValue: false,
    },

    detection: {
      // Detection order: localStorage override → browser language → HTML lang attribute
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Persist the user's last detected language so it loads instantly on next visit
      caches: ['localStorage'],
    },
  });

export default i18n;
