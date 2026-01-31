'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useConversationContextOptional } from '@/contexts/ConversationContext'
import { useNotifications } from '@/hooks/useNotifications'
import { getBottomNavigation, getUserRole, isNavigationItemActive } from '@/config/navigation'

export default function BottomNavigation() {
  const pathname = usePathname()
  const { user, profile } = useAuthContext()
  const { colors } = useTheme()
  const convCtx = useConversationContextOptional()
  const { unreadCount } = useNotifications(user?.id)

  const role = getUserRole(profile)
  const navItems = getBottomNavigation(role)

  if (pathname.startsWith('/auth/') || pathname.startsWith('/places/')) return null

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t safe-area-bottom surface-chameleon-glass"
      style={{
        borderColor: 'var(--color-outline)',
        boxShadow: 'var(--shadow-top)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      <div className="flex items-center justify-around min-h-[64px] px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isMessages = item.id === 'messages'
          const isSidebarOpen = convCtx?.isSidebarOpen ?? false
          const isActive = isMessages
            ? pathname === '/messages' || isSidebarOpen
            : isNavigationItemActive(item, pathname)
          const badge = isMessages
            ? (convCtx?.totalUnreadCount ?? unreadCount)
            : item.badge

          const content = (
            <>
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="transition-all" />
                {badge != null && Number(badge) > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold rounded-full px-1 bg-error text-on-error"
                  >
                    {Number(badge) > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className="text-label-small font-medium line-clamp-1">
                {item.label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full bg-primary"
                  aria-hidden
                />
              )}
            </>
          )

          const className = `
            flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-extra-large
            transition-all duration-200 relative min-w-[64px] min-h-[48px]
            ${isActive ? 'bg-primary/10 text-primary' : 'text-on-surface'}
          `

          if (isMessages && convCtx) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => convCtx.openSidebar()}
                className={className}
                aria-label={item.label}
              >
                {content}
              </button>
            )
          }

          return (
            <Link key={item.id} href={item.href} className={className}>
              {content}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
