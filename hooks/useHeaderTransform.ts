/**
 * useHeaderTransform — هوك موحد لتحويل الهيدر حسب التمرير
 *
 * يعتمد على useScrollContainer() لحساب اتجاه التمرير ومسافته، ويرجع:
 * - showSubHeader: إظهار/إخفاء الشريط الفرعي (الستوريز، الفلاتر، التابات)
 * - scrollY: موضع التمرير الحالي
 * - direction: اتجاه التمرير الأخير ('up' | 'down' | null)
 *
 * يستخدم تراكم التمرير + فترة تهدئة لتجنب التذبذب.
 * النظام الموحد: مرجع التمرير من ScrollContainerContext (main).
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useScrollContainer } from '@/contexts/ScrollContainerContext'

export interface UseHeaderTransformOptions {
  /** عند scrollY <= هذا نُظهر الشريط الفرعي دائماً */
  topThreshold?: number
  /** مسافة تمرير لأسفل متراكمة للإخفاء (px) */
  minScrollToHide?: number
  /** مسافة تمرير لأعلى متراكمة للإظهار (px) */
  minScrollToShow?: number
  /** بعد الإخفاء، لا نُظهر إلا بعد هذه المدة (ms) */
  cooldownAfterHideMs?: number
  /** بعد الإظهار، لا نخفي إلا بعد هذه المدة (ms) */
  cooldownAfterShowMs?: number
  /** تخفيف استدعاءات المعالج (ms) */
  throttleMs?: number
  /** إذا true: الشريط الفرعي ثابت (لا يختفي أبداً) — لصفحات كتفاصيل المكان حيث التابات تبقى Pinned */
  subHeaderPinned?: boolean
}

const DEFAULT_OPTIONS: Required<Omit<UseHeaderTransformOptions, 'subHeaderPinned'>> & { subHeaderPinned?: boolean } = {
  topThreshold: 50,
  minScrollToHide: 60,
  minScrollToShow: 50,
  cooldownAfterHideMs: 500,
  cooldownAfterShowMs: 400,
  throttleMs: 80,
  subHeaderPinned: false,
}

export type ScrollDirection = 'up' | 'down' | null

export interface UseHeaderTransformReturn {
  /** مرجع حاوية التمرير (نفس useScrollContainer) */
  scrollRef: ReturnType<typeof useScrollContainer>
  /** true = إظهار الشريط الفرعي، false = إخفاؤه */
  showSubHeader: boolean
  /** موضع التمرير الحالي (scrollTop) */
  scrollY: number
  /** اتجاه التمرير الأخير */
  direction: ScrollDirection
}

export function useHeaderTransform(
  options: UseHeaderTransformOptions = {}
): UseHeaderTransformReturn {
  const scrollRef = useScrollContainer()
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const [showSubHeader, setShowSubHeader] = useState(true)
  const [scrollY, setScrollY] = useState(0)
  const [direction, setDirection] = useState<ScrollDirection>(null)

  const lastScrollTopRef = useRef(0)
  const accumulatedRef = useRef(0)
  const lastHideTimeRef = useRef(0)
  const lastShowTimeRef = useRef(0)

  useEffect(() => {
    const el = scrollRef?.current
    if (!el) return

    let rafId: number | null = null
    let lastRun = 0

    const handleScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        const now = Date.now()
        if (now - lastRun < opts.throttleMs) return
        lastRun = now

        const current = el.scrollTop
        const last = lastScrollTopRef.current
        const delta = current - last
        lastScrollTopRef.current = current

        setScrollY(current)
        setDirection(delta > 0 ? 'down' : delta < 0 ? 'up' : null)

        if (opts.subHeaderPinned) {
          setShowSubHeader(true)
          accumulatedRef.current = 0
          return
        }

        if (current <= opts.topThreshold) {
          setShowSubHeader(true)
          accumulatedRef.current = 0
          lastShowTimeRef.current = now
          return
        }

        if (delta > 0) {
          accumulatedRef.current = Math.max(0, accumulatedRef.current) + delta
          const acc = accumulatedRef.current
          if (
            acc >= opts.minScrollToHide &&
            now - lastShowTimeRef.current >= opts.cooldownAfterShowMs
          ) {
            setShowSubHeader(false)
            accumulatedRef.current = 0
            lastHideTimeRef.current = now
          }
        } else if (delta < 0) {
          accumulatedRef.current = Math.min(0, accumulatedRef.current) + delta
          const acc = -accumulatedRef.current
          if (
            acc >= opts.minScrollToShow &&
            now - lastHideTimeRef.current >= opts.cooldownAfterHideMs
          ) {
            setShowSubHeader(true)
            accumulatedRef.current = 0
            lastShowTimeRef.current = now
          }
        }
      })
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    setScrollY(el.scrollTop)

    return () => {
      el.removeEventListener('scroll', handleScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [
    scrollRef,
    opts.topThreshold,
    opts.minScrollToHide,
    opts.minScrollToShow,
    opts.cooldownAfterHideMs,
    opts.cooldownAfterShowMs,
    opts.throttleMs,
    opts.subHeaderPinned,
  ])

  return {
    scrollRef,
    showSubHeader,
    scrollY,
    direction,
  }
}
