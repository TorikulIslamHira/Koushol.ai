import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from '@/i18n/locales/en.json'
import bn from '@/i18n/locales/bn.json'

/**
 * i18n setup for the full English/Bangla UI toggle (PROJECT.md Section 8 Phase 8).
 * Default is Bangla (decided 2026-07-19) — LanguageDetector checks localStorage first
 * (so a returning visitor's choice sticks), then falls back to the `fallbackLng` below
 * rather than the browser's Accept-Language header, since we want Bangla-first by default
 * regardless of browser locale, not just for unconfigured browsers.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      bn: { translation: bn },
    },
    fallbackLng: 'bn',
    supportedLngs: ['en', 'bn'],
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'koushol_lang',
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
