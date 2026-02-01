/**
 * شريط إحصائيات ومشاركة للأماكن — النظام الموحد.
 * يعرض: مشاهدات اليوم، الإجمالي، زر مشاركة.
 * يستخدم useTheme() و Button و LabelSmall من النظام الموحد.
 */

'use client'

import { useCallback } from 'react'
import { Share2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import Button from '@/components/common/Button'
import { LabelSmall } from '@/components/m3'

export interface PlaceStatsBarProps {
  /** عدد المشاهدات أو الزيارات اليوم */
  todayViews?: number
  /** عدد المشاهدات الإجمالي */
  totalViews?: number
  /** رابط المشاركة (مثلاً صفحة المكان) */
  shareHref: string
  /** اسم المكان (للمشاركة) */
  placeName?: string
  /** عند النقر لا ينشُر الحدث (مثلاً داخل كارت قابل للنقر) */
  stopPropagation?: boolean
  className?: string
}

const ICON_CLASS = 'w-5 h-5 min-w-[20px] min-h-[20px]'

export default function PlaceStatsBar({
  todayViews = 0,
  totalViews = 0,
  shareHref,
  placeName,
  stopPropagation = true,
  className = '',
}: PlaceStatsBarProps) {
  const { colors } = useTheme()

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      if (stopPropagation) e.stopPropagation()
      const url = typeof window !== 'undefined' ? new URL(shareHref, window.location.origin).href : shareHref
      const title = placeName || 'مكان'
      const text = `شاهد "${title}" على بان`

      try {
        // Web Share API: يفتح قائمة التطبيقات (واتساب، تليجرام، إلخ) على الموبايل وفي متصفحات تدعمها
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title,
            text,
            url,
          })
          return
        }
      } catch (err: unknown) {
        // المستخدم ألغى المشاركة — لا ننسخ ولا نعرض رسالة
        if (err instanceof Error && err.name === 'AbortError') return
        // غير ذلك: نحاول نسخ الرابط كبديل
      }

      try {
        await navigator.clipboard?.writeText(url)
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('toast', { detail: 'تم نسخ الرابط' }))
      } catch {
        // لا شيء
      }
    },
    [shareHref, placeName, stopPropagation]
  )

  return (
    <div
      className={`flex items-center justify-between gap-2 min-h-[48px] ${className}`}
      style={{ color: colors.onSurfaceVariant }}
    >
      <div className="flex items-center gap-3">
        <LabelSmall as="span" color="onSurfaceVariant">
          اليوم: <span style={{ color: colors.onSurface }}>{todayViews}</span>
        </LabelSmall>
        <span className="text-on-surface-variant/60" aria-hidden>
          |
        </span>
        <LabelSmall as="span" color="onSurfaceVariant">
          الإجمالي: <span style={{ color: colors.onSurface }}>{totalViews}</span>
        </LabelSmall>
      </div>
      <Button
        type="button"
        variant="text"
        size="sm"
        onClick={handleShare}
        className="!min-h-0 !p-2 rounded-extra-large text-on-surface-variant"
        aria-label="مشاركة"
      >
        <Share2 size={20} className={ICON_CLASS} />
      </Button>
    </div>
  )
}
