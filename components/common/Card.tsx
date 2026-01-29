/**
 * M3 base container: rounded-extra-large, shadow levels 0–5, surface tokens.
 * Touch-friendly. Dark-mode via CSS variables.
 */

'use client'

import { ReactNode, HTMLAttributes } from 'react'

type ShadowLevel = 0 | 1 | 2 | 3 | 4 | 5

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'filled' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  elevation?: ShadowLevel
  hover?: boolean
  clickable?: boolean
}

const shadowClasses: Record<ShadowLevel, string> = {
  0: 'shadow-none',
  1: 'shadow-[0_1px_2px_0_rgba(0,0,0,0.05),0_1px_3px_1px_rgba(0,0,0,0.1)]',
  2: 'shadow-[0_1px_2px_0_rgba(0,0,0,0.05),0_2px_6px_2px_rgba(0,0,0,0.1)]',
  3: 'shadow-[0_4px_8px_3px_rgba(0,0,0,0.1),0_1px_3px_0_rgba(0,0,0,0.08)]',
  4: 'shadow-[0_6px_10px_4px_rgba(0,0,0,0.1),0_2px_3px_0_rgba(0,0,0,0.08)]',
  5: 'shadow-[0_8px_12px_6px_rgba(0,0,0,0.12),0_4px_4px_0_rgba(0,0,0,0.08)]',
}

export default function Card({
  children,
  variant = 'filled',
  padding = 'md',
  elevation = 0,
  hover = false,
  clickable = false,
  className = '',
  style = {},
  ...restProps
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  }

  const variantClasses = {
    filled: 'bg-surface border-0',
    outlined: 'bg-surface border border-outline',
    elevated: 'bg-surface border-0',
  }

  const level = variant === 'elevated' ? elevation : 0

  return (
    <div
      className={`
        rounded-extra-large text-on-surface
        min-h-[48px]
        ${variantClasses[variant]}
        ${shadowClasses[level]}
        ${paddingClasses[padding]}
        ${hover || clickable ? 'transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]' : ''}
        ${clickable ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={style}
      {...restProps}
    >
      {children}
    </div>
  )
}
