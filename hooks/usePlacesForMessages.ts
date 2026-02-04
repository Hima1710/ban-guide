'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { usePlaces } from '@/hooks/usePlaces'
import { getEmployedPlaces, getFollowedPlaces, type PlaceWithRole, type PlaceRoleInMessages } from '@/lib/api/messagesPlaces'
import type { Place } from '@/lib/types'

export interface UsePlacesForMessagesReturn {
  /** أماكن المستخدم كمالك */
  ownedPlaces: Place[]
  /** أماكن المستخدم كموظف */
  employedPlaces: Place[]
  /** أماكن المستخدم كمتابع */
  followedPlaces: Place[]
  /** قائمة موحدة: مكان + دوره (للعرض في فلتر المحادثات) */
  placesWithRole: PlaceWithRole[]
  loading: boolean
  error: unknown
  refresh: () => Promise<void>
}

const dedupeByPlaceId = (list: PlaceWithRole[]): PlaceWithRole[] => {
  const seen = new Set<string>()
  return list.filter((item) => {
    if (seen.has(item.place.id)) return false
    seen.add(item.place.id)
    return true
  })
}

/**
 * هوك أماكن المحادثات — يجمع أماكن المستخدم كمالك وموظف ومتابع.
 * للنظام الموحد: استدعاء من صفحة المحادثات لفلتر الأماكن حسب الدور.
 */
export function usePlacesForMessages(): UsePlacesForMessagesReturn {
  const { user } = useAuthContext()
  const { places: ownedPlaces, loading: ownedLoading } = usePlaces({
    userId: user?.id ?? undefined,
    autoLoad: !!user?.id,
  })

  const [employedPlaces, setEmployedPlaces] = useState<Place[]>([])
  const [followedPlaces, setFollowedPlaces] = useState<Place[]>([])
  const [loadingExtra, setLoadingExtra] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const loadExtra = useCallback(async () => {
    if (!user?.id) {
      setEmployedPlaces([])
      setFollowedPlaces([])
      return
    }
    setLoadingExtra(true)
    setError(null)
    try {
      const [employed, followed] = await Promise.all([
        getEmployedPlaces(user.id),
        getFollowedPlaces(user.id),
      ])
      setEmployedPlaces(employed)
      setFollowedPlaces(followed)
    } catch (err) {
      setError(err)
      setEmployedPlaces([])
      setFollowedPlaces([])
    } finally {
      setLoadingExtra(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadExtra()
  }, [loadExtra])

  const refresh = useCallback(async () => {
    await loadExtra()
  }, [loadExtra])

  const placesWithRole: PlaceWithRole[] = dedupeByPlaceId([
    ...(ownedPlaces ?? []).map((place) => ({ place, role: 'owner' as PlaceRoleInMessages })),
    ...employedPlaces.map((place) => ({ place, role: 'employee' as PlaceRoleInMessages })),
    ...followedPlaces.map((place) => ({ place, role: 'follower' as PlaceRoleInMessages })),
  ])

  const loading = ownedLoading || loadingExtra

  return {
    ownedPlaces: ownedPlaces ?? [],
    employedPlaces,
    followedPlaces,
    placesWithRole,
    loading,
    error,
    refresh,
  }
}
