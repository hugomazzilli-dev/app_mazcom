import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type Subtask = { label: string; done: boolean }

export type Tache = {
  id: string
  created_at: string
  nom: string
  priorite: string
  statut: string
  projet: string
  client: string
  deadline: string
  notes: string
  subtasks: Subtask[]
  done: boolean
}

export function useTaches() {
  const [taches, setTaches] = useState<Tache[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchTaches() {
    const { data, error } = await supabase
      .from('taches')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setTaches(data)
    setLoading(false)
  }

  async function addTache(t: Omit<Tache, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('taches').insert([t]).select().single()
    if (!error && data) setTaches(prev => [data, ...prev])
    return { data, error }
  }

  async function updateTache(id: string, updates: Partial<Tache>) {
    const { data, error } = await supabase
      .from('taches').update(updates).eq('id', id).select().single()
    if (!error && data) setTaches(prev => prev.map(t => t.id === id ? data : t))
    return { data, error }
  }

  async function deleteTache(id: string) {
    const { error } = await supabase.from('taches').delete().eq('id', id)
    if (!error) setTaches(prev => prev.filter(t => t.id !== id))
    return { error }
  }

  async function toggleDone(id: string, done: boolean) {
    return updateTache(id, { done, statut: done ? 'terminé' : 'à faire' })
  }

  async function updateSubtasks(id: string, subtasks: Subtask[]) {
    return updateTache(id, { subtasks })
  }

  useEffect(() => { fetchTaches() }, [])

  return { taches, loading, addTache, updateTache, deleteTache, toggleDone, updateSubtasks }
}