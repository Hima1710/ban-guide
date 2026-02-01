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

export type OpenCommentsSheetFn = (postId: string, placeId?: string | null) => void

type CommentsContextValue = {
  openCommentsSheet: OpenCommentsSheetFn
  closeCommentsSheet: () => void
  isCommentsSheetOpen: boolean
  /** المعرّف الحالي للمنشور المعروضة تعليقاته */
  postId: string | null
  /** معرّف المكان (للتوجيه أو جلب التعليقات لاحقاً) */
  placeId: string | null
}

const CommentsContext = createContext<CommentsContextValue | null>(null)

export function CommentsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    open: boolean
    postId: string | null
    placeId: string | null
  }>({ open: false, postId: null, placeId: null })

  const openCommentsSheet = useCallback((postId: string, placeId?: string | null) => {
    setState({ open: true, postId, placeId: placeId ?? null })
  }, [])

  const closeCommentsSheet = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
  }, [])

  const value: CommentsContextValue = {
    openCommentsSheet,
    closeCommentsSheet,
    isCommentsSheetOpen: state.open,
    postId: state.postId,
    placeId: state.placeId,
  }

  const sheetNode =
    state.open && state.postId && typeof document !== 'undefined' ? (
      <BottomSheet
        key={`comments-${state.postId}`}
        open={true}
        onClose={closeCommentsSheet}
        title={<TitleLarge as="span">التعليقات</TitleLarge>}
        maxHeightRatio={0.65}
      >
        <Comments
          entityId={state.postId}
          entityType="post"
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
