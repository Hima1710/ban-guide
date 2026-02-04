/**
 * قائمة افتراضية موحدة — تستخدم @tanstack/react-virtual لعرض قوائم طويلة بأداء أفضل.
 * النظام الموحد: مكوّن headless؛ الاستايل والألوان من الثيم أو المكوّن الأب.
 */

'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import type { RefObject } from 'react'

export interface VirtualListProps<T> {
  /** مصفوفة العناصر */
  items: T[]
  /** دالة عرض عنصر واحد: (item, index) => ReactNode */
  renderItem: (item: T, index: number) => React.ReactNode
  /** مفتاح فريد لكل عنصر (مطلوب للـ reconciliation) */
  getItemKey: (item: T, index: number) => string | number
  /** ارتفاع تقديري لكل عنصر (بكسل) — يُستخدم حتى يتم القياس إن وُجد */
  estimateSize: number
  /** مرجع عنصر التمرير (الحاوية ذات overflow-y: auto) */
  scrollElementRef: RefObject<HTMLElement | null>
  /** عدد العناصر الإضافية المُعرّضة خارج viewport (تقليل الوميض) — افتراضي 3 */
  overscan?: number
  /** صنف CSS للحاوية الداخلية (الـ spacer) */
  className?: string
  /** مسافة علوية لمحتوى القائمة (مثلاً لارتفاع Sub-Header) — تُضاف داخل المحتوى القابل للتمرير لظهور زجاجي M3 */
  contentPaddingTop?: number
}

export default function VirtualList<T>({
  items,
  renderItem,
  getItemKey,
  estimateSize,
  scrollElementRef,
  overscan = 3,
  className = '',
  contentPaddingTop = 0,
}: VirtualListProps<T>) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()
  const containerHeight = contentPaddingTop + totalSize

  if (items.length === 0) {
    return null
  }

  return (
    <div
      className={className}
      style={{
        height: `${containerHeight}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualItems.map((virtualRow) => {
        const item = items[virtualRow.index]
        return (
          <div
            key={getItemKey(item, virtualRow.index)}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="virtual-list-item"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${contentPaddingTop + virtualRow.start}px)`,
              willChange: 'transform',
              contain: 'layout',
            }}
          >
            {renderItem(item, virtualRow.index)}
          </div>
        )
      })}
    </div>
  )
}
