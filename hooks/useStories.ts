/**
 * Hook الحالات (ستوريز) – النظام الموحد
 * جلب الحالات النشطة لأماكن يتابعها المستخدم (للصفحة الرئيسية).
 */

import { useState, useEffect, useCallback } from 'react'
import { getStoriesByFollowedPlaceIds, getStoriesByPlaceId } from '@/lib/api/stories'
import type { PlaceStory } from '@/lib/types'

export interface PlaceWithStories {
  placeId: string
  placeName: string | null
  placeLogo: string | null
  stories: PlaceStory[]
}

export function useStoriesForFollowedPlaces(placeIds: string[]) {
  const [placesWithStories, setPlacesWithStories] = useState<PlaceWithStories[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (placeIds.length === 0) {
      setPlacesWithStories([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const result = await getStoriesByFollowedPlaceIds(placeIds)
      const list: PlaceWithStories[] = result.map(({ placeId, stories }) => {
        const first = stories[0]
        const place = first?.place
        return {
          placeId,
          placeName: place?.name_ar ?? null,
          placeLogo: place?.logo_url ?? null,
          stories,
        }
      })
      setPlacesWithStories(list)
    } catch (e) {
      console.error('useStoriesForFollowedPlaces:', e)
      setPlacesWithStories([])
    } finally {
      setLoading(false)
    }
  }, [placeIds.join(',')])

  useEffect(() => {
    load()
  }, [load])

  return { placesWithStories, loading, refresh: load }
}

export function usePlaceStories(placeId: string | null) {
  const [stories, setStories] = useState<PlaceStory[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!placeId) {
      setStories([])
      return
    }
    setLoading(true)
    try {
      const list = await getStoriesByPlaceId(placeId)
      setStories(list)
    } catch (e) {
      console.error('usePlaceStories:', e)
      setStories([])
    } finally {
      setLoading(false)
    }
  }, [placeId])

  useEffect(() => {
    load()
  }, [load])

  return { stories, loading, refresh: load }
}
