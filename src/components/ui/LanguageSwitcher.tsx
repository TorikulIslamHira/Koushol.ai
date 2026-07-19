import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { cn } from '@/lib/utils'

/** EN/BN toggle — persists the choice via i18next-browser-languagedetector's localStorage cache. No business logic — safe to reuse anywhere. */
export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  function toggle() {
    i18n.changeLanguage(i18n.language === 'bn' ? 'en' : 'bn')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch language"
      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-100 hover:text-brand-green"
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span
        className={cn('font-medium', i18n.language === 'bn' ? 'text-brand-green' : 'text-slate-400')}
      >
        বাং
      </span>
      <span className="text-slate-300">/</span>
      <span
        className={cn('font-medium', i18n.language === 'en' ? 'text-brand-green' : 'text-slate-400')}
      >
        EN
      </span>
    </button>
  )
}
