'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useConversationContextOptional } from '@/contexts/ConversationContext'
import { MessageCircle, X } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button, TitleSmall, LabelMedium } from '@/components/m3'

export default function ConversationsSidebar() {
  const { user } = useAuthContext()
  const { colors } = useTheme()
  const ctx = useConversationContextOptional()
  const [isMounted, setIsMounted] = useState(false)
  const [selectedPlaceFilter, setSelectedPlaceFilter] = useState<string | null>(null)

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
    userPlaces,
  } = ctx

  const allConversations = getConversations()
  const placesToShow = (userPlaces ?? []).slice(0, 2)
  const conversations = selectedPlaceFilter
    ? allConversations.filter((c) => c.placeId === selectedPlaceFilter)
    : allConversations

  return (
    <>
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
          <Button
            onClick={closeSidebar}
            variant="text"
            size="sm"
            className="!min-h-0 !p-2"
            style={{ color: colors.onSurfaceVariant }}
            aria-label="إغلاق"
          >
            <X size={20} />
          </Button>
        </div>

        {/* شريط الأماكن — صاحب المكان: مكان أو اثنين أعلى المحادثات، النقر يفلتر العملاء */}
        {placesToShow.length > 0 && (
          <div
            className="px-4 pt-3 pb-2 border-b flex gap-2 overflow-x-auto"
            style={{ borderColor: colors.outline, backgroundColor: colors.surface }}
          >
            {selectedPlaceFilter && (
              <Button
                type="button"
                onClick={() => setSelectedPlaceFilter(null)}
                variant="outlined"
                size="sm"
                className="shrink-0 !min-h-0 py-2"
              >
                <LabelMedium as="span">الكل</LabelMedium>
              </Button>
            )}
            {placesToShow.map((place: { id: string; name_ar?: string | null; logo_url?: string | null }) => (
              <Button
                key={place.id}
                type="button"
                onClick={() => setSelectedPlaceFilter(selectedPlaceFilter === place.id ? null : place.id)}
                variant={selectedPlaceFilter === place.id ? 'filled' : 'outlined'}
                size="sm"
                className="shrink-0 flex items-center gap-2 !min-h-0 py-2"
              >
                {place.logo_url ? (
                  <img src={place.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                    style={{
                      backgroundColor: selectedPlaceFilter === place.id ? colors.surfaceContainer : colors.outline,
                      color: selectedPlaceFilter === place.id ? colors.primary : colors.onSurfaceVariant,
                    }}
                  >
                    {(place.name_ar || '?')[0]}
                  </div>
                )}
                <TitleSmall as="span" className="truncate max-w-[120px]">
                  {place.name_ar || 'مكان'}
                </TitleSmall>
              </Button>
            ))}
          </div>
        )}

        <div className="p-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle
                size={48}
                className="mx-auto mb-4"
                style={{ color: colors.onSurfaceVariant }}
              />
              <p style={{ color: colors.onSurfaceVariant }}>
                {selectedPlaceFilter
                  ? 'لا يوجد عملاء راسلوا هذا المكان بعد'
                  : 'لا توجد محادثات بعد'}
              </p>
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
