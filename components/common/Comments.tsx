/**
 * مكون التعليقات الموحد — Real-time + Optimistic UI + useTheme.
 * Realtime: Supabase postgres_changes على comments لظهور التعليقات فوراً.
 * Optimistic: إظهار التعليق فور الإرسال بـ opacity خفيفة (Chameleon) حتى التأكيد من الخادم.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Send, MessageCircleReply } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { fetchComments, addComment, type Comment, type CommentEntityType } from '@/lib/api/comments'
import Button from '@/components/common/Button'
import VirtualList from '@/components/common/VirtualList'
import { BodyMedium, BodySmall, LabelSmall } from '@/components/m3'

const PLACEHOLDER = 'اكتب تعليقاً...'
const ENTITY_DEFAULT: CommentEntityType = 'post'
const OPTIMISTIC_OPACITY = 0.65

export interface CommentsProps {
  /** معرّف المنشور/المنتج/المكان */
  entityId: string
  /** نوع الـ entity — افتراضي post */
  entityType?: CommentEntityType
  /** حد أقصى لارتفاع قائمة التعليقات (مثلاً لـ Bottom Sheet) */
  maxHeight?: string
  className?: string
}

function CommentItem({
  comment,
  isReply,
  isOptimistic,
  onReply,
  canReply,
}: {
  comment: Comment
  isReply?: boolean
  isOptimistic?: boolean
  onReply: (c: Comment) => void
  canReply: boolean
}) {
  return (
    <div
      className={`flex gap-3 items-start rounded-section bg-surface border-[0.5px] border-outline transition-opacity duration-300 ${isReply ? 'mr-6 border-r-2 border-r-primary/40' : ''}`}
      style={{
        padding: 'var(--main-padding)',
        ...(isOptimistic ? { opacity: OPTIMISTIC_OPACITY } : {}),
      }}
    >
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-outline bg-surface">
        {comment.author?.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-label-small">
            {(comment.author?.full_name || '?').trim()[0] || '?'}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <LabelSmall color="primary" className="font-semibold">
            {comment.author?.full_name?.trim() || 'مستخدم'}
          </LabelSmall>
          <BodySmall color="onSurfaceVariant">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ar })}
          </BodySmall>
        </div>
        <BodyMedium color="onSurface" className="mt-0.5 break-words whitespace-pre-wrap">
          {comment.content}
        </BodyMedium>
        {canReply && !isOptimistic && (
          <Button
            type="button"
            variant="text"
            size="sm"
            onClick={() => onReply(comment)}
            className="!min-h-0 !p-1 mt-1 text-on-surface-variant"
            aria-label="رد على التعليق"
          >
            <MessageCircleReply size={16} className="w-4 h-4 ml-1" />
            <span className="text-label-small">رد</span>
          </Button>
        )}
      </div>
    </div>
  )
}

/** قائمة ردود — يمكن أن تحتوي كل منها على ردود فرعية (متداخلة) */
function RepliesList({
  replies,
  onReply,
  canReply,
}: {
  replies: Comment[]
  onReply: (c: Comment) => void
  canReply: boolean
}) {
  return (
    <ul className="flex flex-col gap-element list-none p-0 m-0 mr-2">
      {replies.map((r) => (
        <li key={r.id} className="space-y-2">
          <CommentItem
            comment={r}
            isReply
            isOptimistic={r.optimistic}
            onReply={onReply}
            canReply={canReply}
          />
          {r.replies && r.replies.length > 0 && (
            <RepliesList
              replies={r.replies}
              onReply={onReply}
              canReply={canReply}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

export default function Comments({
  entityId,
  entityType = ENTITY_DEFAULT,
  maxHeight = '50vh',
  className = '',
}: CommentsProps) {
  const { user, profile } = useAuthContext()
  const { colors } = useTheme()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  /** تعليق متفائل (Optimistic) — يظهر فوراً بـ opacity خفيفة حتى التأكيد من الخادم */
  const [optimisticComment, setOptimisticComment] = useState<Comment | null>(null)
  const loadingRef = useRef(false)
  const commentsListRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async (silent = false) => {
    if (!entityId) return
    if (!silent) setLoading(true)
    loadingRef.current = true
    setError(null)
    try {
      const list = await fetchComments(entityId, entityType)
      setComments(list)
    } catch {
      if (!silent) setError('تعذر تحميل التعليقات')
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [entityId, entityType])

  useEffect(() => {
    load()
  }, [load])

  /* Realtime: الاشتراك في INSERT على comments — ظهور التعليقات فوراً لكل المستخدمين دون ريفريش */
  useEffect(() => {
    if (!entityId || !isSupabaseConfigured()) return
    const channel = supabase
      .channel(`comments:${entityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `entity_id=eq.${entityId}`,
        },
        () => {
          load(true)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [entityId, load])

  const handleReplyClick = useCallback((c: Comment) => {
    setReplyingTo(c)
  }, [])

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || !user?.id || sending) return
    const parentId = replyingTo?.id ?? null
    setError(null)

    /* Optimistic UI: إظهار التعليق فوراً بـ opacity خفيفة (Chameleon) حتى التأكيد من الخادم */
    const optimistic: Comment = {
      id: `opt-${Date.now()}`,
      user_id: user.id,
      entity_id: entityId,
      entity_type: entityType,
      content: trimmed,
      created_at: new Date().toISOString(),
      parent_id: parentId,
      author: {
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      },
      optimistic: true,
    }
    setOptimisticComment(optimistic)
    setSending(true)
    setText('')
    setReplyingTo(null)

    try {
      const result = await addComment(entityId, entityType, trimmed, user.id, parentId)
      if (!result) setError('تعذر إرسال التعليق')
      /* التحديث الفعلي للقائمة يتم عبر Realtime (INSERT) أو التحديث الصامت إن لم يصل الحدث فوراً */
      if (result) load(true)
    } catch {
      setError('تعذر إرسال التعليق')
    } finally {
      setOptimisticComment(null)
      setSending(false)
    }
  }, [entityId, entityType, text, user?.id, sending, replyingTo?.id, profile?.full_name, profile?.avatar_url, load])

  const canSend = !!user?.id && text.trim().length > 0 && !sending
  const placeholder = replyingTo
    ? `الرد على ${(replyingTo.author?.full_name || 'مستخدم').trim()}...`
    : PLACEHOLDER

  return (
    <div
      className={`flex flex-col w-full text-on-surface ${className}`}
      style={{ color: colors.onSurface }}
      dir="rtl"
    >
      {/* قائمة التعليقات + الردود — VirtualList عند وجود تعليقات؛ مسافات MD3 */}
      <div
        ref={commentsListRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ maxHeight }}
      >
        {loading ? (
          <ul className="space-y-3 py-2 list-none p-0 m-0 gap-element" aria-hidden style={{ padding: 'var(--main-padding)' }}>
            {[1, 2, 3].map((i) => (
              <li key={i} className="flex gap-3 items-start rounded-section p-main bg-surface border border-outline/50">
                <div
                  className="skeleton-shimmer w-8 h-8 rounded-full flex-shrink-0 bg-on-surface-variant/20"
                  style={{ minWidth: 32, minHeight: 32 }}
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="skeleton-shimmer rounded-lg bg-on-surface-variant/20"
                      style={{ height: 14, width: 100, minHeight: 14 }}
                    />
                    <div
                      className="skeleton-shimmer rounded-lg bg-on-surface-variant/20"
                      style={{ height: 12, width: 64, minHeight: 12 }}
                    />
                  </div>
                  <div
                    className="skeleton-shimmer rounded-lg bg-on-surface-variant/20"
                    style={{ height: 14, width: '90%', minHeight: 14 }}
                  />
                  <div
                    className="skeleton-shimmer rounded-lg bg-on-surface-variant/20"
                    style={{ height: 14, width: '70%', minHeight: 14 }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="py-4 p-main">
            <BodySmall color="error">{error}</BodySmall>
          </div>
        ) : comments.length === 0 && !optimisticComment ? (
          <div className="py-6 text-center p-main">
            <BodyMedium color="onSurfaceVariant">لا تعليقات بعد. كن أول من يعلق.</BodyMedium>
          </div>
        ) : (
          <>
            <VirtualList<Comment>
              items={comments}
              scrollElementRef={commentsListRef}
              estimateSize={100}
              getItemKey={(c) => c.id}
              className="py-2 list-none p-0 m-0"
              renderItem={(c) => (
                <div style={{ paddingBottom: 'var(--element-gap)' }}>
                  <div className="space-y-2">
                    <CommentItem
                      comment={c}
                      isOptimistic={c.optimistic}
                      onReply={handleReplyClick}
                      canReply={!!user}
                    />
                    {c.replies && c.replies.length > 0 && (
                      <RepliesList
                        replies={c.replies}
                        onReply={handleReplyClick}
                        canReply={!!user}
                      />
                    )}
                  </div>
                </div>
              )}
            />
            {/* تعليق متفائل (Optimistic) — يظهر فور الإرسال حتى التأكيد من الخادم */}
            {optimisticComment && (
              <div className="p-main" style={{ paddingTop: 0 }}>
                <div className="space-y-2">
                  <CommentItem
                    comment={optimisticComment}
                    isReply={!!optimisticComment.parent_id}
                    isOptimistic
                    onReply={handleReplyClick}
                    canReply={!!user}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* حقل الكتابة + إرسال — مع إظهار "الرد على X" عند الرد */}
      {user ? (
        <div className="flex flex-col gap-2 shrink-0 pt-3 pb-1 border-t border-outline mt-2">
          {replyingTo && (
            <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-surface border-[0.5px] border-primary/50">
              <BodySmall color="onSurfaceVariant">
                الرد على: {(replyingTo.author?.full_name || 'مستخدم').trim()}
              </BodySmall>
              <Button
                type="button"
                variant="text"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="!min-h-0 !p-1 text-on-surface-variant"
                aria-label="إلغاء الرد"
              >
                إلغاء
              </Button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={placeholder}
              rows={2}
              className="flex-1 min-h-[48px] max-h-[120px] resize-y rounded-xl px-3 py-2 text-body-medium bg-surface border-[0.5px] border-primary text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              disabled={sending}
              aria-label={placeholder}
            />
            <Button
              type="button"
              variant="filled"
              size="sm"
              onClick={handleSend}
              disabled={!canSend}
              className="!min-h-[48px] !px-4 shrink-0"
              aria-label={replyingTo ? 'إرسال الرد' : 'إرسال التعليق'}
            >
              <Send size={20} className="w-5 h-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="pt-3 pb-1 border-t border-outline mt-2">
          <BodySmall color="onSurfaceVariant">سجّل الدخول لكتابة تعليق أو رد.</BodySmall>
        </div>
      )}
    </div>
  )
}
