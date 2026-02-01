import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Place } from '@/lib/types'
import { isValidPlaceId } from '@/lib/validation'

export async function getPlaces(featured?: boolean): Promise<Place[]> {
  if (!isSupabaseConfigured()) return []
  let query = supabase
    .from('places')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('total_views', { ascending: false })

  if (featured !== undefined) {
    query = query.eq('is_featured', featured)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getPlaceById(id: string): Promise<Place | null> {
  if (!isSupabaseConfigured() || !isValidPlaceId(id)) return null
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function incrementPlaceView(placeId: string): Promise<void> {
  if (!isSupabaseConfigured() || !isValidPlaceId(placeId)) return
  const { error } = await supabase.rpc('increment_place_view', {
    place_uuid: placeId,
  } as never)

  if (error) {
    console.error('Error incrementing view:', error)
  }
}

export async function recordPlaceVisit(placeId: string, visitorIp?: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('place_visits').insert({
    place_id: placeId,
    visitor_ip: visitorIp,
  } as never)

  if (error) {
    console.error('Error recording visit:', error)
  }
}

/**
 * مجموع مشاهدات الأماكن (اليوم + الإجمالي) — للهيدر (نفس منطق الكروت).
 */
export async function getPlacesViewsStats(): Promise<{ today: number; total: number }> {
  if (!isSupabaseConfigured()) return { today: 0, total: 0 }
  const { data: rows, error } = await supabase
    .from('places')
    .select('today_views, total_views')
    .eq('is_active', true)
  if (error) return { today: 0, total: 0 }
  let today = 0
  let total = 0
  for (const r of rows || []) {
    const row = r as { today_views?: number; total_views?: number }
    today += Number(row.today_views) || 0
    total += Number(row.total_views) || 0
  }
  return { today, total }
}
