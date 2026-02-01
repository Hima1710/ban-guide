'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Moon, Sun, User, LogOut } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useNotifications } from '@/hooks/useNotifications'
import { usePlacesViewsStats } from '@/hooks/usePlacesViewsStats'
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
  const { today: viewsToday, total: viewsTotal } = usePlacesViewsStats()

  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setCanGoBack(window.history.length > 1 && !isTopLevel(pathname))
  }, [pathname])

  // في تطبيق أندرويد: مطابقة لون شريط الحالة والتنقل مع لون الهيدر
  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as Window & { Android?: { setStatusBarColor?: (hex: string) => void } }
    if (w.Android?.setStatusBarColor && colors.surface) {
      w.Android.setStatusBarColor(colors.surface)
    }
  }, [colors.surface])

  const handleBack = () => {
    router.back()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  /** عنوان الصفحة بالعربية حسب المسار (لا نعرض آخر جزء من الرابط فقط) */
  const getHeaderTitle = (): string => {
    if (pathname === '/') return 'بان'
    const segments = pathname.split('/').filter(Boolean)
    if (segments[0] === 'places') {
      if (segments.length === 1) return 'الأماكن'
      return 'تفاصيل المكان'
    }
    if (segments[0] === 'messages') return 'المحادثات'
    if (segments[0] === 'dashboard') {
      if (segments.length === 1) return 'لوحة التحكم'
      if (segments[1] === 'places') return segments[2] ? 'تعديل المكان' : 'أماكني'
      if (segments[1] === 'packages') return 'باقاتي'
      if (segments[1] === 'affiliate') return 'المسوق'
      if (segments[1] === 'privacy') return 'الخصوصية'
      return 'لوحة التحكم'
    }
    if (segments[0] === 'auth') return 'تسجيل الدخول'
    if (segments[0] === 'admin') {
      if (segments.length === 1) return 'الإدارة'
      const adminTitles: Record<string, string> = {
        users: 'المستخدمون',
        packages: 'الباقات',
        affiliates: 'المسوقون',
        subscriptions: 'الاشتراكات',
        'discount-codes': 'أكواد الخصم',
        youtube: 'يوتيوب',
        settings: 'الإعدادات',
      }
      return adminTitles[segments[1]] ?? 'الإدارة'
    }
    return 'بان'
  }

  const headerTitle = getHeaderTitle()

  return (
    <header
      className="sticky top-0 z-50 border-b min-h-[56px] flex items-center safe-area-top surface-chameleon-glass"
      style={{
        height: HEADER_HEIGHT,
        borderColor: colors.outline,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between w-full h-full px-3 sm:px-4">
        {/* أقصى اليمين (RTL): اللوجو */}
        <Link
          href="/"
          className="flex items-center gap-2 flex-shrink-0 min-h-[48px] min-w-[48px] justify-center"
          aria-label="بان - الصفحة الرئيسية"
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
        </Link>

        {/* زر الرجوع */}
        <div className="flex items-center min-w-[48px] min-h-[48px] shrink-0">
          {canGoBack ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center w-12 h-12 rounded-extra-large border-0 shadow-none app-hover-bg active:opacity-80"
              style={{ color: colors.onSurface }}
              aria-label="رجوع"
            >
              <ChevronRight size={24} className="rtl:rotate-180 shrink-0" style={{ color: colors.onSurface }} />
            </button>
          ) : (
            <span className="w-12" aria-hidden />
          )}
        </div>

        {/* الوسط: عنوان الصفحة + المشاهدات (لا نعرض «بان» على الرئيسية) */}
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-center min-w-0 gap-0.5 sm:gap-3">
          {headerTitle !== 'بان' && (
            <span
              className="text-title-large font-semibold truncate max-w-[180px] text-center sm:text-start"
              style={{ color: colors.onSurface }}
            >
              {headerTitle}
            </span>
          )}
          <span
            className="text-label-small flex items-center gap-1.5 shrink-0"
            style={{ color: colors.onSurfaceVariant }}
            aria-label={`مشاهدات اليوم ${viewsToday}، الإجمالي ${viewsTotal}`}
          >
            <span>اليوم: <strong style={{ color: colors.onSurface }}>{viewsToday}</strong></span>
            <span aria-hidden>|</span>
            <span>الإجمالي: <strong style={{ color: colors.onSurface }}>{viewsTotal}</strong></span>
          </span>
        </div>

        {/* أقصى اليسار (RTL): الثيم + الإشعارات + المستخدم */}
        <div className="flex items-center gap-1 min-w-[48px] min-h-[48px] shrink-0 justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center w-12 h-12 rounded-extra-large border-0 shadow-none app-hover-bg active:opacity-80"
            style={{ color: colors.onSurface }}
            title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
            aria-label={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
          >
            {isDark ? <Sun size={22} style={{ color: colors.onSurface }} /> : <Moon size={22} style={{ color: colors.onSurface }} />}
          </button>

          {user ? (
            <>
              <NotificationBell userId={user.id} />
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-1.5 min-h-[48px] min-w-[48px] px-2 sm:px-3 rounded-extra-large border-0 shadow-none app-hover-bg active:opacity-80"
                style={{ color: colors.onSurface }}
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <LogOut size={22} className="shrink-0" style={{ color: colors.onSurface }} />
                <span className="hidden sm:inline text-label-large font-semibold" style={{ color: colors.onSurface }}>خروج</span>
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
