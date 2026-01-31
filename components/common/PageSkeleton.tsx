/**
 * هيكل صفحة سكيلتون موحد — يستبدل "جاري التحميل" بمنظر هيكلي حتى يرد السيرفر.
 * يستخدم BanSkeleton (card, avatar, text). للنظام الموحد.
 */

'use client'

import BanSkeleton from './BanSkeleton'

type Variant = 'default' | 'dashboard' | 'list' | 'form'

interface PageSkeletonProps {
  variant?: Variant
  className?: string
}

export default function PageSkeleton({ variant = 'default', className = '' }: PageSkeletonProps) {
  const base = 'min-h-screen p-4 md:p-6'

  if (variant === 'dashboard') {
    return (
      <div className={`${base} ${className}`} aria-busy="true">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <BanSkeleton variant="avatar" className="shrink-0" />
            <div className="flex-1 space-y-2">
              <BanSkeleton variant="text" className="max-w-[200px]" style={{ height: 24 }} />
              <BanSkeleton variant="text" className="max-w-[140px]" style={{ height: 16 }} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <BanSkeleton key={i} variant="card" lines={2} showImage={false} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BanSkeleton variant="card" lines={3} />
            <BanSkeleton variant="card" lines={3} />
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className={`${base} ${className}`} aria-busy="true">
        <div className="max-w-2xl mx-auto space-y-4">
          <BanSkeleton variant="text" style={{ height: 28, width: '60%' }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-extra-large bg-surface border border-outline/50">
              <BanSkeleton variant="avatar" className="shrink-0" />
              <div className="flex-1 space-y-2">
                <BanSkeleton variant="text" style={{ height: 16, width: '70%' }} />
                <BanSkeleton variant="text" style={{ height: 14, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'form') {
    return (
      <div className={`${base} ${className}`} aria-busy="true">
        <div className="max-w-2xl mx-auto space-y-6">
          <BanSkeleton variant="text" style={{ height: 32, width: '50%' }} />
          <div className="space-y-4 rounded-extra-large p-6 bg-surface border border-outline/50">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <BanSkeleton variant="text" style={{ height: 14, width: 100 }} />
                <BanSkeleton variant="text" style={{ height: 48, width: '100%' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // default: عنوان + شبكة كروت
  return (
    <div className={`${base} ${className}`} aria-busy="true">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <BanSkeleton variant="text" style={{ height: 28, width: '40%' }} />
          <BanSkeleton variant="text" style={{ height: 16, width: '70%' }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <BanSkeleton key={i} variant="card" lines={3} />
          ))}
        </div>
      </div>
    </div>
  )
}
