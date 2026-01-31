'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { BodySmall } from '@/components/m3'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  /** فقط الدائرة (للأزرار والمناطق الصغيرة) */
  iconOnly?: boolean
}

/**
 * Reusable loading spinner component (M3 theme-aware).
 * Use iconOnly inside buttons or inline with text.
 */
export default function LoadingSpinner({
  size = 'md',
  className = '',
  text,
  iconOnly = false,
}: LoadingSpinnerProps) {
  const { colors } = useTheme()
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-b-2',
    lg: 'h-16 w-16 border-b-2',
  }

  const circle = (
    <div
      className={`animate-spin rounded-full shrink-0 ${sizeClasses[size]}`}
      style={{ borderColor: colors.primary }}
      aria-hidden
    />
  )

  if (iconOnly) {
    return <span className={`inline-flex ${className}`}>{circle}</span>
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {circle}
      {text && (
        <BodySmall color="onSurfaceVariant" className="text-sm">{text}</BodySmall>
      )}
    </div>
  )
}
