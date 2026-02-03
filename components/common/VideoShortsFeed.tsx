/**
 * تاب الفيديوهات الموحد — شبكة 2 فيديو/صف قبل التشغيل؛ عند النقر يملأ المشغّل الطول مع إبقاء شريط التنقل السفلي.
 * النظام الموحد: useTheme، مكونات M3، CommentsContext، useEntityCounts.
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Heart, MessageCircle, Play, X } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { useCommentsContextOptional } from '@/contexts/CommentsContext'
import { useEntityCounts } from '@/hooks/useEntityCounts'
import { useUnifiedVideoFeed } from '@/hooks/useUnifiedVideoFeed'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/lib/youtube'
import { Button, LabelSmall } from '@/components/m3'
import { BanSkeleton } from '@/components/common'
import type { UnifiedVideoItem } from '@/lib/api/videos'
import type { CommentEntityType } from '@/lib/api/comments'

const ICON_CLASS = 'shrink-0'
/** ارتفاع المشغّل = الشاشة ناقص الهيدر وناقص شريط التنقل السفلي */
const PLAYER_HEIGHT_CSS = 'calc(100dvh - var(--header-height, 56px) - var(--bottom-nav-height, 64px))'

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url)
}

/** بطاقة فيديو في الشبكة — ثامبنيل + أيقونة تشغيل + أعداد التفاعل */
function VideoGridCard({
  item,
  likeCount,
  commentCount,
  onClick,
}: {
  item: UnifiedVideoItem
  likeCount: number
  commentCount: number
  onClick: () => void
}) {
  const { colors } = useTheme()
  const isYt = isYouTubeUrl(item.videoUrl)
  const ytId = isYt ? extractYouTubeId(item.videoUrl) : null
  const thumbSrc = isYt && ytId ? getYouTubeThumbnail(ytId) : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl overflow-hidden border-0 p-0 block text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        backgroundColor: colors.surfaceContainer,
        borderColor: colors.outline,
        boxShadow: 'var(--shadow-sm)',
      }}
      aria-label={`تشغيل فيديو ${item.title || 'فيديو'}`}
    >
      <div className="relative aspect-video w-full bg-black">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : item.videoUrl ? (
          <video
            src={item.videoUrl}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
            playsInline
          />
        ) : null}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
          >
            <Play size={28} className="shrink-0" fill="currentColor" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-2 py-2" style={{ color: colors.onSurfaceVariant }}>
        <span className="flex items-center gap-0.5">
          <Heart size={14} className={ICON_CLASS} />
          <LabelSmall>{likeCount}</LabelSmall>
        </span>
        <span className="flex items-center gap-0.5">
          <MessageCircle size={14} className={ICON_CLASS} />
          <LabelSmall>{commentCount}</LabelSmall>
        </span>
      </div>
    </button>
  )
}

function VideoShortsSlide({
  item,
  likeCount,
  commentCount,
  isLiked,
  onLikeToggle,
  onCommentClick,
  onClose,
  isActive,
}: {
  item: UnifiedVideoItem
  likeCount: number
  commentCount: number
  isLiked: boolean
  onLikeToggle: () => void
  onCommentClick: () => void
  onClose: () => void
  isActive: boolean
}) {
  const { colors } = useTheme()
  const videoRef = useRef<HTMLVideoElement>(null)
  const ytRef = useRef<HTMLIFrameElement>(null)
  const isYt = isYouTubeUrl(item.videoUrl)
  const ytId = isYt ? extractYouTubeId(item.videoUrl) : null

  useEffect(() => {
    if (!isActive) {
      if (!isYt && videoRef.current) {
        videoRef.current.pause()
      }
      return
    }
    if (isYt) return
    if (videoRef.current) {
      videoRef.current.play().catch(() => {})
    }
  }, [isActive, isYt])

  return (
    <div
      className="relative w-full flex-shrink-0 snap-start snap-always flex flex-col items-center justify-center"
      style={{ minHeight: PLAYER_HEIGHT_CSS, backgroundColor: colors.surface }}
    >
      {/* الفيديو — يملأ الطول مع الحفاظ على النسبة؛ شريط التنقل السفلي يبقى ظاهراً */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {isYt && ytId ? (
          <iframe
            key={`${item.id}-${isActive}`}
            ref={ytRef}
            src={getYouTubeEmbedUrl(ytId) + '?autoplay=' + (isActive ? '1' : '0') + '&mute=0'}
            title="فيديو"
            className="w-full h-full max-w-full max-h-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : item.videoUrl ? (
          <video
            ref={videoRef}
            src={item.videoUrl}
            className="w-full h-full object-contain"
            loop
            muted={false}
            playsInline
            controls
          />
        ) : null}
      </div>

      {/* زر الإغلاق — العودة للشبكة */}
      <Button
        type="button"
        variant="text"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-3 right-3 z-20 !min-h-0 !p-2 rounded-full"
        style={{
          color: colors.onSurface,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
        aria-label="إغلاق والعودة للشبكة"
      >
        <X size={24} className="shrink-0" />
      </Button>

      {/* شريط التفاعل — يمين الشاشة (RTL: يسار) */}
      <div
        className="absolute bottom-6 left-4 flex flex-col gap-4 z-10"
        style={{ color: colors.onSurface }}
      >
        <Button
          type="button"
          variant="text"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onLikeToggle()
          }}
          className="!min-h-0 !p-2 rounded-extra-large flex flex-col items-center gap-0.5"
          style={{
            color: isLiked ? colors.primary : colors.onSurface,
            backgroundColor: 'transparent',
          }}
          aria-label={likeCount > 0 ? `${likeCount} إعجاب` : isLiked ? 'إلغاء الإعجاب' : 'إعجاب'}
        >
          <Heart
            size={28}
            className={ICON_CLASS}
            fill={isLiked ? 'currentColor' : 'transparent'}
          />
          {likeCount > 0 && (
            <LabelSmall color={isLiked ? 'primary' : 'onSurface'} className="text-center">
              {likeCount}
            </LabelSmall>
          )}
        </Button>
        <Button
          type="button"
          variant="text"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onCommentClick()
          }}
          className="!min-h-0 !p-2 rounded-extra-large flex flex-col items-center gap-0.5"
          style={{ color: colors.onSurface, backgroundColor: 'transparent' }}
          aria-label={commentCount > 0 ? `${commentCount} تعليق` : 'تعليق'}
        >
          <MessageCircle size={28} className={ICON_CLASS} />
          {commentCount > 0 && (
            <LabelSmall color="onSurface" className="text-center">
              {commentCount}
            </LabelSmall>
          )}
        </Button>
      </div>
    </div>
  )
}

export default function VideoShortsFeed() {
  const { colors } = useTheme()
  const { user } = useAuthContext()
  const commentsContext = useCommentsContextOptional()
  const { items, fetchNextPage, hasNextPage, loading, error } = useUnifiedVideoFeed()
  const containerRef = useRef<HTMLDivElement>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set())

  const postIds = useMemo(
    () => items.filter((i) => i.entityType === 'post').map((i) => i.entityId),
    [items]
  )
  const productIds = useMemo(
    () => items.filter((i) => i.entityType === 'product').map((i) => i.entityId),
    [items]
  )
  const placeIds = useMemo(
    () => items.filter((i) => i.entityType === 'place').map((i) => i.entityId),
    [items]
  )

  const postCounts = useEntityCounts({ entityIds: postIds, entityType: 'post' })
  const productCounts = useEntityCounts({ entityIds: productIds, entityType: 'product' })
  const placeCounts = useEntityCounts({ entityIds: placeIds, entityType: 'place' })

  const getCounts = useCallback(
    (item: UnifiedVideoItem): { likeCount: number; commentCount: number } => {
      const et = item.entityType as CommentEntityType
      if (et === 'post') {
        return {
          likeCount: postCounts.likeCountByEntityId[item.entityId] ?? 0,
          commentCount: postCounts.commentCountByEntityId[item.entityId] ?? 0,
        }
      }
      if (et === 'product') {
        return {
          likeCount: productCounts.likeCountByEntityId[item.entityId] ?? 0,
          commentCount: productCounts.commentCountByEntityId[item.entityId] ?? 0,
        }
      }
      return {
        likeCount: placeCounts.likeCountByEntityId[item.entityId] ?? 0,
        commentCount: placeCounts.commentCountByEntityId[item.entityId] ?? 0,
      }
    },
    [postCounts, productCounts, placeCounts]
  )

  const likeKey = (item: UnifiedVideoItem) => `${item.entityType}-${item.entityId}`
  const isLiked = useCallback(
    (item: UnifiedVideoItem) => likedSet.has(likeKey(item)),
    [likedSet]
  )

  const toggleLike = useCallback(
    async (item: UnifiedVideoItem) => {
      if (!user?.id || !isSupabaseConfigured()) return
      const key = likeKey(item)
      const next = !likedSet.has(key)
      setLikedSet((prev) => {
        const s = new Set(prev)
        if (next) s.add(key)
        else s.delete(key)
        return s
      })
      await supabase
        .from('interactions')
        .delete()
        .eq('user_id', user.id)
        .eq('entity_id', item.entityId)
        .eq('entity_type', item.entityType)
      if (next) {
        await supabase.from('interactions').insert({
          user_id: user.id,
          entity_id: item.entityId,
          entity_type: item.entityType,
          type: 'like',
        } as never)
      }
    },
    [user?.id, likedSet]
  )

  const openComments = useCallback(
    (item: UnifiedVideoItem) => {
      if (commentsContext?.openCommentsSheetForEntity) {
        commentsContext.openCommentsSheetForEntity(
          item.entityId,
          item.entityType,
          item.placeId ?? undefined
        )
      }
    },
    [commentsContext]
  )

  const closePlayer = useCallback(() => setSelectedIndex(null), [])

  useEffect(() => {
    if (selectedIndex === null || !containerRef.current) return
    const slide = containerRef.current.querySelector(`[data-video-slide][data-index="${selectedIndex}"]`)
    if (slide) {
      (slide as HTMLElement).scrollIntoView({ behavior: 'instant', block: 'start' })
    }
  }, [selectedIndex])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const idx = Number((e.target as HTMLElement).dataset.index)
          if (Number.isFinite(idx) && e.isIntersecting) {
            setActiveIndex(idx)
            break
          }
        }
      },
      { root: el, rootMargin: '0px', threshold: 0.5 }
    )
    el.querySelectorAll('[data-video-slide]').forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [items.length])

  useEffect(() => {
    if (!hasNextPage || loading || selectedIndex !== null) return
    const el = gridContainerRef.current
    if (!el) return
    const sentinel = el.querySelector('[data-video-sentinel]')
    if (!sentinel) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage()
      },
      { root: el, rootMargin: '200px', threshold: 0 }
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [hasNextPage, loading, fetchNextPage, selectedIndex])

  if (error) {
    return (
      <div
        className="flex items-center justify-center min-h-[50vh] px-4"
        style={{ backgroundColor: colors.background }}
      >
        <LabelSmall color="error">حدث خطأ في تحميل الفيديوهات.</LabelSmall>
      </div>
    )
  }

  if (loading && items.length === 0) {
    return (
      <div
        className="flex flex-col gap-4 p-4 min-h-[50vh]"
        style={{ backgroundColor: colors.background }}
      >
        {[1, 2, 3].map((i) => (
          <BanSkeleton key={i} variant="card" lines={2} className="aspect-video rounded-xl" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div
        className="flex items-center justify-center min-h-[50vh] px-4"
        style={{ backgroundColor: colors.background }}
      >
        <LabelSmall color="onSurfaceVariant">لا يوجد فيديوهات لعرضها.</LabelSmall>
      </div>
    )
  }

  // مشغّل full-height — يظهر عند النقر على فيديو؛ شريط التنقل السفلي يبقى ظاهراً
  if (selectedIndex !== null) {
    return (
      <div
        ref={containerRef}
        className="overflow-y-auto snap-y snap-mandatory w-full fixed inset-x-0 z-40"
        style={{
          top: 'var(--header-height, 56px)',
          height: PLAYER_HEIGHT_CSS,
          backgroundColor: colors.surface,
        }}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            data-video-slide
            data-index={index}
            className="w-full"
            style={{ minHeight: PLAYER_HEIGHT_CSS }}
          >
            <VideoShortsSlide
              item={item}
              likeCount={getCounts(item).likeCount}
              commentCount={getCounts(item).commentCount}
              isLiked={isLiked(item)}
              onLikeToggle={() => toggleLike(item)}
              onCommentClick={() => openComments(item)}
              onClose={closePlayer}
              isActive={activeIndex === index}
            />
          </div>
        ))}
      </div>
    )
  }

  // الشبكة — 2 فيديو في كل صف، الأحدث أولاً
  return (
    <div
      ref={gridContainerRef}
      className="overflow-y-auto w-full px-2 py-4"
      style={{
        minHeight: '50vh',
        backgroundColor: colors.background,
      }}
    >
      <div className="grid grid-cols-2 gap-3 max-w-6xl mx-auto">
        {items.map((item, index) => (
          <VideoGridCard
            key={item.id}
            item={item}
            likeCount={getCounts(item).likeCount}
            commentCount={getCounts(item).commentCount}
            onClick={() => {
              setSelectedIndex(index)
              setActiveIndex(index)
            }}
          />
        ))}
      </div>
      <div data-video-sentinel className="h-4 w-full" aria-hidden />
      {loading && items.length > 0 && (
        <div className="flex justify-center py-4">
          <BanSkeleton variant="text" className="w-32 h-6" />
        </div>
      )}
    </div>
  )
}
