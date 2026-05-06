'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/',         label: 'Dashboard', badge: null,      icon: '⊞' },
  { href: '/clients',  label: 'Clients',   badge: null,      icon: '👥' },
  { href: '/projets',  label: 'Projets',   badge: 'projets', icon: '🎬' },
  { href: '/planning', label: 'Planning',  badge: null,      icon: '📅' },
  { href: '/taches',   label: 'Tâches',    badge: 'taches',  icon: '✓' },
  { href: '/finances', label: 'Finances',  badge: null,      icon: '€' },
  { href: '/relances', label: 'Relances',  badge: 'relances',icon: '↩' },
  { href: '/notes',    label: 'Notes',     badge: null,      icon: '📝' },
]

// Items affichés dans la bottom bar mobile (les plus importants)
const mobileMain = ['/', '/projets', '/taches', '/finances', '/relances']

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, badges, refreshBadges } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light')
  }, [theme])

  useEffect(() => {
    refreshBadges()
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── MOBILE : bottom navigation bar
  if (isMobile) {
    const bottomItems = navItems.filter(i => mobileMain.includes(i.href))
    return (
      <>
        {/* Overlay menu complet */}
        {menuOpen && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }}
            onClick={() => setMenuOpen(false)}
          >
            <div
              style={{ position: 'absolute', bottom: '70px', left: 0, right: 0, background: 'var(--sidebar-bg)', borderTop: '0.5px solid var(--border)', borderRadius: '20px 20px 0 0', padding: '1rem 0' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ width: '36px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0 auto .75rem' }} />
              {[...navItems, { href: '/parametres', label: 'Paramètres', badge: null, icon: '⚙️' }].map(item => {
                const isActive   = pathname === item.href
                const badgeCount = item.badge ? (badges as any)[item.badge] : 0
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 1.5rem', background: isActive ? (theme === 'dark' ? '#1a1008' : '#fff5f0') : 'transparent' }}>
                      <span style={{ fontSize: '18px', width: '28px', textAlign: 'center' }}>{item.icon}</span>
                      <span style={{ fontSize: '15px', color: isActive ? 'var(--accent)' : 'var(--text-primary)', flex: 1 }}>{item.label}</span>
                      {badgeCount > 0 && (
                        <span style={{ fontSize: '11px', background: '#ff6b2b', color: '#fff', padding: '2px 7px', borderRadius: '10px', fontWeight: 500 }}>{badgeCount}</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'var(--sidebar-bg)',
          borderTop: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center',
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: '62px',
        }}>
          {bottomItems.map(item => {
            const isActive   = pathname === item.href
            const badgeCount = item.badge ? (badges as any)[item.badge] : 0
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '8px 4px', position: 'relative' }}>
                  <span style={{ fontSize: '20px', lineHeight: 1 }}>{item.icon}</span>
                  <span style={{ fontSize: '10px', color: isActive ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                  {badgeCount > 0 && (
                    <div style={{ position: 'absolute', top: '4px', right: '18px', width: '8px', height: '8px', borderRadius: '50%', background: '#ff6b2b' }} />
                  )}
                  {isActive && (
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '20px', height: '2px', background: 'var(--accent)', borderRadius: '0 0 2px 2px' }} />
                  )}
                </div>
              </Link>
            )
          })}

          {/* Bouton "Plus" */}
          <div style={{ flex: 1 }} onClick={() => setMenuOpen(true)}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '8px 4px', cursor: 'pointer' }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>☰</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Plus</span>
            </div>
          </div>
        </nav>
      </>
    )
  }

  // ── DESKTOP : sidebar classique
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
      <div style={{ padding: '0 1.25rem 1.25rem', borderBottom: '0.5px solid var(--border)', marginBottom: '.75rem' }}>
        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>MAZCOM</div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Agence vidéo</div>
      </div>

      {navItems.map(item => {
        const isActive   = pathname === item.href
        const badgeCount = item.badge ? (badges as any)[item.badge] : 0
        return (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 1.25rem', fontSize: '13px', color: isActive ? 'var(--accent)' : 'var(--text-secondary)', background: isActive ? (theme === 'dark' ? '#1a1008' : '#fff5f0') : 'transparent', cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--hover-bg)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {badgeCount > 0 && (
                <span style={{ fontSize: '10px', background: '#ff6b2bcc', color: '#fff', padding: '1px 6px', borderRadius: '8px', fontWeight: 500 }}>{badgeCount}</span>
              )}
            </div>
          </Link>
        )
      })}

      <div style={{ flex: 1 }} />

      <Link href="/parametres" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 1.25rem', fontSize: '13px', color: pathname === '/parametres' ? 'var(--accent)' : 'var(--text-secondary)', background: pathname === '/parametres' ? (theme === 'dark' ? '#1a1008' : '#fff5f0') : 'transparent', cursor: 'pointer' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
          Paramètres
        </div>
      </Link>
    </aside>
  )
}