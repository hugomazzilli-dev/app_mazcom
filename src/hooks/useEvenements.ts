import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type CheckItem = { label: string; done: boolean }

export type Evenement = {
  id: string
  created_at: string
  titre: string
  type: string
  date_jour: number
  date_mois: number
  date_annee: number
  heure: string
  lieu: string
  contact: string
  materiel: string
  notes: string
  checks: CheckItem[]
}

export function useEvenements() {
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading]       = useState(true)

  async function fetchEvenements() {
    const { data, error } = await supabase
      .from('evenements')
      .select('*')
      .order('date_annee').order('date_mois').order('date_jour')
    if (!error && data) setEvenements(data)
    setLoading(false)
  }

  async function addEvenement(e: Omit<Evenement, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('evenements').insert([e]).select().single()
    if (!error && data) setEvenements(prev => [...prev, data].sort((a, b) =>
      new Date(a.date_annee, a.date_mois - 1, a.date_jour).getTime() -
      new Date(b.date_annee, b.date_mois - 1, b.date_jour).getTime()
    ))
    return { data, error }
  }

  async function updateEvenement(id: string, updates: Partial<Evenement>) {
    const { data, error } = await supabase
      .from('evenements').update(updates).eq('id', id).select().single()
    if (!error && data) setEvenements(prev => prev.map(e => e.id === id ? data : e))
    return { data, error }
  }

  async function deleteEvenement(id: string) {
    const { error } = await supabase.from('evenements').delete().eq('id', id)
    if (!error) setEvenements(prev => prev.filter(e => e.id !== id))
    return { error }
  }

  async function toggleCheck(id: string, checks: CheckItem[]) {
    return updateEvenement(id, { checks })
  }

  useEffect(() => { fetchEvenements() }, [])

  return { evenements, loading, addEvenement, updateEvenement, deleteEvenement, toggleCheck }
}