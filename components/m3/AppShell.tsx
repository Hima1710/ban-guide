'use client'

import { ReactNode, Suspense, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ScrollContainerContext } from '@/contexts/ScrollContainerContext'
import { HeaderProvider } from '@/contexts/HeaderContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useWebView, applyWebViewOptimizations } from '@/lib/webview-detection'
import SmartTopBar, { HEADER_HEIGHT } from './SmartTopBar'
import BottomNavigation from './BottomNavigation'
import Sidebar from './Sidebar'
import Breadcrumbs from '@/components/Breadcrumbs'
import { PageSkeleton } from '@/components/common'
import ConversationsSidebar from '@/components/ConversationsSidebar'
import ConversationDrawer from '@/components/ConversationDrawer'
import { ConversationProvider } from '@/contexts/ConversationContext'
import { AddStoryProvider } from '@/contexts/AddStoryContext'
import { CommentsProvider } from '@/contexts/CommentsContext'
import { NavigationProvider, useNavigationContext } from '@/contexts/NavigationContext'

const BOTTOM_NAV_HEIGHT = 64

interface AppShellProps {
  children: ReactNode
  /** Hide top bar (e.g. auth pages) */
  hideHeader?: boolean
  /** Hide bottom nav and sidebar (e.g. auth pages) */
  hideNav?: boolean
}

function AppShellContent({ children, hideHeader, hideNav }: AppShellProps) {
  const pathname = usePathname()
  const { colors } = useTheme()
  const { isWebView, loading, safeAreaInsets } = useWebView()
  const { isNavigating } = useNavigationContext() ?? { isNavigating: false }
  const scrollContainerRef = useRef<HTMLElement | null>(null)

  const isAuthPage = pathname.startsWith('/auth/')
  const showHeader = !hideHeader && !isAuthPage
  const showNav = !hideNav && !isAuthPage

  useEffect(() => {
    if (isWebView) applyWebViewOptimizations()
  }, [isWebView])

  if (loading) {
    return <PageSkeleton variant="default" />
  }

  const bottomNavHeight = showNav ? `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))` : '0px'
  const headerHeight = showHeader ? HEADER_HEIGHT : 0

  /** خيارات تحويل الهيدر حسب المسار — مثلاً subHeaderPinned: true لصفحات تريد الشريط الفرعي ثابتاً */
  const headerTransformOptions = (() => {
    if (!showHeader) return undefined
    // صفحة تفاصيل المكان: الشريط الفرعي (اسم+صورة) يختفي عند التمرير؛ التابات Pinned في المحتوى
    if (pathname.match(/^\/places\/[^/]+$/)) return undefined
    return undefined
  })()

  return (
    <>
    <ScrollContainerContext.Provider value={{ scrollContainerRef }}>
      <HeaderProvider headerTransformOptions={headerTransformOptions}>
      <div
        className={`flex flex-col min-h-screen ${isWebView ? 'webview-optimized' : ''}`}
        style={{
          backgroundColor: colors.background,
          color: colors.onBackground,
          paddingTop: isWebView ? safeAreaInsets.top : 0,
          height: '100vh',
          maxHeight: '100dvh',
        }}
      >
        {showHeader && <SmartTopBar />}
        {showHeader && pathname !== '/' && <Breadcrumbs />}

        <main
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden transition-all duration-300 relative scroll-area-main"
          style={{
            paddingTop: showHeader && pathname !== '/' && pathname !== '/places' ? 8 : 0,
            paddingBottom: bottomNavHeight,
            paddingLeft: 0,
            paddingRight: 0,
          }}
        >
          <div className="lg:pr-[280px] min-h-full">
            {children}
          </div>
          {isNavigating && (
            <div
              className="absolute inset-0 z-40 flex items-start justify-center pt-4"
              style={{ backgroundColor: colors.background }}
              aria-busy="true"
            >
              <PageSkeleton variant="default" className="w-full max-w-2xl" />
            </div>
          )}
        </main>

        {showNav && (
          <>
            <Sidebar />
            <BottomNavigation />
          </>
        )}

        {/* المحادثة الجانبية (القائمة + الدرج) تظهر فقط في صفحة المكان عند الضغط على «إرسال رسالة» */}
        {pathname.startsWith('/places/') && pathname.split('/').filter(Boolean).length === 2 && (
          <>
            <Suspense fallback={null}>
              <ConversationsSidebar />
            </Suspense>
            <ConversationDrawer />
          </>
        )}

      </div>
      </HeaderProvider>
    </ScrollContainerContext.Provider>

      {process.env.NODE_ENV === 'development' && isWebView && (
        <div
          className="fixed top-2 left-2 px-3 py-1 rounded-full text-xs font-bold z-[9999]"
          style={{
            backgroundColor: colors.primary,
            color: colors.onPrimary,
          }}
        >
          WebView
        </div>
      )}

      <style jsx global>{`
        :root {
          --header-height: ${headerHeight}px;
          --bottom-nav-height: ${bottomNavHeight};
        }
        .webview-optimized {
          -webkit-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        .webview-optimized input,
        .webview-optimized textarea {
          -webkit-user-select: text;
          user-select: text;
        }
        @supports (padding: max(0px)) {
          .webview-optimized {
            padding-left: max(0px, env(safe-area-inset-left));
            padding-right: max(0px, env(safe-area-inset-right));
          }
        }
      `}</style>
    </>
  )
}

export default function AppShell(props: AppShellProps) {
  return (
    <NavigationProvider>
      <ConversationProvider>
        <CommentsProvider>
          <AddStoryProvider>
            <AppShellContent {...props} />
          </AddStoryProvider>
        </CommentsProvider>
      </ConversationProvider>
    </NavigationProvider>
  )
}
