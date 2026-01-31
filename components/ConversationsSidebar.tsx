'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useConversationContextOptional } from '@/contexts/ConversationContext'
import { MessageCircle, X } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function ConversationsSidebar() {
  const { user } = useAuthContext()
  const { colors } = useTheme()
  const ctx = useConversationContextOptional()
  const [isMounted, setIsMounted] = useState(false)

  const isOpen = ctx?.isSidebarOpen ?? false
  const openSidebar = ctx?.openSidebar ?? (() => {})
  const closeSidebar = ctx?.closeSidebar ?? (() => {})

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      const isDesktop = window.innerWidth >= 1024
      if (isDesktop) {
        root.style.setProperty('--sidebar-width', isOpen ? '384px' : '0px')
      }
    }
  }, [isOpen])

  if (!isMounted || !user) return null
  if (!ctx) return null

  const {
    getConversations,
    openConversation,
  } = ctx

  const conversations = getConversations()

  return (
    <>
      {/* Desktop Toggle Button */}
      <button
        onClick={() => (isOpen ? closeSidebar() : openSidebar())}
        className="hidden lg:flex fixed w-14 h-14 rounded-full shadow-lg transition-all z-[70] items-center justify-center relative"
        style={{
          background: colors.primary,
          color: colors.onPrimary,
          top: '5.5rem',
          left: '1rem',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        aria-label="فتح/إغلاق المحادثات"
      >
        <MessageCircle size={24} />
        {conversations.filter((c) => c.unreadCount > 0).length > 0 && (
          <span
            className="absolute -top-1 -left-1 w-6 h-6 text-xs font-bold rounded-full flex items-center justify-center border-2"
            style={{
              backgroundColor: colors.error,
              color: colors.onPrimary,
              borderColor: colors.surface,
            }}
          >
            {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
          </span>
        )}
      </button>

      {/* Mobile Toggle Button */}
      <button
        onClick={() => (isOpen ? closeSidebar() : openSidebar())}
        className="lg:hidden fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg transition-all z-50 flex items-center justify-center relative"
        style={{ background: colors.primary, color: colors.onPrimary }}
        aria-label="فتح/إغلاق المحادثات"
      >
        <MessageCircle size={24} />
        {conversations.filter((c) => c.unreadCount > 0).length > 0 && (
          <span
            className="absolute -top-1 -left-1 w-6 h-6 text-xs font-bold rounded-full flex items-center justify-center border-2"
            style={{
              backgroundColor: colors.error,
              color: colors.onPrimary,
              borderColor: colors.surface,
            }}
          >
            {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
          </span>
        )}
      </button>

      {/* Backdrop for Desktop */}
      {isOpen && (
        <div
          className="hidden lg:block fixed inset-0 z-[55]"
          style={{ backgroundColor: colors.overlay }}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar – list only; clicking opens Drawer */}
      <div
        className={`fixed top-0 right-0 h-full shadow-lg transition-transform duration-300 z-[65] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } w-full lg:w-96`}
        style={{
          paddingTop: 'var(--header-height)',
          height: '100vh',
          overflowY: 'auto',
          backgroundColor: colors.background,
        }}
      >
        <div
          className="flex items-center justify-between p-4 border-b sticky top-0 z-10"
          style={{ borderColor: colors.outline, backgroundColor: colors.background }}
        >
          <h2 className="text-xl font-bold" style={{ color: colors.onSurface }}>
            المحادثات
          </h2>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-full transition-colors"
            style={{ color: colors.onSurfaceVariant }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.surfaceContainer
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle
                size={48}
                className="mx-auto mb-4"
                style={{ color: colors.onSurfaceVariant }}
              />
              <p style={{ color: colors.onSurfaceVariant }}>لا توجد محادثات بعد</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={`${conv.senderId}-${conv.placeId}`}
                  onClick={() => {
                    openConversation(conv.placeId, conv.senderId)
                    closeSidebar()
                  }}
                  className="p-3 rounded-lg cursor-pointer transition-all border"
                  style={{ borderColor: colors.outline }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.surfaceContainer
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div className="flex items-start gap-3">
                    {conv.partnerAvatar ? (
                      <img
                        src={conv.partnerAvatar}
                        alt={conv.partnerName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                        style={{
                          background: colors.primary,
                          color: colors.onPrimary,
                        }}
                      >
                        {conv.partnerName?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p
                          className="font-semibold truncate"
                          style={{ color: colors.onSurface }}
                        >
                          {conv.partnerName}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: colors.error,
                              color: colors.onPrimary,
                            }}
                          >
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-sm mb-1 truncate"
                        style={{ color: colors.onSurfaceVariant }}
                      >
                        {conv.placeName}
                      </p>
                      <p
                        className="text-xs line-clamp-1"
                        style={{ color: colors.onSurfaceVariant }}
                      >
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60]"
          style={{ backgroundColor: colors.overlay }}
          onClick={closeSidebar}
        />
      )}
    </>
  )
}
