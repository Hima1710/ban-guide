'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

export interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** عنوان اختياري يظهر فوق المحتوى */
  title?: React.ReactNode
  /** أقصى ارتفاع كنسبة من الشاشة (0–1)، افتراضي 0.85 */
  maxHeightRatio?: number
}

/** تجاهل أول click على الـ backdrop بعد الفتح (الماوس يقع على الـ backdrop بعد الضغطة اللي فتحت الشيت) */
const IGNORE_BACKDROP_CLICK_MS = 300

const DRAG_CLOSE_THRESHOLD = 80
const DRAG_VELOCITY_THRESHOLD = 0.3

/**
 * Bottom Sheet بتصميم M3 – قابل لإعادة الاستخدام وقابل للسحب للإغلاق.
 * يظهر من الأسفل مع خلفية شفافة ومقبض سحب؛ السحب لأسفل يغلقه.
 * استخدم من النظام الموحد: ألوان من useTheme()، لا ألوان ثابتة.
 */
export default function BottomSheet({
  open,
  onClose,
  children,
  title,
  maxHeightRatio = 0.85,
}: BottomSheetProps) {
  const { colors } = useTheme()
  const panelRef = useRef<HTMLDivElement>(null)
  const [dragY, setDragY] = useState(0)
  const startYRef = useRef(0)
  const startTimeRef = useRef(0)
  const dragYRef = useRef(0)
  const isDraggingRef = useRef(false)
  const mouseListenersRef = useRef<{ move: (e: MouseEvent) => void; up: () => void } | null>(null)
  const openedAtRef = useRef<number>(0)

  const getClientY = useCallback((e: React.TouchEvent | React.MouseEvent | Touch | MouseEvent) => {
    return 'touches' in e ? (e as React.TouchEvent).touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY
  }, [])

  const handleDragStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      startYRef.current = getClientY(e)
      startTimeRef.current = Date.now()
      dragYRef.current = 0
      isDraggingRef.current = true
      setDragY(0)
    },
    [getClientY]
  )

  const handleDragMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDraggingRef.current) return
      const y = getClientY(e)
      const delta = y - startYRef.current
      if (delta > 0) {
        dragYRef.current = delta
        setDragY(delta)
      }
    },
    [getClientY]
  )

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    const delta = dragYRef.current
    const elapsed = Date.now() - startTimeRef.current
    const velocity = elapsed > 0 ? delta / elapsed : 0
    if (delta >= DRAG_CLOSE_THRESHOLD || velocity >= DRAG_VELOCITY_THRESHOLD) {
      onClose()
    }
    setDragY(0)
    dragYRef.current = 0
  }, [onClose])

  const removeMouseListeners = useCallback(() => {
    const listeners = mouseListenersRef.current
    if (listeners) {
      document.removeEventListener('mousemove', listeners.move)
      document.removeEventListener('mouseup', listeners.up)
      mouseListenersRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!open) {
      openedAtRef.current = 0
      return
    }
    openedAtRef.current = Date.now()
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEscape)
      document.body.style.overflow = ''
      removeMouseListeners()
    }
  }, [open, onClose, removeMouseListeners])

  useEffect(() => {
    if (!open) {
      isDraggingRef.current = false
      return
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return
      e.preventDefault()
      const y = e.touches[0]?.clientY ?? 0
      const delta = y - startYRef.current
      if (delta > 0) {
        dragYRef.current = delta
        setDragY(delta)
      }
    }
    const onTouchEnd = () => {
      if (isDraggingRef.current) handleDragEnd()
    }
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    document.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [open, handleDragEnd])

  if (!open) return null

  const handleBackdropClick = () => {
    const elapsed = Date.now() - openedAtRef.current
    if (elapsed < IGNORE_BACKDROP_CLICK_MS) return
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'نافذة'}
    >
      {/* Backdrop – M3 overlay؛ تجاهل أول click بعد الفتح (ماوس الضغطة اللي فتحت الشيت) */}
      <button
        type="button"
        className="absolute inset-0 z-0"
        style={{ backgroundColor: colors.overlay }}
        onClick={handleBackdropClick}
        aria-label="إغلاق"
      />
      {/* Panel – من الأسفل، زوايا علوية دائرية، قابل للسحب؛ فوق الـ backdrop دائماً */}
      <div
        ref={panelRef}
        className="relative z-10 w-full rounded-t-3xl flex flex-col max-h-[85vh] safe-area-bottom"
        style={{
          backgroundColor: colors.surface,
          boxShadow: 'var(--shadow-xl)',
          maxHeight: `min(85vh, ${maxHeightRatio * 100}vh)`,
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragY > 0 ? 'none' : 'transform 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* مقبض السحب – M3؛ السحب فقط بعد mousedown/touchstart على المقبض (لا onMouseMove بدون ضغط) */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onMouseDown={(e) => {
            removeMouseListeners()
            handleDragStart(e)
            const onMouseMove = (ev: MouseEvent) => handleDragMove({ clientY: ev.clientY } as React.MouseEvent)
            const onMouseUp = () => {
              handleDragEnd()
              removeMouseListeners()
            }
            mouseListenersRef.current = { move: onMouseMove, up: onMouseUp }
            document.addEventListener('mousemove', onMouseMove)
            document.addEventListener('mouseup', onMouseUp)
          }}
          aria-hidden
        >
          <span
            className="w-10 h-1 rounded-full block"
            style={{ backgroundColor: colors.outline }}
          />
        </div>
        {title && (
          <div className="px-4 pb-2" style={{ color: colors.onSurface }}>
            {title}
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 touch-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
