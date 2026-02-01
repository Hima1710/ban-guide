/**
 * المنشور الموحد (Unified Post) — MD3، خلفية فحمية، حدود ذهبية رفيعة.
 * flex-col: Header (صورة الناشر + الاسم + وقت النشر) → Body (صورة بزوايا منحنية أو نص) → Footer (شريط التفاعل).
 * التعليق 💬 يفتح Bottom Sheet؛ الدردشة تفتح الدرج الجانبي.
 */

'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Heart, MessageCircle, MessageSquare, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useCommentsContextOptional } from '@/contexts/CommentsContext'
import { useConversationContextOptional } from '@/contexts/ConversationContext'
import Button from '@/components/common/Button'
import type { PostFeedItem } from '@/hooks/useUnifiedFeed'

const PLACEHOLDER_NAME = 'مكان'
const ICON_CLASS = 'w-5 h-5 min-w-[20px] min-h-[20px]'

function useInteractionToggle(
  entityId: string,
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
    await supabase
      .from('interactions')
      .delete()
      .eq('user_id', user.id)
      .eq('entity_id', entityId)
      .eq('entity_type', 'post')
    if (nextLike) {
      await supabase.from('interactions').insert({
        user_id: user.id,
        entity_id: entityId,
        entity_type: 'post',
        type: 'like',
      } as never)
    }
  }, [user?.id, entityId, currentLike, currentFavorite, onUpdate])

  const toggleFavorite = useCallback(async () => {
    if (!user?.id) return
    const nextFavorite = !currentFavorite
    const nextLike = nextFavorite ? false : currentLike
    onUpdate({ isLiked: nextLike, isFavorited: nextFavorite })
    await supabase
      .from('interactions')
      .delete()
      .eq('user_id', user.id)
      .eq('entity_id', entityId)
      .eq('entity_type', 'post')
    if (nextFavorite) {
      await supabase.from('interactions').insert({
        user_id: user.id,
        entity_id: entityId,
        entity_type: 'post',
        type: 'favorite',
      } as never)
    }
  }, [user?.id, entityId, currentLike, currentFavorite, onUpdate])

  return { toggleLike, toggleFavorite, canInteract: !!user?.id }
}

export interface PostProps {
  item: PostFeedItem
  onInteractionUpdate?: (id: string, payload: { isLiked: boolean; isFavorited: boolean }) => void
  /** عدد التعليقات (من النظام الموحد — useEntityCounts) */
  commentCount?: number
  /** عدد الإعجابات (من النظام الموحد — useEntityCounts) */
  likeCount?: number
  /** عرض زر الدردشة لفتح Conversation Drawer */
  showChat?: boolean
  /** عند النقر على المنشور (الانتقال لصفحة المكان) */
  onClick?: () => void
}

export default function Post({
  item,
  onInteractionUpdate,
  commentCount = 0,
  likeCount = 0,
  showChat = false,
  onClick,
}: PostProps) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(item.isLiked)
  const [isFavorited, setIsFavorited] = useState(item.isFavorited)
  const commentsContext = useCommentsContextOptional()
  const conversationContext = useConversationContextOptional()

  const place = item.place as { id?: string; name_ar?: string; logo_url?: string; user_id?: string } | undefined
  const placeId = place?.id
  const href = placeId ? `/places/${placeId}` : '#'

  const handleUpdate = useCallback(
    (payload: { isLiked: boolean; isFavorited: boolean }) => {
      setIsLiked(payload.isLiked)
      setIsFavorited(payload.isFavorited)
      onInteractionUpdate?.(item.id, payload)
    },
    [item.id, onInteractionUpdate]
  )

  const { toggleLike, toggleFavorite, canInteract } = useInteractionToggle(
    item.id,
    isLiked,
    isFavorited,
    handleUpdate
  )

  const handleComment = useCallback(() => {
    if (commentsContext?.openCommentsSheet) {
      commentsContext.openCommentsSheet(item.id, placeId ?? undefined)
    } else if (placeId) {
      router.push(`${href}#comments`)
    }
  }, [commentsContext, item.id, placeId, href, router])

  const handleChat = useCallback(() => {
    if (placeId && place?.user_id && conversationContext?.openConversation) {
      conversationContext.openConversation(placeId, place.user_id)
    }
  }, [placeId, place?.user_id, conversationContext])

  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick()
    } else if (placeId) {
      router.push(href)
    }
  }, [onClick, placeId, href, router])

  const postImage = item.image_url || item.video_url
  const publishedAt = item.created_at
    ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ar })
    : ''

  return (
    <article
      className="post-card-chameleon flex flex-col w-full rounded-extra-large overflow-hidden bg-surface border-[0.5px] border-primary text-on-surface shadow-elev-0 min-h-[48px]"
      dir="rtl"
    >
      {/* Header: خلفية شفافة/فحمية، اسم الناشر ذهبي فقط — Chameleon */}
      <div
        className="post-header-trigger flex flex-col gap-1 p-3 pb-0 ps-1 pe-1 cursor-pointer shrink-0 bg-transparent"
        onClick={handleCardClick}
        onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
        role="button"
        tabIndex={0}
        aria-label={`الانتقال إلى ${place?.name_ar || PLACEHOLDER_NAME}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-[0.5px] border-primary bg-surface">
            {place?.logo_url ? (
              <img src={place.logo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-label-large">
                {place?.name_ar?.[0] || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5">
            <span className="text-title-small text-primary font-medium truncate w-full">
              {place?.name_ar || PLACEHOLDER_NAME}
            </span>
            {publishedAt && (
              <span className="text-label-small text-on-surface-variant">
                {publishedAt}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body: صورة بعرض الكارت كامل + زوايا منحنية، ثم النص */}
      {postImage && (
        <div className="w-full mt-3 px-2 pb-0">
          <div className="w-full overflow-hidden rounded-xl aspect-video bg-surface">
            <img
              src={item.image_url || ''}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      )}
      {item.content && (
        <p
          className="text-body-medium text-on-surface p-3 pt-2 line-clamp-2 cursor-pointer shrink-0"
          onClick={handleCardClick}
          onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
          role="button"
          tabIndex={0}
        >
          {item.content}
        </p>
      )}

      {/* Footer: شريط تفاعل — أيقونات ذهبية رفيعة بدون كتل لونية (Chameleon) */}
      <div className="post-interaction-bar flex items-center gap-2 px-3 pb-3 pt-2 min-h-[48px] shrink-0">
        <Button
          type="button"
          variant="text"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            toggleLike()
          }}
          disabled={!canInteract}
          className={`!min-h-0 !p-2 rounded-extra-large flex items-center gap-1 ${isLiked ? 'text-primary' : 'text-on-surface-variant'}`}
          aria-label={likeCount > 0 ? `${likeCount} إعجاب` : isLiked ? 'إلغاء الإعجاب' : 'إعجاب'}
        >
          <Heart size={20} className={ICON_CLASS} fill={isLiked ? 'currentColor' : 'transparent'} />
          {likeCount > 0 && (
            <span className="text-label-small min-w-[1.25rem] text-center">{likeCount}</span>
          )}
        </Button>
        <Button
          type="button"
          variant="text"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleComment()
          }}
          className="!min-h-0 !p-2 rounded-extra-large text-on-surface-variant flex items-center gap-1"
          aria-label={commentCount > 0 ? `${commentCount} تعليق` : 'تعليق'}
        >
          <MessageCircle size={20} className={ICON_CLASS} />
          {commentCount > 0 && (
            <span className="text-label-small min-w-[1.25rem] text-center">{commentCount}</span>
          )}
        </Button>
        {showChat && placeId && place?.user_id && (
          <Button
            type="button"
            variant="text"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleChat()
            }}
            className="!min-h-0 !p-2 rounded-extra-large text-on-surface-variant"
            aria-label="دردشة"
          >
            <MessageSquare size={20} className={ICON_CLASS} />
          </Button>
        )}
        <Button
          type="button"
          variant="text"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite()
          }}
          disabled={!canInteract}
          className={`!min-h-0 !p-2 rounded-extra-large ${isFavorited ? 'text-primary' : 'text-on-surface-variant'}`}
          aria-label={isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
          <Star size={20} className={ICON_CLASS} fill={isFavorited ? 'currentColor' : 'transparent'} />
        </Button>
      </div>
    </article>
  )
}
