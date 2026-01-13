import { supabase } from '@/supabase'
import type { CheckInRecord } from '@/types'

export interface RecordInsert {
  user_id: string
  calendar_id: string
  date: string
  content?: string
  images?: string[]
  is_retroactive?: boolean
}

export interface RecordUpdate {
  content?: string
  images?: string[]
}

export const recordService = {
  async getByCalendar(calendarId: string): Promise<CheckInRecord[]> {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('calendar_id', calendarId)
      .order('check_in_time', { ascending: true })

    if (error) throw error
    return data.map(mapToRecord)
  },

  async getByDate(calendarId: string, date: string): Promise<CheckInRecord | null> {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('calendar_id', calendarId)
      .eq('date', date)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return mapToRecord(data)
  },

  async getById(id: string): Promise<CheckInRecord | null> {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return mapToRecord(data)
  },

  async create(record: RecordInsert): Promise<CheckInRecord> {
    const { data, error } = await supabase
      .from('records')
      .insert({
        user_id: record.user_id,
        calendar_id: record.calendar_id,
        date: record.date,
        content: record.content || '',
        images: record.images || [],
        is_retroactive: record.is_retroactive || false
      })
      .select()
      .single()

    if (error) throw error
    return mapToRecord(data)
  },

  async update(id: string, updates: RecordUpdate): Promise<CheckInRecord> {
    const { data, error } = await supabase
      .from('records')
      .update({
        content: updates.content,
        images: updates.images
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapToRecord(data)
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('records')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

function mapToRecord(row: Record<string, unknown>): CheckInRecord {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    calendarId: row.calendar_id as string,
    date: row.date as string,
    checkInTime: new Date(row.check_in_time as string).getTime(),
    content: (row.content as string) || '',
    images: (row.images as string[]) || [],
    isRetroactive: row.is_retroactive as boolean,
    retroactiveTime: row.retroactive_time
      ? new Date(row.retroactive_time as string).getTime()
      : undefined
  }
}
