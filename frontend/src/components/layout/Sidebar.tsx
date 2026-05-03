import {
  Bell,
  Filter,
  LayoutDashboard,
  LineChart,
  LogOut,
  Server,
  Settings,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  icon: React.ReactNode
  label: string
  to: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { icon: <LayoutDashboard size={16} />, label: 'Overview', to: '/' },
  { icon: <Server size={16} />, label: 'Agents', to: '/agents' },
  { icon: <Bell size={16} />, label: 'Alerts', to: '/alerts' },
  { icon: <Filter size={16} />, label: 'Rules', to: '/rules' },
  { icon: <LineChart size={16} />, label: 'Timeline', to: '/timeline' },
]

const BOTTOM_ITEMS: NavItem[] = [
  { icon: <Settings size={16} />, label: 'Settings', to: '/settings' },
  { icon: <Users size={16} />, label: 'Users', to: '/users', adminOnly: true },
]

function NavItemEl({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        [
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors duration-150',
          isActive
            ? 'bg-bg-selected text-fg-default border-l-2 border-accent -ml-px pl-[11px]'
            : 'text-fg-muted hover:bg-bg-hover hover:text-fg-default border-l-2 border-transparent -ml-px pl-[11px]',
        ].join(' ')
      }
    >
      <span className="shrink-0">{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  )
}

const COLLAPSED_KEY = 'sidebar:collapsed'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === 'true',
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setCollapsed((c) => {
          const next = !c
          localStorage.setItem(COLLAPSED_KEY, String(next))
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggle = () =>
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem(COLLAPSED_KEY, String(next))
      return next
    })

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const width = collapsed ? 'w-14' : 'w-60'

  const visibleBottom = BOTTOM_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === 'admin',
  )

  return (
    <aside
      className={`${width} shrink-0 h-screen flex flex-col bg-bg-surface border-r border-border-subtle transition-all duration-200`}
    >
      {/* Logo */}
      <div className="h-12 flex items-center px-3 border-b border-border-subtle shrink-0">
        <div className="w-7 h-7 bg-bg-elevated border border-border-default rounded-md flex items-center justify-center shrink-0">
          <span className="text-fg-default font-mono text-xs font-semibold">SD</span>
        </div>
        {!collapsed && (
          <span className="ml-2.5 text-fg-default text-sm font-semibold truncate">
            SIEM Dashboard
          </span>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) =>
          collapsed ? (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="w-full flex items-center justify-center p-2 rounded-md text-fg-muted hover:bg-bg-hover hover:text-fg-default transition-colors duration-150"
              title={item.label}
            >
              {item.icon}
            </button>
          ) : (
            <NavItemEl key={item.to} item={item} />
          ),
        )}
      </nav>

      {/* Bottom section */}
      <div className="py-3 px-2 border-t border-border-subtle space-y-0.5">
        {visibleBottom.map((item) =>
          collapsed ? (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="w-full flex items-center justify-center p-2 rounded-md text-fg-muted hover:bg-bg-hover hover:text-fg-default transition-colors duration-150"
              title={item.label}
            >
              {item.icon}
            </button>
          ) : (
            <NavItemEl key={item.to} item={item} />
          ),
        )}

        {/* User row */}
        <div className="mt-2 pt-2 border-t border-border-subtle">
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 rounded-md text-fg-muted hover:bg-bg-hover hover:text-fg-default transition-colors duration-150"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          ) : (
            <div className="flex items-center justify-between px-3 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
                  <span className="text-accent text-xs font-medium">
                    {user?.email?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <span className="text-fg-muted text-xs truncate">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 rounded text-fg-subtle hover:text-fg-default hover:bg-bg-hover transition-colors"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center py-1.5 text-fg-subtle hover:text-fg-default hover:bg-bg-hover rounded-md transition-colors text-xs"
          title={collapsed ? 'Expand sidebar (Cmd+B)' : 'Collapse sidebar (Cmd+B)'}
        >
          {collapsed ? '→' : '← Collapse'}
        </button>
      </div>
    </aside>
  )
}
