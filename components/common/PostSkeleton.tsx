/**
 * PostSkeleton — يحاكي هيكل المنشور الموحد (Post) بدقة: خلفية فحمية، حدود ذهبية،
 * Header (أفاتار + اسم + وقت) → Body (صورة بزوايا منحنية أو نص) → Footer.
 * يمنع Layout Shift في WebView.
 */

'use client'

import { HTMLAttributes } from 'react'

export interface PostSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** عرض صندوق الصورة بزوايا منحنية (مثل المنشور مع صورة) */
  showImage?: boolean
  /** عرض سطرين نص (مثل المنشور مع محتوى) */
  showTextLines?: boolean
}

const AVATAR_SIZE = 40
const IMAGE_ASPECT = 16 / 9
const FOOTER_HEIGHT = 48

export default function PostSkeleton({
  showImage = true,
  showTextLines = true,
  className = '',
  style = {},
  ...restProps
}: PostSkeletonProps) {
  return (
    <div
      className={`flex flex-col w-full rounded-extra-large overflow-hidden bg-surface border-[0.5px] border-primary min-h-[48px] ${className}`}
      style={style}
      dir="rtl"
      aria-hidden
      {...restProps}
    >
      {/* Header: أفاتار + سطر اسم + سطر وقت */}
      <div className="flex flex-col gap-1 p-3 pb-0 ps-1 pe-1 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="skeleton-shimmer rounded-full flex-shrink-0 bg-on-surface-variant/20 border-[0.5px] border-primary"
            style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, minWidth: AVATAR_SIZE, minHeight: AVATAR_SIZE }}
          />
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div
              className="skeleton-shimmer rounded-lg bg-on-surface-variant/20"
              style={{ height: 16, maxWidth: 140, minHeight: 16 }}
            />
            <div
              className="skeleton-shimmer rounded-lg bg-on-surface-variant/20"
              style={{ height: 12, maxWidth: 80, minHeight: 12 }}
            />
          </div>
        </div>
      </div>

      {/* Body: صورة بزوايا منحنية (rounded-xl) أو سطرين نص */}
      {showImage && (
        <div className="w-full mt-3 px-2 pb-0">
          <div
            className="w-full overflow-hidden rounded-xl skeleton-shimmer bg-on-surface-variant/20"
            style={{
              aspectRatio: IMAGE_ASPECT,
              minHeight: 120,
            }}
          />
        </div>
      )}
      {showTextLines && (
        <div className="p-3 pt-2 space-y-2 shrink-0">
          <div
            className="skeleton-shimmer rounded-lg bg-on-surface-variant/20"
            style={{ height: 14, width: '100%', minHeight: 14 }}
          />
          <div
            className="skeleton-shimmer rounded-lg bg-on-surface-variant/20"
            style={{ height: 14, width: '75%', minHeight: 14 }}
          />
        </div>
      )}

      {/* Footer: شريط أيقونات (نفس ارتفاع شريط التفاعل) */}
      <div
        className="flex items-center gap-2 px-3 pb-3 pt-2 shrink-0"
        style={{ minHeight: FOOTER_HEIGHT }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skeleton-shimmer rounded-full bg-on-surface-variant/20"
            style={{ width: 24, height: 24, minWidth: 24, minHeight: 24 }}
            aria-hidden
          />
        ))}
      </div>
    </div>
  )
}
