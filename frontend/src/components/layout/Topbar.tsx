import { ChevronRight } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Overview',
  '/agents': 'Agents',
  '/alerts': 'Alerts',
  '/rules': 'Rules',
  '/timeline': 'Timeline',
  '/settings': 'Settings',
  '/users': 'Users',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const label = ROUTE_LABELS[pathname] ?? pathname.split('/').filter(Boolean).pop() ?? 'Overview'

  return (
    <header className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-border-subtle bg-bg-surface">
      <nav className="flex items-center gap-1 text-sm">
        <span className="text-fg-muted">SIEM</span>
        <ChevronRight size={12} className="text-fg-subtle" />
        <span className="text-fg-default font-medium">{label}</span>
      </nav>

      <div className="flex items-center gap-3">
        <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border-default text-fg-subtle text-xs font-mono">
          <span>⌘</span><span>K</span>
        </kbd>

        <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
          <span className="text-accent text-xs font-medium">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
      </div>
    </header>
  )
}
