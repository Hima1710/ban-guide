/**
 * API الفيديوهات الموحد — جلب فيديوهات من المنشورات، المنتجات، الأماكن، والستوريز.
 * للنظام الموحد: استدعاء من التطبيق عبر lib/api، تسمية snake_case.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { CommentEntityType } from '@/lib/api/comments'

const DEFAULT_PAGE_SIZE = 20

/** مصدر الفيديو — يحدد نوع الـ entity للتعليقات/الإعجابات */
export type VideoSourceType = 'post' | 'product' | 'place' | 'story'

export interface UnifiedVideoItem {
  /** معرّف موحد (مركّب من المصدر + المعرّف) لاستخدامه كمفتاح في القائمة */
  id: string
  /** رابط الفيديو */
  videoUrl: string
  /** مصدر الفيديو */
  source: VideoSourceType
  /** معرّف الـ entity (منشور، منتج، مكان، ستوري) */
  entityId: string
  /** نوع الـ entity للتعليقات والإعجابات — للستوري نستخدم place */
  entityType: CommentEntityType
  /** معرّف المكان (للتوجيه ولتعليقات الستوري) */
  placeId: string | null
  /** عنوان أو وصف قصير */
  title: string | null
  /** تاريخ الإنشاء للترتيب */
  created_at: string
  /** اسم المكان أو الشعار إن وُجد (للعرض) */
  placeName?: string | null
  logoUrl?: string | null
}

async function fetchPostVideos(limit: number): Promise<UnifiedVideoItem[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, place_id, video_url, content, created_at, place:places(id, name_ar, logo_url)')
    .eq('is_active', true)
    .eq('post_type', 'video')
    .not('video_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  const rows = (data || []) as {
    id: string
    place_id: string
    video_url: string
    content: string | null
    created_at: string
    place?: { id: string; name_ar: string | null; logo_url: string | null } | null
  }[]
  return rows.map((p) => ({
    id: `post-${p.id}`,
    videoUrl: p.video_url,
    source: 'post' as const,
    entityId: p.id,
    entityType: 'post' as const,
    placeId: p.place_id ?? null,
    title: p.content?.trim() || null,
    created_at: p.created_at,
    placeName: p.place?.name_ar ?? null,
    logoUrl: p.place?.logo_url ?? null,
  }))
}

async function fetchProductVideos(limit: number): Promise<UnifiedVideoItem[]> {
  const { data, error } = await supabase
    .from('product_videos')
    .select('id, product_id, video_url, created_at, product:products(name_ar, place_id, created_at, place:places(id, name_ar, logo_url))')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  const rows = (data || []) as {
    id: string
    product_id: string
    video_url: string
    created_at: string
    product?: {
      name_ar: string
      place_id: string
      created_at: string
      place?: { id: string; name_ar: string | null; logo_url: string | null } | null
    } | null
  }[]
  return rows.map((pv) => ({
    id: `product_video-${pv.id}`,
    videoUrl: pv.video_url,
    source: 'product' as const,
    entityId: pv.product_id,
    entityType: 'product' as const,
    placeId: pv.product?.place_id ?? null,
    title: pv.product?.name_ar ?? null,
    created_at: pv.created_at,
    placeName: pv.product?.place?.name_ar ?? null,
    logoUrl: pv.product?.place?.logo_url ?? null,
  }))
}

async function fetchPlaceVideos(limit: number): Promise<UnifiedVideoItem[]> {
  const { data, error } = await supabase
    .from('places')
    .select('id, video_url, name_ar, logo_url, created_at')
    .eq('is_active', true)
    .not('video_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  const rows = (data || []) as { id: string; video_url: string; name_ar: string; logo_url: string | null; created_at: string }[]
  return rows.map((pl) => ({
    id: `place-${pl.id}`,
    videoUrl: pl.video_url,
    source: 'place' as const,
    entityId: pl.id,
    entityType: 'place' as const,
    placeId: pl.id,
    title: pl.name_ar ?? null,
    created_at: pl.created_at,
    placeName: pl.name_ar ?? null,
    logoUrl: pl.logo_url ?? null,
  }))
}

async function fetchStoryVideos(limit: number): Promise<UnifiedVideoItem[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('id, place_id, media_url, created_at, place:places(id, name_ar, logo_url)')
    .eq('media_type', 'video')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  const rows = (data || []) as {
    id: string
    place_id: string
    media_url: string
    created_at: string
    place?: { id: string; name_ar: string | null; logo_url: string | null } | null
  }[]
  return rows.map((s) => ({
    id: `story-${s.id}`,
    videoUrl: s.media_url,
    source: 'story' as const,
    entityId: s.place_id ?? s.id,
    entityType: 'place' as const,
    placeId: s.place_id ?? null,
    title: null,
    created_at: s.created_at,
    placeName: s.place?.name_ar ?? null,
    logoUrl: s.place?.logo_url ?? null,
  }))
}

/**
 * جلب فيديوهات موحدة من كل المصادر (منشورات، منتجات، أماكن، ستوريز)،
 * مرتّبة حسب التاريخ تنازلياً مع دعم pagination.
 */
export async function getUnifiedVideos(
  offset: number,
  limit: number = DEFAULT_PAGE_SIZE
): Promise<UnifiedVideoItem[]> {
  if (!isSupabaseConfigured()) return []

  const fetchSize = offset + limit
  const [posts, productVideos, places, stories] = await Promise.all([
    fetchPostVideos(fetchSize),
    fetchProductVideos(fetchSize),
    fetchPlaceVideos(fetchSize),
    fetchStoryVideos(fetchSize),
  ])

  const merged = [...posts, ...productVideos, ...places, ...stories].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return merged.slice(offset, offset + limit)
}
