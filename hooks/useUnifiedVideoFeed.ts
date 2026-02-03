'use client'

import { useState, useCallback, useEffect } from 'react'
import { getUnifiedVideos, type UnifiedVideoItem } from '@/lib/api/videos'

const PAGE_SIZE = 20

export interface UseUnifiedVideoFeedReturn {
  items: UnifiedVideoItem[]
  fetchNextPage: () => Promise<void>
  hasNextPage: boolean
  loading: boolean
  error: unknown
  refresh: () => Promise<void>
}

export function useUnifiedVideoFeed(): UseUnifiedVideoFeedReturn {
  const [items, setItems] = useState<UnifiedVideoItem[]>([])
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const loadPage = useCallback(async (from: number): Promise<UnifiedVideoItem[]> => {
    setError(null)
    try {
      const list = await getUnifiedVideos(from, PAGE_SIZE)
      return list
    } catch (err) {
      setError(err)
      return []
    }
  }, [])

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || loading) return
    setLoading(true)
    const newItems = await loadPage(offset)
    setItems((prev) => {
      const byId = new Map(prev.map((i) => [i.id, i]))
      newItems.forEach((i) => byId.set(i.id, i))
      return [...byId.values()].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    })
    setOffset((o) => o + PAGE_SIZE)
    setHasNextPage(newItems.length >= PAGE_SIZE)
    setLoading(false)
  }, [hasNextPage, loading, offset, loadPage])

  const refresh = useCallback(async () => {
    setItems([])
    setOffset(0)
    setHasNextPage(true)
    setLoading(true)
    const newItems = await loadPage(0)
    setItems(
      newItems.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    )
    setOffset(PAGE_SIZE)
    setHasNextPage(newItems.length >= PAGE_SIZE)
    setLoading(false)
  }, [loadPage])

  useEffect(() => {
    setItems([])
    setOffset(0)
    setHasNextPage(true)
    setError(null)
    let cancelled = false
    setLoading(true)
    loadPage(0).then((newItems) => {
      if (cancelled) return
      setItems(
        newItems.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      )
      setOffset(PAGE_SIZE)
      setHasNextPage(newItems.length >= PAGE_SIZE)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [loadPage])

  return {
    items,
    fetchNextPage,
    hasNextPage,
    loading,
    error,
    refresh,
  }
}
