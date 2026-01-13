import { supabase } from '@/supabase'
import type { Calendar } from '@/types'

export interface CalendarInsert {
  user_id: string
  name: string
  icon: string
  color: string
  description?: string
}

export interface CalendarUpdate {
  name?: string
  icon?: string
  color?: string
  description?: string
  updated_at?: string
}

export const calendarService = {
  async getAll(): Promise<Calendar[]> {
    const { data, error } = await supabase
      .from('calendars')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map(mapToCalendar)
  },

  async getById(id: string): Promise<Calendar | null> {
    const { data, error } = await supabase
      .from('calendars')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return mapToCalendar(data)
  },

  async create(calendar: CalendarInsert): Promise<Calendar> {
    const { data, error } = await supabase
      .from('calendars')
      .insert({
        user_id: calendar.user_id,
        name: calendar.name,
        icon: calendar.icon,
        color: calendar.color,
        description: calendar.description || ''
      })
      .select()
      .single()

    if (error) throw error
    return mapToCalendar(data)
  },

  async update(id: string, updates: CalendarUpdate): Promise<Calendar> {
    const { data, error } = await supabase
      .from('calendars')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapToCalendar(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendars')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

function mapToCalendar(row: Record<string, unknown>): Calendar {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    name: row.name as string,
    icon: row.icon as string,
    color: row.color as string,
    description: (row.description as string) || '',
    createdAt: new Date(row.created_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime()
  }
}
