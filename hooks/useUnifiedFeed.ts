'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import type { Place, Post, Product } from '@/lib/types'

const PAGE_SIZE = 20

/** Tier order: Premium first, then Gold, then Basic (by package priority / card_style) */
function tierOrder(priority: number | undefined, cardStyle: string | undefined): number {
  if (priority != null) return -priority
  if (cardStyle === 'premium' || cardStyle === 'gold') return -2
  if (cardStyle === 'silver') return -1
  return 0
}

/** Subscription tier for card styling (Premium / Gold / Basic) */
export type SubscriptionTier = 'premium' | 'gold' | 'basic'

type PackageShape = { priority?: number; card_style?: string } | null | undefined

/** Only premium/gold when package data exists; otherwise basic so cards stay visually distinct. */
function getTier(priority: number | undefined, cardStyle: string | undefined, isFeatured?: boolean): SubscriptionTier {
  if (cardStyle === 'premium') return 'premium'
  if (cardStyle === 'gold') return 'gold'
  if (cardStyle === 'silver') return 'basic'
  if (priority != null && priority > 0) {
    if (priority >= 2) return 'premium'
    return 'gold'
  }
  if (isFeatured && (priority != null || cardStyle != null)) return 'gold'
  return 'basic'
}

/** Normalize subscription from place: Supabase may return object or array, or under user_subscriptions key. */
function getPackageFromPlace(place: unknown): PackageShape {
  if (!place || typeof place !== 'object') return undefined
  const o = place as Record<string, unknown>
  const sub = o.subscription ?? o.user_subscriptions
  if (!sub || typeof sub !== 'object') return undefined
  const arr = Array.isArray(sub) ? sub[0] : sub
  const pkg = arr && typeof arr === 'object' && 'package' in arr ? (arr as { package?: PackageShape }).package : undefined
  return pkg ?? undefined
}

export type EntityType = 'places' | 'posts' | 'products'

export interface FeedItemBase {
  id: string
  isLiked: boolean
  isFavorited: boolean
  tier: SubscriptionTier
}

export type PlaceFeedItem = Place & FeedItemBase & { _tierOrder?: number }
export type PostFeedItem = Post & FeedItemBase & { _tierOrder?: number }
export type ProductFeedItem = Product & FeedItemBase & { _tierOrder?: number }

export type UnifiedFeedItem = PlaceFeedItem | PostFeedItem | ProductFeedItem

export interface UseUnifiedFeedOptions {
  entityType: EntityType
  placeId?: string
}

export interface UseUnifiedFeedReturn {
  items: UnifiedFeedItem[]
  fetchNextPage: () => Promise<void>
  hasNextPage: boolean
  loading: boolean
  error: unknown
  refresh: () => Promise<void>
}

/** After first interactions API failure (e.g. table missing), skip further calls this session. */
let interactionsApiDisabled = false

/** Set NEXT_PUBLIC_FEED_INTERACTIONS_ENABLED=true after running add_social_features.sql in Supabase. */
const INTERACTIONS_ENABLED =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FEED_INTERACTIONS_ENABLED === 'true'

/**
 * Fetches current user's like/favorite from interactions.
 * Off by default to avoid 400 until the interactions table exists.
 */
async function fetchUserInteractions(
  userId: string | undefined,
  entityType: 'place' | 'post' | 'product',
  entityIds: string[]
): Promise<Map<string, { like: boolean; favorite: boolean }>> {
  const map = new Map<string, { like: boolean; favorite: boolean }>()
  if (!userId || entityIds.length === 0 || !INTERACTIONS_ENABLED || interactionsApiDisabled) return map

  const idSet = new Set(entityIds)
  const { data: rows, error } = await supabase
    .from('interactions')
    .select('entity_id, interaction_type')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
  const data = rows as { entity_id: string; interaction_type: string }[] | null

  if (error) {
    interactionsApiDisabled = true
    return map
  }

  const allowed = new Set(['like', 'favorite'])
  for (const row of data || []) {
    if (!idSet.has(row.entity_id) || !allowed.has(row.interaction_type)) continue
    const current = map.get(row.entity_id) || { like: false, favorite: false }
    if (row.interaction_type === 'like') current.like = true
    if (row.interaction_type === 'favorite') current.favorite = true
    map.set(row.entity_id, current)
  }
  return map
}

function sortByTierThenDate<T extends { _tierOrder?: number; created_at: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const orderA = a._tierOrder ?? 0
    const orderB = b._tierOrder ?? 0
    if (orderA !== orderB) return orderA - orderB
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

/** Deduplicate by id (keeps first); use after joins that can duplicate rows. */
function dedupeById<T extends { id: string }>(list: T[]): T[] {
  const seen = new Set<string>()
  return list.filter((x) => {
    if (seen.has(x.id)) return false
    seen.add(x.id)
    return true
  })
}

export function useUnifiedFeed(options: UseUnifiedFeedOptions): UseUnifiedFeedReturn {
  const { entityType, placeId } = options
  const { user } = useAuthContext()

  const [items, setItems] = useState<UnifiedFeedItem[]>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const fetchPage = useCallback(
    async (pageNum: number): Promise<{ items: UnifiedFeedItem[]; count: number }> => {
      setError(null)
      if (!isSupabaseConfigured()) {
        return { items: [], count: 0 }
      }
      const from = pageNum * PAGE_SIZE
      const to = (pageNum + 1) * PAGE_SIZE - 1

      try {
        if (entityType === 'places') {
          const { data: raw, error: e } = await supabase
            .from('places')
            .select('*, subscription:user_subscriptions(package:packages(priority, card_style))')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .range(from, to)

          if (e) throw e
          const list = dedupeById((raw || []) as (Place & { subscription?: { package?: PackageShape }; user_subscriptions?: { package?: PackageShape } })[])
          const ids = list.map((p) => p.id)
          const interactions = await fetchUserInteractions(user?.id, 'place', ids)

          const feedItems: PlaceFeedItem[] = list.map((p) => {
            const pkg = getPackageFromPlace(p)
            return {
              ...p,
              isLiked: interactions.get(p.id)?.like ?? false,
              isFavorited: interactions.get(p.id)?.favorite ?? false,
              tier: getTier(pkg?.priority, pkg?.card_style, p.is_featured),
              _tierOrder: tierOrder(pkg?.priority, pkg?.card_style),
            }
          })
          return { items: sortByTierThenDate(feedItems), count: list.length }
        }

        if (entityType === 'posts') {
          const { data: raw, error: e } = await supabase
            .from('posts')
            .select('*, place:places(id, name_ar, logo_url, subscription:user_subscriptions(package:packages(priority, card_style)))')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .range(from, to)

          if (e) throw e
          const list = dedupeById((raw || []) as (Post & { place?: { subscription?: { package?: PackageShape }; user_subscriptions?: { package?: PackageShape } } })[])
          const ids = list.map((p) => p.id)
          const interactions = await fetchUserInteractions(user?.id, 'post', ids)

          const feedItems: PostFeedItem[] = list.map((p) => {
            const pkg = p.place ? getPackageFromPlace(p.place) : undefined
            return {
              ...p,
              isLiked: interactions.get(p.id)?.like ?? false,
              isFavorited: interactions.get(p.id)?.favorite ?? false,
              tier: getTier(pkg?.priority, pkg?.card_style),
              _tierOrder: pkg != null ? tierOrder(pkg.priority, pkg.card_style) : 0,
            }
          })
          return { items: sortByTierThenDate(feedItems), count: list.length }
        }

        let query = supabase
          .from('products')
          .select('*, place:places(id, subscription:user_subscriptions(package:packages(priority, card_style)))')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(from, to)

        if (placeId) query = query.eq('place_id', placeId)

        const { data: raw, error: e } = await query
        if (e) throw e
        const list = dedupeById((raw || []) as (Product & { place?: { subscription?: { package?: PackageShape }; user_subscriptions?: { package?: PackageShape } } })[])
        const ids = list.map((p) => p.id)
        const interactions = await fetchUserInteractions(user?.id, 'product', ids)

        const feedItems: ProductFeedItem[] = list.map((p) => {
          const pkg = p.place ? getPackageFromPlace(p.place) : undefined
          return {
            ...p,
            isLiked: interactions.get(p.id)?.like ?? false,
            isFavorited: interactions.get(p.id)?.favorite ?? false,
            tier: getTier(pkg?.priority, pkg?.card_style),
            _tierOrder: pkg != null ? tierOrder(pkg.priority, pkg.card_style) : 0,
          }
        })
        return { items: sortByTierThenDate(feedItems), count: list.length }
      } catch (err: unknown) {
        setError(err)
        return { items: [], count: 0 }
      }
    },
    [entityType, placeId, user?.id]
  )

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || loading) return
    setLoading(true)
    const { items: newItems, count } = await fetchPage(page)
    setItems((prev) => {
      const byId = new Map(prev.map((i) => [i.id, i]))
      newItems.forEach((i) => byId.set(i.id, i))
      return sortByTierThenDate([...byId.values()])
    })
    setPage((p) => p + 1)
    setHasNextPage(count >= PAGE_SIZE)
    setLoading(false)
  }, [entityType, hasNextPage, loading, page, fetchPage])

  const refresh = useCallback(async () => {
    setItems([])
    setPage(0)
    setHasNextPage(true)
    setLoading(true)
    const { items: newItems, count } = await fetchPage(0)
    setItems(sortByTierThenDate(newItems))
    setPage(1)
    setHasNextPage(count >= PAGE_SIZE)
    setLoading(false)
  }, [fetchPage])

  // When entityType (or placeId) changes: reset state then run initial fetch
  useEffect(() => {
    setItems([])
    setPage(0)
    setHasNextPage(true)
    setError(null)

    let cancelled = false
    setLoading(true)
    fetchPage(0).then(({ items: newItems, count }) => {
      if (cancelled) return
      setItems(sortByTierThenDate(newItems))
      setPage(1)
      setHasNextPage(count >= PAGE_SIZE)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [entityType, placeId, fetchPage])

  return {
    items,
    fetchNextPage,
    hasNextPage,
    loading,
    error,
    refresh,
  }
}
