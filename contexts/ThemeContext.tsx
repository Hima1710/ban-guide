/**
 * Unified Theme Context
 * 
 * Provides role-based theming and M3 design tokens.
 * 
 * Features:
 * - Role-based colors (Admin = Blue, Affiliate = Green, User = Purple)
 * - Dark mode support
 * - M3 color system
 * - Centralized theme configuration
 * 
 * Usage:
 * const { colors, isDark, toggleTheme } = useTheme()
 */

'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuthContext } from './AuthContext'
import { getUserRole, type UserRole } from '@/config/navigation'

export interface ThemeColors {
  // Primary brand color
  primary: string
  primaryRgb: string
  primaryDark: string
  
  // Secondary accent color
  secondary: string
  secondaryRgb: string
  
  // Background colors
  background: string
  surface: string
  surfaceVariant: string
  surfaceContainer: string
  
  // Text colors
  onPrimary: string
  onSecondary: string
  onBackground: string
  onSurface: string
  onSurfaceVariant: string
  
  // Status colors
  success: string
  successContainer: string
  warning: string
  warningContainer: string
  error: string
  errorContainer: string
  info: string
  infoContainer: string
  
  // Border colors
  outline: string
  outlineVariant: string
  /** Modal/overlay backdrop */
  overlay: string
}

interface ThemeContextType {
  colors: ThemeColors
  isDark: boolean
  role: UserRole
  toggleTheme: () => void
  setManualTheme: (dark: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/** Primary: Royal Gold #D4AF37 — onPrimary dark (#1c1c1e) for WCAG contrast on gold */
const M3_PRIMARY = '#D4AF37'
const M3_PRIMARY_RGB = '212, 175, 55'
const M3_ON_PRIMARY = '#1c1c1e'

const roleColors: Record<UserRole, { primary: string; primaryRgb: string; secondary: string }> = {
  admin: { primary: M3_PRIMARY, primaryRgb: M3_PRIMARY_RGB, secondary: '#10b981' },
  affiliate: { primary: M3_PRIMARY, primaryRgb: M3_PRIMARY_RGB, secondary: '#10b981' },
  user: { primary: M3_PRIMARY, primaryRgb: M3_PRIMARY_RGB, secondary: '#ec4899' },
  guest: { primary: '#9ca3af', primaryRgb: '156, 163, 175', secondary: '#6b7280' },
}

/** M3 light palette — single source for contrast */
function getLightColors(role: UserRole): ThemeColors {
  const roleColor = roleColors[role]
  return {
    primary: roleColor.primary,
    primaryRgb: roleColor.primaryRgb,
    primaryDark: '#b8942e',
    secondary: roleColor.secondary,
    secondaryRgb: '16, 185, 129',
    background: '#ffffff',
    surface: '#f5f5f5',
    surfaceVariant: '#f0f0f0',
    surfaceContainer: '#e5e5e7',
    onPrimary: M3_ON_PRIMARY,
    onSecondary: '#ffffff',
    onBackground: '#1c1c1e',
    onSurface: '#1c1c1e',
    onSurfaceVariant: '#5c5c5e',
    success: '#2e7d32',
    successContainer: '#d1fae5',
    warning: '#e65100',
    warningContainer: '#fef3c7',
    error: '#ba1a1a',
    errorContainer: '#fee2e2',
    info: '#3b82f6',
    infoContainer: '#dbeafe',
    outline: '#e5e5e7',
    outlineVariant: '#d1d1d6',
    overlay: 'rgba(0, 0, 0, 0.5)',
  }
}

/** M3 dark palette — aligned with globals dark, proper contrast */
function getDarkColors(role: UserRole): ThemeColors {
  const roleColor = roleColors[role]
  return {
    primary: roleColor.primary,
    primaryRgb: roleColor.primaryRgb,
    primaryDark: '#e5c558',
    secondary: roleColor.secondary,
    secondaryRgb: '52, 211, 153',
    background: '#1c1c1e',
    surface: '#2d2d2d',
    surfaceVariant: '#252527',
    surfaceContainer: '#38383a',
    onPrimary: M3_ON_PRIMARY,
    onSecondary: '#000000',
    onBackground: '#f5f5f5',
    onSurface: '#f5f5f5',
    onSurfaceVariant: '#a1a1a3',
    success: '#34d399',
    successContainer: '#064e3b',
    warning: '#fbbf24',
    warningContainer: '#78350f',
    error: '#f87171',
    errorContainer: '#7f1d1d',
    info: '#60a5fa',
    infoContainer: '#1e3a8a',
    outline: '#48484a',
    outlineVariant: '#636366',
    overlay: 'rgba(0, 0, 0, 0.5)',
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuthContext()
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  const role = getUserRole(profile)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true)
    
    // Check localStorage first
    const savedTheme = localStorage.getItem('ban-theme')
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setIsDark(savedTheme === 'dark')
      return
    }

    // Fall back to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDark(prefersDark)
  }, [])

  // Single source of truth: apply M3 palette to all CSS variables (Tailwind + globals)
  useEffect(() => {
    if (!mounted) return

    const c = isDark ? getDarkColors(role) : getLightColors(role)
    const root = document.documentElement

    // M3 tokens (used by Tailwind: bg-surface, text-on-surface, etc.)
    root.style.setProperty('--color-primary', c.primary)
    root.style.setProperty('--color-primary-rgb', c.primaryRgb)
    root.style.setProperty('--color-on-primary', c.onPrimary)
    root.style.setProperty('--color-background', c.background)
    root.style.setProperty('--color-on-background', c.onBackground)
    root.style.setProperty('--color-surface', c.surface)
    root.style.setProperty('--color-on-surface', c.onSurface)
    root.style.setProperty('--color-on-surface-variant', c.onSurfaceVariant)
    root.style.setProperty('--color-outline', c.outline)
    root.style.setProperty('--color-outline-variant', c.outlineVariant)
    root.style.setProperty('--color-surface-dim', c.surfaceVariant)
    root.style.setProperty('--color-surface-bright', isDark ? '#38383a' : '#fafafa')
    root.style.setProperty('--color-error', c.error)
    root.style.setProperty('--color-success', c.success)
    root.style.setProperty('--color-warning', c.warning)

    // Aliases (globals + legacy)
    root.style.setProperty('--background', c.background)
    root.style.setProperty('--foreground', c.onBackground)
    root.style.setProperty('--primary-color', c.primary)
    root.style.setProperty('--primary-color-rgb', c.primaryRgb)
    root.style.setProperty('--bg-color', c.background)
    root.style.setProperty('--text-color', c.onBackground)
    root.style.setProperty('--surface-color', c.surface)
    root.style.setProperty('--surface-hover', c.surfaceVariant)
    root.style.setProperty('--surface-active', c.surfaceContainer)
    root.style.setProperty('--border-color', c.outline)
    root.style.setProperty('--border-color-hover', c.outlineVariant)
    root.style.setProperty('--primary-dark', c.primaryDark)
    root.style.setProperty('--secondary-color', c.secondary)
    root.style.setProperty('--status-online', c.success)
    root.style.setProperty('--status-warning', c.warning)
    root.style.setProperty('--status-error', c.error)
    root.style.setProperty('--text-muted', `rgba(${c.onBackground === '#1c1c1e' ? '28, 28, 30' : '245, 245, 245'}, 0.7)`)
    root.style.setProperty('--text-subtle', `rgba(${c.onBackground === '#1c1c1e' ? '28, 28, 30' : '245, 245, 245'}, 0.6)`)

    localStorage.setItem('ban-theme', isDark ? 'dark' : 'light')
  }, [isDark, role, mounted])

  const toggleTheme = () => {
    setIsDark(prev => !prev)
  }

  const setManualTheme = (dark: boolean) => {
    setIsDark(dark)
  }

  const colors = isDark ? getDarkColors(role) : getLightColors(role)

  return (
    <ThemeContext.Provider value={{ colors, isDark, role, toggleTheme, setManualTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
