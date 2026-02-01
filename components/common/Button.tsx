/**
 * M3 Button – نظام موحد حسب الثيم.
 * يستخدم متغيرات CSS (--color-primary, --color-on-primary) فقط؛ لا قيم ثابتة.
 * النهاري: filled. الليلي: outlined. Focus و Active واضحان في كلا الوضعين.
 */

'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import LoadingSpinner from './LoadingSpinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text' | 'danger'
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
  const { isDark } = useTheme()

  const sizeClasses = {
    sm: 'px-4 text-sm min-h-[48px]',
    md: 'px-6 text-base min-h-[48px]',
    lg: 'px-8 text-lg min-h-[48px]',
  }

  /* Base: انتقالات سلسة + Focus (حلقة primary) + Active (ضغط واضح) */
  const variantBaseClasses =
    'font-semibold rounded-extra-large inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:cursor-not-allowed ' +
    'hover:scale-[1.02] active:scale-[0.97] active:opacity-90 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]'

  /* كل الأنماط تعتمد على متغيرات CSS فقط */
  const outlinedPrimary = {
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    borderWidth: 2,
    borderStyle: 'solid' as const,
    borderColor: 'var(--color-primary)',
  }
  const filledPrimary = {
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    borderWidth: 0,
    borderStyle: 'solid' as const,
    borderColor: 'transparent',
  }
  const outlinedDanger = {
    backgroundColor: 'transparent',
    color: 'var(--color-error)',
    borderWidth: 2,
    borderStyle: 'solid' as const,
    borderColor: 'var(--color-error)',
  }
  const filledDanger = {
    backgroundColor: 'var(--color-error)',
    color: 'var(--color-on-primary)',
    borderWidth: 0,
    borderStyle: 'solid' as const,
    borderColor: 'transparent',
  }

  const getVariantStyles = () => {
    if (variant === 'danger') {
      return isDark ? outlinedDanger : filledDanger
    }
    if (variant === 'filled') {
      return isDark ? outlinedPrimary : filledPrimary
    }
    if (variant === 'outlined') {
      return { ...outlinedPrimary, borderColor: 'var(--color-primary)' }
    }
    return { backgroundColor: 'transparent', color: 'var(--color-primary)', borderWidth: 0, borderStyle: 'solid' as const, borderColor: 'transparent' }
  }

  const variantStyles = getVariantStyles()

  const showOutlinedWhenActive = variant === 'outlined' || variant === 'text' || (variant === 'filled' && isDark) || (variant === 'danger' && isDark)
  const disabledStyle =
    disabled || loading
      ? { opacity: 0.6, ...(showOutlinedWhenActive ? { borderColor: 'var(--color-outline)', color: 'var(--color-on-surface-variant)' } : {}) }
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
        <LoadingSpinner size="sm" iconOnly className="shrink-0" />
      )}
      {children}
    </button>
  )
}
