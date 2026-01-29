'use client'

import { useRouter } from 'next/navigation'
import { BadgeCheck, Heart, MessageCircle, Star, UserPlus } from 'lucide-react'
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { Card, Button } from '@/components/common'
import type { PlaceFeedItem, PostFeedItem, ProductFeedItem, SubscriptionTier } from '@/hooks/useUnifiedFeed'

const DEFAULT_TIER: SubscriptionTier = 'basic'
const PLACEHOLDER_NAME = 'مكان'
const PREMIUM_BADGE_LABEL = 'بريميوم'
const PREMIUM_ARIA = 'معتمد / بريميوم'
const INTERACTION_BTN_CLASS =
  'flex items-center gap-1.5 rounded-extra-large px-2 py-2 min-h-[48px] min-w-[48px] justify-center touch-manipulation'

/** Card styling by tier: bg-surface (Dark Charcoal), Royal Gold only for borders/icons/titles. */
function getTierCardProps(tier: SubscriptionTier) {
  switch (tier) {
    case 'premium':
      return {
        variant: 'elevated' as const,
        elevation: 4 as const,
        className: 'rounded-extra-large overflow-hidden !bg-surface border-2 border-primary shadow-[0_6px_10px_4px_rgba(0,0,0,0.15)]',
        showPremiumBadge: true,
      }
    case 'gold':
      return {
        variant: 'outlined' as const,
        elevation: 0 as const,
        className: 'rounded-extra-large overflow-hidden !bg-surface border-2 border-primary shadow-none',
        showPremiumBadge: false,
      }
    default:
      return {
        variant: 'outlined' as const,
        elevation: 0 as const,
        className: 'rounded-extra-large overflow-hidden !bg-surface border-2 border-outline shadow-none',
        showPremiumBadge: false,
      }
  }
}

function PremiumBadge() {
  return (
    <span
      className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-surface px-2 py-1 shadow-sm border border-primary"
      aria-label={PREMIUM_ARIA}
    >
      <BadgeCheck size={14} className="text-primary flex-shrink-0" />
      <span className="text-label-small text-primary font-semibold">{PREMIUM_BADGE_LABEL}</span>
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
        interaction_type: 'like',
      })
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
        interaction_type: 'favorite',
      })
    }
  }, [user?.id, entityId, entityType, currentLike, currentFavorite, onUpdate])

  return { toggleLike, toggleFavorite, canInteract: !!user?.id }
}

export function BanCardPlaces({ item, onInteractionUpdate }: { item: PlaceFeedItem; onInteractionUpdate?: (id: string, payload: { isLiked: boolean; isFavorited: boolean }) => void }) {
  const router = useRouter()
  const { user } = useAuthContext()
  const [isLiked, setIsLiked] = useState(item.isLiked)
  const [isFavorited, setIsFavorited] = useState(item.isFavorited)
  const [isFollowing, setIsFollowing] = useState(false)

  const handleUpdate = useCallback((payload: { isLiked: boolean; isFavorited: boolean }) => {
    setIsLiked(payload.isLiked)
    setIsFavorited(payload.isFavorited)
    onInteractionUpdate?.(item.id, payload)
  }, [item.id, onInteractionUpdate])

  const { toggleLike, toggleFavorite, canInteract } = useInteractionToggle(item.id, 'place', isLiked, isFavorited, handleUpdate)

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
      <div
        className="flex flex-col gap-3 cursor-pointer"
        onClick={() => router.push(href)}
        onKeyDown={(e) => e.key === 'Enter' && router.push(href)}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-start gap-3">
          <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary bg-surface">
            {item.logo_url ? (
              <img src={item.logo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-title-medium">
                {item.name_ar?.[0] || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-title-medium text-primary font-semibold truncate">{item.name_ar}</h3>
            <p className="text-body-small text-on-surface-variant line-clamp-2 mt-0.5">{item.description_ar || item.description_en || ''}</p>
          </div>
          {user?.id && (
            <Button
              variant={isFollowing ? 'text' : 'outlined'}
              size="sm"
              className="shrink-0"
              onClick={async (e) => {
                e.stopPropagation()
                const next = !isFollowing
                setIsFollowing(next)
                if (next) {
                  await supabase.from('follows').insert({ follower_id: user.id, place_id: item.id })
                } else {
                  await supabase.from('follows').delete().eq('follower_id', user.id).eq('place_id', item.id)
                }
              }}
            >
              <UserPlus size={16} />
              {isFollowing ? 'متابع' : 'متابعة'}
            </Button>
          )}
        </div>
        <InteractionsBar
          isLiked={isLiked}
          isFavorited={isFavorited}
          onLike={toggleLike}
          onFavorite={toggleFavorite}
          onComment={() => router.push(`${href}#comments`)}
          canInteract={canInteract}
        />
      </div>
    </Card>
  )
}

export function BanCardPosts({ item, onInteractionUpdate }: { item: PostFeedItem; onInteractionUpdate?: (id: string, payload: { isLiked: boolean; isFavorited: boolean }) => void }) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(item.isLiked)
  const [isFavorited, setIsFavorited] = useState(item.isFavorited)

  const place = item.place as { id?: string; name_ar?: string; logo_url?: string } | undefined
  const href = place?.id ? `/places/${place.id}` : '#'
  const postImage = item.image_url || item.video_url

  const handleUpdate = useCallback((payload: { isLiked: boolean; isFavorited: boolean }) => {
    setIsLiked(payload.isLiked)
    setIsFavorited(payload.isFavorited)
    onInteractionUpdate?.(item.id, payload)
  }, [item.id, onInteractionUpdate])

  const { toggleLike, toggleFavorite, canInteract } = useInteractionToggle(item.id, 'post', isLiked, isFavorited, handleUpdate)
  const tierProps = getTierCardProps(item.tier ?? DEFAULT_TIER)

  return (
    <Card
      variant={tierProps.variant}
      elevation={tierProps.elevation}
      padding="none"
      className={`relative ${tierProps.className}`}
    >
      {tierProps.showPremiumBadge && <PremiumBadge />}
      <div
        className="cursor-pointer"
        onClick={() => place?.id && router.push(`/places/${place.id}`)}
        onKeyDown={(e) => place?.id && e.key === 'Enter' && router.push(`/places/${place.id}`)}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3 p-3 pb-0">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary bg-surface">
            {place?.logo_url ? (
              <img src={place.logo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-label-large">
                {place?.name_ar?.[0] || '?'}
              </div>
            )}
          </div>
          <span className="text-title-small text-primary font-medium truncate">{place?.name_ar || PLACEHOLDER_NAME}</span>
        </div>
        {postImage && (
          <div className="aspect-video w-full mt-3 relative bg-surface">
            <img
              src={item.image_url || ''}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        {item.content && (
          <p className="text-body-medium text-on-surface p-3 pt-2 line-clamp-2">{item.content}</p>
        )}
      </div>
      <div className="px-3 pb-3">
        <InteractionsBar
          isLiked={isLiked}
          isFavorited={isFavorited}
          onLike={toggleLike}
          onFavorite={toggleFavorite}
          onComment={() => place?.id && router.push(`/places/${place.id}#comments`)}
          canInteract={canInteract}
        />
      </div>
    </Card>
  )
}

export function BanCardProducts({ item, onInteractionUpdate }: { item: ProductFeedItem; onInteractionUpdate?: (id: string, payload: { isLiked: boolean; isFavorited: boolean }) => void }) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(item.isLiked)
  const [isFavorited, setIsFavorited] = useState(item.isFavorited)

  const imageUrl = item.images?.[0]?.image_url
  const href = `/places/${item.place_id}?product=${item.id}`

  const handleUpdate = useCallback((payload: { isLiked: boolean; isFavorited: boolean }) => {
    setIsLiked(payload.isLiked)
    setIsFavorited(payload.isFavorited)
    onInteractionUpdate?.(item.id, payload)
  }, [item.id, onInteractionUpdate])

  const { toggleLike, toggleFavorite, canInteract } = useInteractionToggle(item.id, 'product', isLiked, isFavorited, handleUpdate)
  const tierProps = getTierCardProps(item.tier ?? DEFAULT_TIER)

  return (
    <Card
      variant={tierProps.variant}
      elevation={tierProps.elevation}
      padding="none"
      className={`relative ${tierProps.className}`}
    >
      {tierProps.showPremiumBadge && <PremiumBadge />}
      <div
        className="cursor-pointer"
        onClick={() => router.push(href)}
        onKeyDown={(e) => e.key === 'Enter' && router.push(href)}
        role="button"
        tabIndex={0}
      >
        <div className="aspect-square w-full relative bg-surface">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-title-large">
              {item.name_ar?.[0] || '?'}
            </div>
          )}
          <span className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-label-medium font-semibold min-h-[32px] flex items-center bg-surface border border-primary text-primary">
            {item.price != null ? `${item.price} ${item.currency}` : '—'}
          </span>
        </div>
        <div className="p-3">
          <h3 className="text-title-small text-on-surface font-semibold line-clamp-2">{item.name_ar}</h3>
          <InteractionsBar
            isLiked={isLiked}
            isFavorited={isFavorited}
            onLike={toggleLike}
            onFavorite={toggleFavorite}
            onComment={() => router.push(`${href}#comments`)}
            canInteract={canInteract}
          />
        </div>
      </div>
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
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onLike(); }}
        disabled={!canInteract}
        className={`${INTERACTION_BTN_CLASS} ${isLiked ? 'text-primary' : 'text-on-surface-variant'}`}
        aria-label={isLiked ? 'إلغاء الإعجاب' : 'إعجاب'}
      >
        <Heart size={20} className={ICON_CLASS} fill={isLiked ? 'currentColor' : 'transparent'} />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onComment(); }}
        className={`${INTERACTION_BTN_CLASS} text-on-surface-variant`}
        aria-label="تعليق"
      >
        <MessageCircle size={20} className={ICON_CLASS} />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onFavorite(); }}
        disabled={!canInteract}
        className={`${INTERACTION_BTN_CLASS} ${isFavorited ? 'text-primary' : 'text-on-surface-variant'}`}
        aria-label={isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
      >
        <Star size={20} className={ICON_CLASS} fill={isFavorited ? 'currentColor' : 'transparent'} />
      </button>
    </div>
  )
}

export default function BanCard(props: BanCardProps & { onInteractionUpdate?: (id: string, payload: { isLiked: boolean; isFavorited: boolean }) => void }) {
  const { onInteractionUpdate } = props
  if (props.layout === 'places') return <BanCardPlaces item={props.item} onInteractionUpdate={onInteractionUpdate} />
  if (props.layout === 'posts') return <BanCardPosts item={props.item} onInteractionUpdate={onInteractionUpdate} />
  return <BanCardProducts item={props.item} onInteractionUpdate={onInteractionUpdate} />
}
