/**
 * M3 Button – uses design tokens (Tailwind + globals.css).
 * Variants: filled (bg-primary), outlined (border-primary), text.
 * All rounded-extra-large, min 48px height for touch.
 */

'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

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
  const sizeClasses = {
    sm: 'px-4 text-sm min-h-[48px]',
    md: 'px-6 text-base min-h-[48px]',
    lg: 'px-8 text-lg min-h-[48px]',
  }

  const variantClasses = {
    filled:
      'bg-primary text-on-primary border-0 shadow-sm hover:opacity-90 active:opacity-95 disabled:opacity-60 disabled:shadow-none',
    outlined:
      'bg-transparent border-2 border-primary text-primary hover:bg-primary/10 active:bg-primary/15 disabled:opacity-60 disabled:border-outline disabled:text-on-surface-variant',
    text:
      'bg-transparent border-0 text-primary hover:bg-primary/10 active:bg-primary/15 disabled:opacity-60 disabled:text-on-surface-variant',
  }

  return (
    <button
      type="button"
      className={`
        font-semibold rounded-extra-large
        inline-flex items-center justify-center gap-2
        transition-all duration-200
        disabled:cursor-not-allowed
        hover:scale-[1.02] active:scale-[0.98]
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      style={{ minHeight: MIN_TOUCH_HEIGHT, ...style }}
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
