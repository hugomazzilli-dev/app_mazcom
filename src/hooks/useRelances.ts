import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type HistItem = { icon: string; label: string; date: string; c: string }

export type Relance = {
  id: string
  created_at: string
  nom: string
  cat: string
  client: string
  contact: string
  montant: number
  jours: number
  done: boolean
  historique: HistItem[]
  message: string
}

export function useRelances() {
  const [relances, setRelances] = useState<Relance[]>([])
  const [loading, setLoading]   = useState(true)

  async function fetchRelances() {
    const { data, error } = await supabase
      .from('relances')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setRelances(data)
    setLoading(false)
  }

  async function addRelance(r: Omit<Relance, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('relances').insert([r]).select().single()
    if (!error && data) setRelances(prev => [data, ...prev])
    return { data, error }
  }

  async function updateRelance(id: string, updates: Partial<Relance>) {
    const { data, error } = await supabase
      .from('relances').update(updates).eq('id', id).select().single()
    if (!error && data) setRelances(prev => prev.map(r => r.id === id ? data : r))
    return { data, error }
  }

  async function deleteRelance(id: string) {
    const { error } = await supabase.from('relances').delete().eq('id', id)
    if (!error) setRelances(prev => prev.filter(r => r.id !== id))
    return { error }
  }

  async function toggleDone(id: string, done: boolean) {
    return updateRelance(id, { done })
  }

  async function addHistorique(id: string, item: HistItem, existing: HistItem[]) {
    return updateRelance(id, { historique: [item, ...existing] })
  }

  useEffect(() => { fetchRelances() }, [])

  return { relances, loading, addRelance, updateRelance, deleteRelance, toggleDone, addHistorique }
}