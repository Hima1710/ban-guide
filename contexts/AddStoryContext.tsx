'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import BottomSheet from '@/components/m3/BottomSheet'
import AddStorySheetContent from '@/components/AddStorySheetContent'
import { TitleLarge } from '@/components/m3'

export interface AddStoryContextValue {
  /** فتح شيت إضافة الحالة لمكان معيّن */
  openAddStorySheet: (placeId: string, placeName?: string | null) => void
  /** إغلاق الشيت */
  closeAddStorySheet: () => void
  /** هل الشيت مفتوح */
  isAddStorySheetOpen: boolean
}

const AddStoryContext = createContext<AddStoryContextValue | undefined>(undefined)

export function useAddStorySheet(): AddStoryContextValue {
  const ctx = useContext(AddStoryContext)
  if (ctx === undefined) {
    throw new Error('useAddStorySheet must be used within AddStoryProvider')
  }
  return ctx
}

interface AddStoryProviderProps {
  children: ReactNode
  /** يُستدعى بعد إضافة حالة بنجاح (مثلاً لتحديث قائمة الحالات في الصفحة الرئيسية) */
  onStoryAdded?: () => void
}

type SheetState = { open: false } | { open: true; placeId: string; placeName: string | null }

export function AddStoryProvider({ children, onStoryAdded }: AddStoryProviderProps) {
  const [sheet, setSheet] = useState<SheetState>({ open: false })

  const openAddStorySheet = useCallback((pId: string, pName?: string | null) => {
    setSheet({ open: true, placeId: pId, placeName: pName ?? null })
  }, [])

  const closeAddStorySheet = useCallback(() => {
    setSheet({ open: false })
  }, [])

  const handleStoryAdded = useCallback(() => {
    onStoryAdded?.()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('add-story-success'))
    }
    closeAddStorySheet()
  }, [onStoryAdded, closeAddStorySheet])

  const value: AddStoryContextValue = {
    openAddStorySheet,
    closeAddStorySheet,
    isAddStorySheetOpen: sheet.open,
  }

  const sheetNode = sheet.open ? (
    <BottomSheet
      key={`add-story-${sheet.placeId}`}
      open={true}
      onClose={closeAddStorySheet}
      title={
        sheet.placeName ? (
          <TitleLarge as="span">إضافة حالة — {sheet.placeName}</TitleLarge>
        ) : (
          <TitleLarge as="span">إضافة حالة</TitleLarge>
        )
      }
      maxHeightRatio={0.75}
    >
      <AddStorySheetContent
        placeId={sheet.placeId}
        onSuccess={handleStoryAdded}
        onCancel={closeAddStorySheet}
      />
    </BottomSheet>
  ) : null

  return (
    <AddStoryContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' && createPortal(sheetNode, document.body)}
    </AddStoryContext.Provider>
  )
}
