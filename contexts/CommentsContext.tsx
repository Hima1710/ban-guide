'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { BottomSheet, TitleLarge } from '@/components/m3'
import Comments from '@/components/common/Comments'
import type { CommentEntityType } from '@/lib/api/comments'

export type OpenCommentsSheetFn = (postId: string, placeId?: string | null) => void

export type OpenCommentsSheetForEntityFn = (
  entityId: string,
  entityType: CommentEntityType,
  placeId?: string | null
) => void

type CommentsContextValue = {
  openCommentsSheet: OpenCommentsSheetFn
  /** فتح شيت التعليقات لأي entity (منشور، منتج، مكان) — للنظام الموحد (مثل تاب الفيديوهات) */
  openCommentsSheetForEntity: OpenCommentsSheetForEntityFn
  closeCommentsSheet: () => void
  isCommentsSheetOpen: boolean
  /** المعرّف الحالي للمنشور المعروضة تعليقاته */
  postId: string | null
  /** معرّف المكان (للتوجيه أو جلب التعليقات لاحقاً) */
  placeId: string | null
  /** نوع الـ entity المعروضة تعليقاته */
  entityType: CommentEntityType | null
}

const CommentsContext = createContext<CommentsContextValue | null>(null)

export function CommentsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean
    entityId: string | null
    entityType: CommentEntityType | null
    placeId: string | null
  }>({ open: false, entityId: null, entityType: null, placeId: null })

  const openCommentsSheetForEntity = useCallback(
    (entityId: string, entityType: CommentEntityType, placeId?: string | null) => {
      setState({ open: true, entityId, entityType, placeId: placeId ?? null })
    },
    []
  )

  const openCommentsSheet = useCallback((postId: string, placeId?: string | null) => {
    openCommentsSheetForEntity(postId, 'post', placeId ?? null)
  }, [openCommentsSheetForEntity])

  const closeCommentsSheet = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
  }, [])

  const value: CommentsContextValue = {
    openCommentsSheet,
    openCommentsSheetForEntity,
    closeCommentsSheet,
    isCommentsSheetOpen: state.open,
    postId: state.entityType === 'post' ? state.entityId : null,
    placeId: state.placeId,
    entityType: state.entityType,
  }

  const sheetNode =
    state.open && state.entityId && state.entityType && typeof document !== 'undefined' ? (
      <BottomSheet
        key={`comments-${state.entityType}-${state.entityId}`}
        open={true}
        onClose={closeCommentsSheet}
        title={<TitleLarge as="span">التعليقات</TitleLarge>}
        maxHeightRatio={0.65}
      >
        <Comments
          entityId={state.entityId}
          entityType={state.entityType}
          maxHeight="45vh"
        />
      </BottomSheet>
    ) : null

  /* استدعاء createPortal دائماً (حتى عند الإغلاق بـ null) لتفريغ الـ portal وإزالة الـ Bottom Sheet من الـ DOM وإعادة التمرير */
  return (
    <CommentsContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' && createPortal(sheetNode, document.body)}
    </CommentsContext.Provider>
  )
}

export function useCommentsContext(): CommentsContextValue {
  const ctx = useContext(CommentsContext)
  if (!ctx) {
    throw new Error('useCommentsContext must be used within CommentsProvider')
  }
  return ctx
}

export function useCommentsContextOptional(): CommentsContextValue | null {
  return useContext(CommentsContext)
}
