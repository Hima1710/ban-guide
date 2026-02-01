/**
 * هوك الأعداد الموحد — يجلب أعداد التعليقات والإعجابات ويخزنها.
 * يستخدم جلب دفعة واحدة + Realtime لتحديث الأعداد فوراً.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCommentsCounts, type CommentEntityType } from '@/lib/api/comments'
import { getLikeCounts, type InteractionEntityType } from '@/lib/api/interactions'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface UseEntityCountsOptions {
  /** معرّفات الـ entities (منشورات، منتجات، أماكن) */
  entityIds: string[]
  /** نوع الـ entity */
  entityType: CommentEntityType
}

export interface UseEntityCountsReturn {
  /** عدد التعليقات لكل entity_id */
  commentCountByEntityId: Record<string, number>
  /** عدد الإعجابات لكل entity_id */
  likeCountByEntityId: Record<string, number>
  /** إعادة جلب الأعداد يدوياً */
  refresh: () => void
}

/**
 * يجلب أعداد التعليقات والإعجابات لعدة entities دفعة واحدة ويخزنها.
 * عند إضافة/حذف تعليق أو إعجاب (Realtime) يُحدّث العدد تلقائياً.
 */
export function useEntityCounts({
  entityIds,
  entityType,
}: UseEntityCountsOptions): UseEntityCountsReturn {
  const [commentCountByEntityId, setCommentCountByEntityId] = useState<Record<string, number>>({})
  const [likeCountByEntityId, setLikeCountByEntityId] = useState<Record<string, number>>({})

  const entityTypeInteraction = entityType as InteractionEntityType

  const fetchCounts = useCallback(async () => {
    if (!entityIds.length) {
      setCommentCountByEntityId({})
      setLikeCountByEntityId({})
      return
    }
    const [commentCounts, likeCounts] = await Promise.all([
      getCommentsCounts(entityIds, entityType),
      getLikeCounts(entityIds, entityTypeInteraction),
    ])
    setCommentCountByEntityId((prev) => ({ ...prev, ...commentCounts }))
    setLikeCountByEntityId((prev) => ({ ...prev, ...likeCounts }))
  }, [entityIds.join(','), entityType, entityTypeInteraction])

  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  /* Realtime: عند INSERT تعليق جديد نحدّث العدد للـ entity_id المعني */
  useEffect(() => {
    if (!entityIds.length || !isSupabaseConfigured()) return

    const set = new Set(entityIds)
    const channel = supabase
      .channel(`entity-counts-comments-${entityType}-${entityIds.join('-').slice(0, 48)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `entity_type=eq.${entityType}`,
        },
        (payload) => {
          const entityId = (payload.new as { entity_id: string })?.entity_id
          if (entityId && set.has(entityId)) {
            setCommentCountByEntityId((prev) => ({
              ...prev,
              [entityId]: (prev[entityId] ?? 0) + 1,
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [entityIds.join(','), entityType])

  /* Realtime: عند INSERT/DELETE إعجاب نحدّث العدد */
  useEffect(() => {
    if (!entityIds.length || !isSupabaseConfigured()) return

    const set = new Set(entityIds)
    const channel = supabase
      .channel(`entity-counts-likes-${entityType}-${entityIds.join('-').slice(0, 48)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interactions',
          filter: `entity_type=eq.${entityType}&type=eq.like`,
        },
        (payload) => {
          const entityId = (payload.new as { entity_id: string })?.entity_id
          if (entityId && set.has(entityId)) {
            setLikeCountByEntityId((prev) => ({
              ...prev,
              [entityId]: (prev[entityId] ?? 0) + 1,
            }))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'interactions',
          filter: `entity_type=eq.${entityType}`,
        },
        (payload) => {
          const entityId = (payload.old as { entity_id?: string; type?: string })?.entity_id
          const interactionType = (payload.old as { type?: string })?.type
          if (entityId && set.has(entityId) && interactionType === 'like') {
            setLikeCountByEntityId((prev) => ({
              ...prev,
              [entityId]: Math.max(0, (prev[entityId] ?? 1) - 1),
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [entityIds.join(','), entityType])

  return { commentCountByEntityId, likeCountByEntityId, refresh: fetchCounts }
}
