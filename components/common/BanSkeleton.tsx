/**
 * M3 skeleton loader with shimmer. Card variant: image box + text lines.
 * Touch-friendly (48px min), dark-mode safe.
 */

'use client'

import { HTMLAttributes } from 'react'

type Variant = 'card' | 'text' | 'avatar' | 'custom'

interface BanSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  /** For 'card': number of text lines below image (default 3) */
  lines?: number
  /** For 'card': show image placeholder (default true) */
  showImage?: boolean
}

export default function BanSkeleton({
  variant = 'text',
  lines = 3,
  showImage = true,
  className = '',
  style = {},
  ...restProps
}: BanSkeletonProps) {
  const baseClass =
    'rounded-lg bg-on-surface-variant/20 min-h-[12px]'

  if (variant === 'card') {
    return (
      <div
        className={`rounded-extra-large overflow-hidden bg-surface border border-outline/50 ${className}`}
        style={{ minHeight: 48, ...style }}
        {...restProps}
      >
        {showImage && (
          <div
            className={`w-full bg-on-surface-variant/20 skeleton-shimmer`}
            style={{ height: 160, minHeight: 120 }}
            aria-hidden
          />
        )}
        <div className="p-4 space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`skeleton-shimmer ${baseClass}`}
              style={{
                height: i === 0 ? 18 : 14,
                width: i === 0 ? '75%' : i === lines - 1 ? '40%' : '100%',
                minHeight: 14,
              }}
              aria-hidden
            />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'avatar') {
    return (
      <div
        className={`skeleton-shimmer rounded-full bg-on-surface-variant/20 ${className}`}
        style={{ width: 48, height: 48, minWidth: 48, minHeight: 48, ...style }}
        aria-hidden
        {...restProps}
      />
    )
  }

  if (variant === 'text') {
    return (
      <div
        className={`skeleton-shimmer ${baseClass} ${className}`}
        style={{ minHeight: 48, ...style }}
        aria-hidden
        {...restProps}
      />
    )
  }

  return (
    <div
      className={`skeleton-shimmer ${baseClass} ${className}`}
      style={{ minHeight: 48, ...style }}
      aria-hidden
      {...restProps}
    />
  )
}
