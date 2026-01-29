'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { BodySmall } from '@/components/m3'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

/**
 * Reusable loading spinner component (M3 theme-aware)
 */
export default function LoadingSpinner({
  size = 'md',
  className = '',
  text,
}: LoadingSpinnerProps) {
  const { colors } = useTheme()
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-b-2',
    lg: 'h-16 w-16 border-b-2',
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]}`}
        style={{ borderColor: colors.primary }}
      />
      {text && (
        <BodySmall color="onSurfaceVariant" className="text-sm">{text}</BodySmall>
      )}
    </div>
  )
}
