/**
 * API أماكن المحادثات — جلب أماكن المستخدم حسب الدور (مالك، موظف، متابع).
 * النظام الموحد: تسمية snake_case، استدعاء من التطبيق عبر lib/api.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Place } from '@/lib/types'

export type PlaceRoleInMessages = 'owner' | 'employee' | 'follower'

export interface PlaceWithRole {
  place: Place
  role: PlaceRoleInMessages
}

/** أماكن المستخدم كموظف (place_employees) */
export async function getEmployedPlaces(userId: string | null): Promise<Place[]> {
  if (!isSupabaseConfigured() || !userId) return []

  const { data, error } = await supabase
    .from('place_employees')
    .select('place:places(*)')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) return []
  const rows = (data || []) as { place: Place | Place[] | null }[]
  const places: Place[] = []
  for (const row of rows) {
    const p = row.place
    if (p && !Array.isArray(p)) places.push(p)
  }
  return places
}

/** أماكن المستخدم كمتابع (follows) */
export async function getFollowedPlaces(userId: string | null): Promise<Place[]> {
  if (!isSupabaseConfigured() || !userId) return []

  const { data, error } = await supabase
    .from('follows')
    .select('places(*)')
    .eq('follower_id', userId)

  if (error) return []
  const rows = (data || []) as { places: Place | Place[] | null }[]
  const places: Place[] = []
  for (const row of rows) {
    const p = row.places
    if (p) places.push(...(Array.isArray(p) ? p : [p]))
  }
  return places
}

export interface FollowerProfile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
}

export interface PlaceEmployeeProfile {
  id: string
  place_id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
}

/** موظفو مكان (لصفحة المحادثات — عرض قائمة الموظفين عند اختيار مكان) */
export async function getPlaceEmployees(placeId: string | null): Promise<PlaceEmployeeProfile[]> {
  if (!isSupabaseConfigured() || !placeId) return []

  const { data: empRows, error } = await supabase
    .from('place_employees')
    .select('id, place_id, user_id')
    .eq('place_id', placeId)
    .eq('is_active', true)

  if (error || !empRows?.length) return []

  const userIds = [...new Set((empRows as { user_id: string }[]).map((r) => r.user_id))]
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds)

  const profilesList = (profiles || []) as {
    id: string
    full_name: string | null
    avatar_url: string | null
  }[]
  const profileMap = new Map(profilesList.map((p) => [p.id, p]))

  return (empRows as { id: string; place_id: string; user_id: string }[]).map((r) => {
    const profile = profileMap.get(r.user_id)
    return {
      id: r.id,
      place_id: r.place_id,
      user_id: r.user_id,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    }
  })
}

/** متابعو مكان (لصفحة المحادثات — عرض قائمة المتابعين عند اختيار مكان) */
export async function getPlaceFollowers(placeId: string | null): Promise<FollowerProfile[]> {
  if (!isSupabaseConfigured() || !placeId) return []

  const { data: followRows, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('place_id', placeId)

  if (error || !followRows?.length) return []

  const userIds = [...new Set((followRows as { follower_id: string }[]).map((r) => r.follower_id))]
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds)

  const list = (profiles || []) as { id: string; full_name: string | null; avatar_url: string | null }[]
  return list.map((p) => ({
    id: p.id,
    user_id: p.id,
    full_name: p.full_name,
    avatar_url: p.avatar_url,
  }))
}
