'use client'

/**
 * M3 Carousel - نظام موحد للكاروسيل
 *
 * يدعم التمرير يميناً ويساراً حسب اتجاه الصفحة (RTL/LTR).
 * يمكن استدعاؤه في أي مكان لعرض قائمة عناصر بتقلب أفقي تلقائي وأحجام متغيرة (MD3).
 */

import { useEffect, useRef, useState, ReactNode } from 'react'

export type CarouselItemSize = 'small' | 'medium' | 'large'

const ITEM_WIDTHS: Record<CarouselItemSize, string> = {
  large: 'w-[300px] sm:w-[360px] md:w-[400px]',
  medium: 'w-[260px] sm:w-[300px] md:w-[340px]',
  small: 'w-[220px] sm:w-[260px] md:w-[280px]',
}

/** سرعة افتراضية: بكسل في الثانية (قيمة منخفضة = تمرير سلس) */
const DEFAULT_SCROLL_SPEED_PX_PER_SEC = 28
const MS_PER_FRAME_60FPS = 1000 / 60

export interface CarouselProps<T> {
  /** عنوان اختياري فوق الكاروسيل */
  title?: ReactNode
  /** مصفوفة العناصر */
  items: T[]
  /** مفتاح فريد لكل عنصر */
  keyExtractor: (item: T) => string | number
  /** دالة عرض كل عنصر */
  renderItem: (item: T, index: number) => ReactNode
  /** حجم كل عنصر حسب الفهرس (اختياري، افتراضي: medium للجميع) */
  getItemSize?: (index: number) => CarouselItemSize
  /** تفعيل التقلب الأفقي التلقائي */
  autoScroll?: boolean
  /** سرعة التقلب (بكسل في الثانية)، كلما أقل كلما أنعم */
  scrollSpeed?: number
  /** إيقاف التقلب عند المرور بالماوس */
  pauseOnHover?: boolean
  /** تفعيل snap للعناصر */
  snap?: boolean
  /** وصف للوصولية (يُستخدم كـ aria-label للحاوية) */
  ariaLabel?: string
  /** كلاس إضافي للحاوية الخارجية */
  className?: string
  /** ستايل إضافي للحاوية الخارجية */
  style?: React.CSSProperties
}

export default function Carousel<T>({
  title,
  items,
  keyExtractor,
  renderItem,
  getItemSize = () => 'medium',
  autoScroll = false,
  scrollSpeed = DEFAULT_SCROLL_SPEED_PX_PER_SEC,
  pauseOnHover = true,
  snap = true,
  ariaLabel,
  className = '',
  style,
}: CarouselProps<T>) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)
  const isPausedRef = useRef(false)
  const scrollPosRef = useRef(0)
  const lastTimeRef = useRef<number>(0)
  /** عند التمرير التلقائي لا نفعّل snap حتى لا يصحّح المتصفح scrollLeft ويُسيطر على التمرير */
  const effectiveSnap = snap && !autoScroll

  isPausedRef.current = isPaused

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !autoScroll) return

    const isRtl = typeof document !== 'undefined' && document.documentElement.getAttribute('dir') === 'rtl'
    const speedPxPerSec = scrollSpeed > 0 ? scrollSpeed : DEFAULT_SCROLL_SPEED_PX_PER_SEC
    const direction = isRtl ? -1 : 1

    let rafId: number

    const tick = (timestamp: number) => {
      if (!isPausedRef.current) {
        const maxScroll = container.scrollWidth - container.clientWidth
        if (maxScroll > 0) {
          const deltaMs = Math.min(
            lastTimeRef.current ? timestamp - lastTimeRef.current : MS_PER_FRAME_60FPS,
            100
          )
          lastTimeRef.current = timestamp
          const step = direction * speedPxPerSec * (deltaMs / 1000)
          scrollPosRef.current += step

          if (isRtl && scrollPosRef.current <= -maxScroll) scrollPosRef.current = 0
          if (!isRtl && scrollPosRef.current >= maxScroll) scrollPosRef.current = 0
          container.scrollLeft = scrollPosRef.current
        }
      }
      rafId = requestAnimationFrame(tick)
    }
    lastTimeRef.current = 0
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [autoScroll, scrollSpeed])

  if (items.length === 0) return null

  return (
    <section
      className={`mb-6 sm:mb-8 ${className}`}
      style={style}
      aria-label={ariaLabel}
    >
      {title != null && <div className="mb-3 sm:mb-4">{title}</div>}
      <div
        ref={scrollContainerRef}
        className={`flex gap-3 sm:gap-4 overflow-x-auto overflow-y-hidden pb-4 scrollbar-hide ${
          effectiveSnap ? 'snap-x snap-mandatory' : ''
        }`}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'auto',
          touchAction: 'pan-x',
          contain: 'layout style',
        }}
        onMouseEnter={() => pauseOnHover && setIsPaused(true)}
        onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      >
        {items.map((item, index) => {
          const size = getItemSize(index)
          const widthClass = ITEM_WIDTHS[size]
          return (
            <div
              key={keyExtractor(item)}
              className={`flex-shrink-0 ${effectiveSnap ? 'snap-start' : ''} ${widthClass}`}
            >
              {renderItem(item, index)}
            </div>
          )
        })}
      </div>
    </section>
  )
}
