import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type Project = {
  id: string
  created_at: string
  nom: string
  client_nom: string
  type: string
  col: string
  budget: number
  date_deadline: string
  priorite: string
  progression: number
  checks: boolean[]
  notes: string
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projets')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setProjects(data)
    setLoading(false)
  }

  async function addProject(p: Omit<Project, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('projets').insert([p]).select().single()
    if (!error && data) setProjects(prev => [data, ...prev])
    return { data, error }
  }

  async function updateProject(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projets').update(updates).eq('id', id).select().single()
    if (!error && data) setProjects(prev => prev.map(p => p.id === id ? data : p))
    return { data, error }
  }

  async function deleteProject(id: string) {
    const { error } = await supabase.from('projets').delete().eq('id', id)
    if (!error) setProjects(prev => prev.filter(p => p.id !== id))
    return { error }
  }

  async function moveProject(id: string, newCol: string) {
    return updateProject(id, { col: newCol })
  }

  async function toggleCheck(id: string, checks: boolean[]) {
    const progression = Math.round(checks.filter(Boolean).length / 12 * 100)
    return updateProject(id, { checks, progression })
  }

  useEffect(() => { fetchProjects() }, [])

  return { projects, loading, addProject, updateProject, deleteProject, moveProject, toggleCheck }
}