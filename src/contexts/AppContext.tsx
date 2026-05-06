'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

type AppContextType = {
  theme: 'dark' | 'light'
  toggleTheme: () => void
  badges: { projets: number; taches: number; relances: number }
  refreshBadges: () => void
}

const AppContext = createContext<AppContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  badges: { projets: 0, taches: 0, relances: 0 },
  refreshBadges: () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme]   = useState<'dark' | 'light'>('dark')
  const [badges, setBadges] = useState({ projets: 0, taches: 0, relances: 0 })

  async function fetchTheme() {
    const { data } = await supabase.from('parametres').select('theme').single()
    if (data?.theme) setTheme(data.theme as 'dark' | 'light')
  }

  async function refreshBadges() {
    const [{ data: projets }, { data: taches }, { data: relances }] = await Promise.all([
      supabase.from('projets').select('id').not('col', 'in', '("livre","facture")'),
      supabase.from('taches').select('id').eq('done', false).eq('priorite', 'urgent'),
      supabase.from('relances').select('id').eq('done', false),
    ])
    setBadges({
      projets:  projets?.length  || 0,
      taches:   taches?.length   || 0,
      relances: relances?.length || 0,
    })
  }

  async function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    await supabase.from('parametres').update({ theme: newTheme }).not('id', 'is', null)
  }

  useEffect(() => {
    fetchTheme()
    refreshBadges()
  }, [])

  return (
    <AppContext.Provider value={{ theme, toggleTheme, badges, refreshBadges }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}