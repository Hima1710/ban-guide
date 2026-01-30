/**
 * M3 Button – ألوان من useTheme() (النظام الموحد)، لا لون افتراضي.
 * Variants: filled (primary + onPrimary), outlined (border primary), text.
 * All rounded-extra-large, min 48px height for touch.
 */

'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

const MIN_TOUCH_HEIGHT = 48

export default function Button({
  variant = 'filled',
  size = 'md',
  loading = false,
  children,
  fullWidth = false,
  className = '',
  disabled,
  style = {},
  ...restProps
}: ButtonProps) {
  const { colors } = useTheme()

  const sizeClasses = {
    sm: 'px-4 text-sm min-h-[48px]',
    md: 'px-6 text-base min-h-[48px]',
    lg: 'px-8 text-lg min-h-[48px]',
  }

  const variantBaseClasses =
    'font-semibold rounded-extra-large inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]'

  const variantStyles =
    variant === 'filled'
      ? { backgroundColor: colors.primary, color: colors.onPrimary, border: 0 }
      : variant === 'outlined'
        ? { backgroundColor: 'transparent', color: colors.primary, borderWidth: 2, borderStyle: 'solid', borderColor: colors.primary }
        : { backgroundColor: 'transparent', color: colors.primary, border: 0 }

  const disabledStyle =
    disabled || loading
      ? { opacity: 0.6, ...(variant !== 'filled' && { borderColor: colors.outline, color: colors.onSurfaceVariant }) }
      : {}

  return (
    <button
      type="button"
      className={`
        ${variantBaseClasses}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{
        minHeight: MIN_TOUCH_HEIGHT,
        ...variantStyles,
        ...disabledStyle,
        ...style,
      }}
      disabled={disabled || loading}
      {...restProps}
    >
      {loading && (
        <Loader2
          size={size === 'sm' ? 18 : size === 'lg' ? 22 : 20}
          className="animate-spin shrink-0"
        />
      )}
      {children}
    </button>
  )
}
