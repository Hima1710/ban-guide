/**
 * API الحالات (ستوريز) – النظام الموحد
 * صاحب المحل يضيف الحالة، تظهر للمتابعين حتى انتهاء المدة (24 ساعة افتراضي).
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { PlaceStory } from '@/lib/types'

/** جلب الحالات النشطة لأماكن يتابعها المستخدم (لشريط الصفحة الرئيسية) */
export async function getStoriesByFollowedPlaceIds(
  placeIds: string[]
): Promise<{ placeId: string; stories: PlaceStory[] }[]> {
  if (!isSupabaseConfigured() || placeIds.length === 0) return []

  const { data, error } = await supabase
    .from('stories')
    .select('*, place:places(id, name_ar, logo_url)')
    .in('place_id', placeIds)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getStoriesByFollowedPlaceIds:', error)
    return []
  }

  const rows = (data || []) as (PlaceStory & { place?: { id: string; name_ar: string | null; logo_url: string | null } })[]
  const byPlace = new Map<string, PlaceStory[]>()
  for (const row of rows) {
    const placeId = row.place_id
    if (!byPlace.has(placeId)) byPlace.set(placeId, [])
    const { place, ...story } = row
    byPlace.get(placeId)!.push({ ...story, place: row.place ?? undefined })
  }

  return placeIds
    .filter((id) => byPlace.has(id))
    .map((placeId) => ({ placeId, stories: byPlace.get(placeId)! }))
}

/** جلب كل الحالات النشطة لمكان واحد (للمشاهد) */
export async function getStoriesByPlaceId(placeId: string): Promise<PlaceStory[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await supabase
    .from('stories')
    .select('*, place:places(id, name_ar, logo_url)')
    .eq('place_id', placeId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getStoriesByPlaceId:', error)
    return []
  }

  return (data || []) as PlaceStory[]
}

/** إضافة حالة (صاحب المكان أو موظف بصلاحية) */
export async function addStory(params: {
  place_id: string
  media_url: string
  media_type: 'image' | 'video'
  expires_at?: string
}): Promise<PlaceStory | null> {
  if (!isSupabaseConfigured()) return null

  const place_id = params.place_id?.trim()
  const media_url = params.media_url?.trim()
  const media_type = params.media_type === 'video' ? 'video' : 'image'

  if (!place_id || !media_url) {
    console.error('addStory: place_id and media_url are required')
    return null
  }

  const expires_at =
    params.expires_at && params.expires_at.trim()
      ? params.expires_at.trim()
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const payload = {
    place_id,
    media_url,
    media_type,
    expires_at,
  }

  // استخدام minimal لتجنب 400 إن كان الـ SELECT بعد الإدراج يرفضه RLS
  const { data: inserted, error: insertError } = await supabase
    .from('stories')
    .insert(payload as never)
    .select('id, place_id, media_url, media_type, expires_at, created_at')
    .maybeSingle()

  if (insertError) {
    console.error('addStory:', insertError.message, insertError.code, insertError.details)
    return null
  }

  if (inserted) return inserted as PlaceStory

  // إن لم يُرجع الصف (مثلاً بسبب RLS على SELECT)، نجلب الحالة يدوياً
  const { data: list } = await supabase
    .from('stories')
    .select('*')
    .eq('place_id', place_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return list as PlaceStory | null
}

/** حذف حالة (صاحب المكان فقط عبر RLS) */
export async function deleteStory(storyId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  const { error } = await supabase.from('stories').delete().eq('id', storyId)

  if (error) {
    console.error('deleteStory:', error)
    return false
  }

  return true
}
