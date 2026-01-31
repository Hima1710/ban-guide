/**
 * M3 base container (النظام الموحد) — Chameleon:
 * خلفية فحمية (bg-surface)، حدود رفيعة ذهبية (0.5px primary)، بدون خلفية صفراء.
 * rounded-extra-large, shadow levels 0–5.
 */

'use client'

import { ReactNode, HTMLAttributes } from 'react'

type ShadowLevel = 0 | 1 | 2 | 3 | 4 | 5

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'filled' | 'outlined' | 'elevated' | 'chameleon'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  elevation?: ShadowLevel
  hover?: boolean
  clickable?: boolean
}

/** M3 elevation من متغيرات الثيم (globals.css) */
const shadowClasses: Record<ShadowLevel, string> = {
  0: 'shadow-elev-0',
  1: 'shadow-elev-1',
  2: 'shadow-elev-2',
  3: 'shadow-elev-3',
  4: 'shadow-elev-4',
  5: 'shadow-elev-5',
}

export default function Card({
  children,
  variant = 'chameleon',
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

  /** Chameleon: bg-surface + حدود ذهبية رفيعة 0.5px (بدون خلفية صفراء) */
  const variantClasses = {
    filled: 'bg-surface border-0',
    outlined: 'bg-surface border border-outline',
    elevated: 'bg-surface border-0',
    chameleon: 'bg-surface border-[0.5px] border-primary shadow-none',
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
