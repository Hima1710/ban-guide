'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Moon, Sun, User, LogOut } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotifications } from '@/hooks/useNotifications'
import { supabase } from '@/lib/supabase'
import NotificationBell from '@/components/NotificationBell'
import { Button } from '@/components/common'

function isTopLevel(pathname: string): boolean {
  if (pathname === '/' || pathname === '/auth' || pathname === '/auth/login') return true
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return true
  if (segments.length === 1 && ['places', 'messages', 'dashboard', 'admin'].includes(segments[0])) return true
  return false
}

const HEADER_HEIGHT = 56

export { HEADER_HEIGHT }

export default function SmartTopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile } = useAuthContext()
  const { colors, isDark, toggleTheme } = useTheme()
  useNotifications(user?.id)

  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setCanGoBack(window.history.length > 1 && !isTopLevel(pathname))
  }, [pathname])

  const handleBack = () => {
    router.back()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const pageTitle = pathname === '/' ? '' : pathname.split('/').filter(Boolean).slice(-1)[0] || ''

  return (
    <header
      className="sticky top-0 z-50 border-b min-h-[56px] flex items-center safe-area-top"
      style={{
        height: HEADER_HEIGHT,
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-outline)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex items-center justify-between w-full h-full px-3 sm:px-4">
        {/* Left: Back button (only when can go back) */}
        <div className="flex items-center min-w-[48px] min-h-[48px] shrink-0">
          {canGoBack ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center w-12 h-12 rounded-extra-large transition-colors hover:bg-on-surface/10 active:opacity-80"
              style={{ color: 'var(--color-on-surface)' }}
              aria-label="رجوع"
            >
              <ChevronRight size={24} className="rtl:rotate-180" />
            </button>
          ) : (
            <span className="w-12" aria-hidden />
          )}
        </div>

        {/* Center: Logo or page title */}
        <div className="flex-1 flex justify-center min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 min-h-[48px] justify-center"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0">
              <Image
                src="/logo.webp"
                alt="بان"
                fill
                sizes="44px"
                className="object-contain"
                priority
              />
            </div>
            <span
              className="hidden sm:inline text-title-large font-semibold truncate max-w-[140px]"
              style={{ color: 'var(--color-on-surface)' }}
            >
              {pathname === '/' ? 'بان' : (pageTitle ? decodeURIComponent(pageTitle) : 'بان')}
            </span>
          </Link>
        </div>

        {/* Right: Theme + Notifications + User */}
        <div className="flex items-center gap-1 min-w-[48px] min-h-[48px] shrink-0 justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center w-12 h-12 rounded-extra-large transition-colors hover:bg-on-surface/10"
            style={{ color: 'var(--color-on-surface)' }}
            title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
            aria-label={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
          >
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </button>

          {user ? (
            <>
              <NotificationBell userId={user.id} />
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:flex items-center justify-center w-12 h-12 rounded-extra-large transition-colors hover:bg-on-surface/10"
                style={{ color: 'var(--color-on-surface)' }}
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <LogOut size={22} />
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="flex min-h-[48px] items-center">
              <Button variant="filled" size="sm">
                <User size={18} />
                <span className="hidden sm:inline mr-1">دخول</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
