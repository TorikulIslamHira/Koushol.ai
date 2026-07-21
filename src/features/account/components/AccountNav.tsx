import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Award, StickyNote, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/dashboard', labelKey: 'accountNav.dashboard', icon: LayoutDashboard },
  { to: '/certificates', labelKey: 'accountNav.certificates', icon: Award },
  { to: '/notes', labelKey: 'accountNav.notes', icon: StickyNote },
  { to: '/doubts', labelKey: 'accountNav.doubts', icon: HelpCircle },
] as const

/** Tab strip shared by the student account pages (Dashboard/Certificates/Notes/Doubts). */
export function AccountNav() {
  const { t } = useTranslation()

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {TABS.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            cn(
              'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors duration-150',
              isActive
                ? 'border-brand-green text-brand-green'
                : 'border-transparent text-slate-500 hover:text-brand-ink',
            )
          }
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {t(labelKey)}
        </NavLink>
      ))}
    </nav>
  )
}
