'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import { useEffect } from 'react'

const navItems = [
  { href: '/',          label: 'Dashboard', badge: null },
  { href: '/clients',   label: 'Clients',   badge: null },
  { href: '/projets',   label: 'Projets',   badge: 'projets' },
  { href: '/planning',  label: 'Planning',  badge: null },
  { href: '/taches',    label: 'Tâches',    badge: 'taches' },
  { href: '/finances',  label: 'Finances',  badge: null },
  { href: '/relances',  label: 'Relances',  badge: 'relances' },
  { href: '/notes',     label: 'Notes',     badge: null },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, badges, refreshBadges } = useApp()

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light')
  }, [theme])

  useEffect(() => {
    refreshBadges()
  }, [pathname])

  return (
    <aside style={{
      width: '200px',
      background: 'var(--sidebar-bg)',
      borderRight: '0.5px solid var(--border)',
      padding: '1.25rem 0',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      flexShrink: 0,
      minHeight: '100vh',
      transition: 'background .2s',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 1.25rem 1.25rem', borderBottom: '0.5px solid var(--border)', marginBottom: '.75rem' }}>
        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>MAZCOM</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Agence vidéo</div>
      </div>

      {/* Nav */}
      {navItems.map((item) => {
        const isActive   = pathname === item.href
        const badgeCount = item.badge ? (badges as any)[item.badge] : 0
        return (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '7px 1.25rem', fontSize: '13px',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? (theme === 'dark' ? '#1a1008' : '#fff5f0') : 'transparent',
              cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--hover-bg)' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {badgeCount > 0 && (
                <span style={{ fontSize: '10px', background: '#ff6b2bcc', color: '#fff', padding: '1px 6px', borderRadius: '8px', fontWeight: 500 }}>
                  {badgeCount}
                </span>
              )}
            </div>
          </Link>
        )
      })}

      <div style={{ flex: 1 }} />

      {/* Paramètres */}
      <Link href="/parametres" style={{ textDecoration: 'none' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '7px 1.25rem', fontSize: '13px',
          color: pathname === '/parametres' ? 'var(--accent)' : 'var(--text-secondary)',
          background: pathname === '/parametres' ? (theme === 'dark' ? '#1a1008' : '#fff5f0') : 'transparent',
          cursor: 'pointer',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
          Paramètres
        </div>
      </Link>
    </aside>
  )
}