'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Heart, MessageCircle, Star } from 'lucide-react'
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { Card, Post, PlaceStatsBar } from '@/components/common'
import { Button } from '@/components/m3'
import { isValidPlaceId } from '@/lib/validation'
import type { PlaceFeedItem, PostFeedItem, ProductFeedItem, SubscriptionTier } from '@/hooks/useUnifiedFeed'

const DEFAULT_TIER: SubscriptionTier = 'basic'
const PLACEHOLDER_NAME = 'مكان'
const PREMIUM_BADGE_LABEL = 'بريميوم'
const PREMIUM_ARIA = 'معتمد / بريميوم'
/** M3 Icon Button: شفاف، 48dp، rounded-extra-large — نلغي افتراضي globals (خلفية ذهبية) */
const INTERACTION_BTN_CLASS =
  'flex items-center gap-1.5 rounded-extra-large px-2 py-2 min-h-[48px] min-w-[48px] justify-center touch-manipulation bg-transparent border-0 shadow-none hover:opacity-90 active:opacity-80 disabled:opacity-60'

/** Card styling by tier — Chameleon: bg-surface، حدود ذهبية رفيعة 0.5px، بدون خلفية صفراء. */
function getTierCardProps(tier: SubscriptionTier) {
  const baseChameleon = 'rounded-extra-large overflow-hidden !bg-surface border-[0.5px] border-primary shadow-none text-on-surface'
  switch (tier) {
    case 'premium':
      return {
        variant: 'chameleon' as const,
        elevation: 0 as const,
        className: `${baseChameleon} shadow-elev-2`,
        showPremiumBadge: true,
      }
    case 'gold':
      return {
        variant: 'chameleon' as const,
        elevation: 0 as const,
        className: baseChameleon,
        showPremiumBadge: false,
      }
    default:
      return {
        variant: 'chameleon' as const,
        elevation: 0 as const,
        className: baseChameleon,
        showPremiumBadge: false,
      }
  }
}

/** شارة بريميوم — ألوان من الثيم: surface, primary فقط */
function PremiumBadge() {
  return (
    <span
      className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-surface px-2 py-1 shadow-sm border-2 border-primary text-primary"
      aria-label={PREMIUM_ARIA}
    >
      <BadgeCheck size={14} className="flex-shrink-0" />
      <span className="text-label-small font-semibold">{PREMIUM_BADGE_LABEL}</span>
    </span>
  )
}

type BanCardProps =
  | { layout: 'places'; item: PlaceFeedItem }
  | { layout: 'posts'; item: PostFeedItem }
  | { layout: 'products'; item: ProductFeedItem }

function useInteractionToggle(
  entityId: string,
  entityType: 'place' | 'post' | 'product',
  currentLike: boolean,
  currentFavorite: boolean,
  onUpdate: (payload: { isLiked: boolean; isFavorited: boolean }) => void
) {
  const { user } = useAuthContext()

  const toggleLike = useCallback(async () => {
    if (!user?.id) return
    const nextLike = !currentLike
    const nextFavorite = nextLike ? false : currentFavorite
    onUpdate({ isLiked: nextLike, isFavorited: nextFavorite })

    await supabase.from('interactions').delete().eq('user_id', user.id).eq('entity_id', entityId).eq('entity_type', entityType)
    if (nextLike) {
      await supabase.from('interactions').insert({
        user_id: user.id,
        entity_id: entityId,
        entity_type: entityType,
        type: 'like',
      } as never)
    }
  }, [user?.id, entityId, entityType, currentLike, currentFavorite, onUpdate])

  const toggleFavorite = useCallback(async () => {
    if (!user?.id) return
    const nextFavorite = !currentFavorite
    const nextLike = nextFavorite ? false : currentLike
    onUpdate({ isLiked: nextLike, isFavorited: nextFavorite })

    await supabase.from('interactions').delete().eq('user_id', user.id).eq('entity_id', entityId).eq('entity_type', entityType)
    if (nextFavorite) {
      await supabase.from('interactions').insert({
        user_id: user.id,
        entity_id: entityId,
        entity_type: entityType,
        type: 'favorite',
      } as never)
    }
  }, [user?.id, entityId, entityType, currentLike, currentFavorite, onUpdate])

  return { toggleLike, toggleFavorite, canInteract: !!user?.id }
}

export function BanCardPlaces({ item, onInteractionUpdate }: { item: PlaceFeedItem; onInteractionUpdate?: (id: string, payload: { isLiked: boolean; isFavorited: boolean }) => void }) {
  const href = `/places/${item.id}`
  const tierProps = getTierCardProps(item.tier ?? DEFAULT_TIER)

  return (
    <Card
      variant={tierProps.variant}
      elevation={tierProps.elevation}
      padding="md"
      className={`relative ${tierProps.className}`}
    >
      {tierProps.showPremiumBadge && <PremiumBadge />}
      <Link
        href={href}
        className="card-trigger flex flex-col gap-3 cursor-pointer min-w-0 no-underline text-inherit"
        dir="rtl"
      >
        <div className="flex items-start gap-3 ps-1 pe-1">
          <div className="flex-1 min-w-0 text-start">
            <h3 className="text-title-medium text-primary font-semibold truncate">{item.name_ar}</h3>
            <p className="text-body-small text-on-surface-variant line-clamp-2 mt-0.5">{item.description_ar || item.description_en || ''}</p>
          </div>
          <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-[0.5px] border-primary bg-surface">
            {item.logo_url ? (
              <img src={item.logo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-title-medium">
                {item.name_ar?.[0] || '?'}
              </div>
            )}
          </div>
        </div>
        <PlaceStatsBar
          todayViews={item.today_views ?? 0}
          totalViews={item.total_views ?? 0}
          shareHref={href}
          placeName={item.name_ar ?? undefined}
          stopPropagation
        />
      </Link>
    </Card>
  )
}

/** يستخدم مكون المنشور الموحد (Post) — تعليق يفتح Bottom Sheet، دردشة تفتح الدرج الجانبي */
export function BanCardPosts({
  item,
  onInteractionUpdate,
  commentCountByEntityId,
  likeCountByEntityId,
}: {
  item: PostFeedItem
  onInteractionUpdate?: (id: string, payload: { isLiked: boolean; isFavorited: boolean }) => void
  /** أعداد التعليقات من useEntityCounts */
  commentCountByEntityId?: Record<string, number>
  /** أعداد الإعجابات من useEntityCounts */
  likeCountByEntityId?: Record<string, number>
}) {
  return (
    <Post
      item={item}
      onInteractionUpdate={onInteractionUpdate}
      commentCount={commentCountByEntityId?.[item.id] ?? 0}
      likeCount={likeCountByEntityId?.[item.id] ?? 0}
      showChat={true}
    />
  )
}

/**
 * كارت المنتج الموحد — نفس لغة المكان والمنشور:
 * flex-col، خلفية surface، حدود primary 0.5px، صورة بعرض الكارت وزوايا منحنية، ثم الهيدر (الاسم + السعر) ثم شريط التفاعل.
 */
export function BanCardProducts({ item, onInteractionUpdate }: { item: ProductFeedItem; onInteractionUpdate?: (id: string, payload: { isLiked: boolean; isFavorited: boolean }) => void }) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(item.isLiked)
  const [isFavorited, setIsFavorited] = useState(item.isFavorited)

  const imageUrl = item.images?.[0]?.image_url
  const canNavigate = isValidPlaceId(item.place_id)
  const href = canNavigate ? `/places/${item.place_id}?product=${item.id}` : '#'

  const handleUpdate = useCallback((payload: { isLiked: boolean; isFavorited: boolean }) => {
    setIsLiked(payload.isLiked)
    setIsFavorited(payload.isFavorited)
    onInteractionUpdate?.(item.id, payload)
  }, [item.id, onInteractionUpdate])

  const { toggleLike, toggleFavorite, canInteract } = useInteractionToggle(item.id, 'product', isLiked, isFavorited, handleUpdate)
  const tierProps = getTierCardProps(item.tier ?? DEFAULT_TIER)

  const content = (
    <>
      {/* صورة بعرض الكارت وزوايا منحنية (مثل المنشور) */}
      <div className="w-full aspect-[4/3] relative bg-surface overflow-hidden rounded-t-extra-large">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-title-large">
            {item.name_ar?.[0] || '?'}
          </div>
        )}
        <span className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-label-medium font-semibold min-h-[32px] flex items-center bg-surface/95 border-[0.5px] border-primary text-primary backdrop-blur-sm">
          {item.price != null ? `${item.price} ${item.currency}` : '—'}
        </span>
      </div>
      {/* الهيدر: الاسم + وصف سطر واحد */}
      <div className="p-3 pt-2 flex flex-col gap-1">
        <h3 className="text-title-small text-on-surface font-semibold line-clamp-2">{item.name_ar}</h3>
        {(item.description_ar || item.description_en) && (
          <p className="text-body-small text-on-surface-variant line-clamp-1">
            {item.description_ar || item.description_en}
          </p>
        )}
      </div>
      {/* شريط التفاعل (أيقونات ذهبية رفيعة بدون كتل لونية — مثل المنشور) */}
      <div className="px-3 pb-3 pt-0">
        <InteractionsBar
          isLiked={isLiked}
          isFavorited={isFavorited}
          onLike={toggleLike}
          onFavorite={toggleFavorite}
          onComment={() => canNavigate && router.push(`${href}#comments`)}
          canInteract={canInteract}
        />
      </div>
    </>
  )

  return (
    <Card
      variant={tierProps.variant}
      elevation={tierProps.elevation}
      padding="none"
      className={`relative flex flex-col overflow-hidden ${tierProps.className}`}
    >
      {tierProps.showPremiumBadge && <PremiumBadge />}
      {canNavigate ? (
        <Link href={href} className="card-trigger flex flex-col cursor-pointer no-underline text-inherit w-full" dir="rtl">
          {content}
        </Link>
      ) : (
        <div className="card-trigger flex flex-col w-full" dir="rtl">
          {content}
        </div>
      )}
    </Card>
  )
}

const ICON_CLASS = 'w-5 h-5 min-w-[20px] min-h-[20px]'

function InteractionsBar({
  isLiked,
  isFavorited,
  onLike,
  onFavorite,
  onComment,
  canInteract,
}: {
  isLiked: boolean
  isFavorited: boolean
  onLike: () => void
  onFavorite: () => void
  onComment: () => void
  canInteract: boolean
}) {
  return (
    <div className="flex items-center gap-4 min-h-[48px]">
      <Button
        type="button"
        variant="text"
        size="sm"
        onClick={(e) => { e.stopPropagation(); onLike(); }}
        disabled={!canInteract}
        className={`!min-h-0 !p-2 rounded-extra-large ${isLiked ? 'text-primary' : 'text-on-surface-variant'}`}
        aria-label={isLiked ? 'إلغاء الإعجاب' : 'إعجاب'}
      >
        <Heart size={20} className={ICON_CLASS} fill={isLiked ? 'currentColor' : 'transparent'} />
      </Button>
      <Button
        type="button"
        variant="text"
        size="sm"
        onClick={(e) => { e.stopPropagation(); onComment(); }}
        className="!min-h-0 !p-2 rounded-extra-large text-on-surface-variant"
        aria-label="تعليق"
      >
        <MessageCircle size={20} className={ICON_CLASS} />
      </Button>
      <Button
        type="button"
        variant="text"
        size="sm"
        onClick={(e) => { e.stopPropagation(); onFavorite(); }}
        disabled={!canInteract}
        className={`!min-h-0 !p-2 rounded-extra-large ${isFavorited ? 'text-primary' : 'text-on-surface-variant'}`}
        aria-label={isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
      >
        <Star size={20} className={ICON_CLASS} fill={isFavorited ? 'currentColor' : 'transparent'} />
      </Button>
    </div>
  )
}

export default function BanCard(
  props: BanCardProps & {
    onInteractionUpdate?: (id: string, payload: { isLiked: boolean; isFavorited: boolean }) => void
    /** أعداد التعليقات والإعجابات (لتبويب المنشورات) من useEntityCounts */
    commentCountByEntityId?: Record<string, number>
    likeCountByEntityId?: Record<string, number>
  }
) {
  const { onInteractionUpdate, commentCountByEntityId, likeCountByEntityId } = props
  if (props.layout === 'places') return <BanCardPlaces item={props.item} onInteractionUpdate={onInteractionUpdate} />
  if (props.layout === 'posts')
    return (
      <BanCardPosts
        item={props.item}
        onInteractionUpdate={onInteractionUpdate}
        commentCountByEntityId={commentCountByEntityId}
        likeCountByEntityId={likeCountByEntityId}
      />
    )
  return <BanCardProducts item={props.item} onInteractionUpdate={onInteractionUpdate} />
}
