'use client'

import { ReactNode, Suspense, useEffect } from 'react'
import { usePathname } from 'next/navigation'
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

const BOTTOM_NAV_HEIGHT = 64

interface AppShellProps {
  children: ReactNode
  /** Hide top bar (e.g. auth pages) */
  hideHeader?: boolean
  /** Hide bottom nav and sidebar (e.g. auth pages) */
  hideNav?: boolean
}

export default function AppShell({ children, hideHeader, hideNav }: AppShellProps) {
  const pathname = usePathname()
  const { colors } = useTheme()
  const { isWebView, loading, safeAreaInsets } = useWebView()

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

  return (
    <ConversationProvider>
      <AddStoryProvider>
      <div
        className={`min-h-screen ${isWebView ? 'webview-optimized' : ''}`}
        style={{
          backgroundColor: colors.background,
          color: colors.onBackground,
          paddingTop: isWebView ? safeAreaInsets.top : 0,
        }}
      >
        {showHeader && <SmartTopBar />}
        {showHeader && pathname !== '/' && <Breadcrumbs />}

        <main
          className="min-h-screen transition-all duration-300"
          style={{
            paddingTop: showHeader ? 8 : 0,
            paddingBottom: bottomNavHeight,
            paddingLeft: 0,
            paddingRight: 0,
          }}
        >
          <div className="lg:pr-[280px] min-h-0 flex flex-col">
            {children}
          </div>
        </main>

        {showNav && (
          <>
            <Sidebar />
            <BottomNavigation />
          </>
        )}

        <Suspense fallback={null}>
          <ConversationsSidebar />
        </Suspense>

        <ConversationDrawer />

      </div>
      </AddStoryProvider>

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
    </ConversationProvider>
  )
}
