'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useConversationContext } from '@/contexts/ConversationContext'
import { MessageCircle, Search, Users, Package, MapPin } from 'lucide-react'
import { PageSkeleton } from '@/components/common'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Button, TitleSmall, LabelMedium } from '@/components/m3'

export default function MessagesPage() {
  const router = useRouter()
  const { user } = useAuthContext()
  const { colors } = useTheme()
  const { getConversations, openConversation, userPlaces } = useConversationContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'places' | 'products' | 'employees'>('all')
  const [selectedPlaceFilter, setSelectedPlaceFilter] = useState<string | null>(null)
  
  const conversations = useMemo(() => getConversations(), [getConversations])
  const placesToShow = (userPlaces ?? []).slice(0, 2)
  
  const loading = false
  const unreadCounts = useMemo(() => {
    const total = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0)
    return { total }
  }, [conversations])

  // Filter conversations: أولاً بالمكان (صاحب المكان)، ثم البحث ونوع الفلتر
  const filteredConversations = useMemo(() => {
    let list = conversations || []
    if (selectedPlaceFilter) {
      list = list.filter((c) => c.placeId === selectedPlaceFilter)
    }
    return list.filter(conv => {
      const lastMessageText = typeof conv.lastMessage === 'string' ? conv.lastMessage : ''
      const matchesSearch = searchQuery.trim() === '' || 
        conv.placeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lastMessageText.toLowerCase().includes(searchQuery.toLowerCase())
      let matchesType = true
      if (filterType !== 'all') {
        if (filterType === 'places') matchesType = !conv.productId && !conv.employeeId
        if (filterType === 'products') matchesType = !!conv.productId
        if (filterType === 'employees') matchesType = !!conv.employeeId
      }
      return matchesSearch && matchesType
    })
  }, [conversations, selectedPlaceFilter, searchQuery, filterType])

  // Get conversation icon based on type
  const getConversationIcon = (conv: any) => {
    if (conv.employeeId) return <Users size={20} style={{ color: colors.primary }} />
    if (conv.productId) return <Package size={20} style={{ color: colors.primary }} />
    return <MapPin size={20} style={{ color: colors.primary }} />
  }

  // Get conversation subtitle
  const getConversationSubtitle = (conv: any) => {
    if (conv.employeeId) return 'موظف'
    if (conv.productId) return conv.productName || 'منتج'
    return 'مكان'
  }

  const handleConversationClick = (conv: any) => {
    if (conv.placeId && conv.senderId) {
      openConversation(conv.placeId, conv.senderId)
    }
  }

  if (!user) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div className="text-center">
          <MessageCircle 
            size={64} 
            className="mx-auto mb-4" 
            style={{ color: colors.onSurface, opacity: 0.3 }} 
          />
          <h3 
            className="text-xl font-bold mb-2"
            style={{ color: colors.onSurface }}
          >
            يجب تسجيل الدخول
          </h3>
          <p 
            className="mb-4"
            style={{ color: colors.onSurface }}
          >
            قم بتسجيل الدخول لعرض رسائلك
          </p>
          <Button onClick={() => router.push('/auth/login')} variant="filled" size="md">
            تسجيل الدخول
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen py-6 px-4"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 
            className="text-3xl font-bold mb-2 flex items-center gap-3"
            style={{ color: colors.onSurface }}
          >
            <MessageCircle size={32} style={{ color: colors.primary }} />
            الرسائل
          </h1>
          <p style={{ color: colors.onSurface }}>
            {unreadCounts?.total > 0 
              ? `لديك ${unreadCounts.total} رسالة غير مقروءة`
              : 'جميع رسائلك'
            }
          </p>
        </div>

        {/* شريط الأماكن — صاحب المكان: مكان أو اثنين، النقر يعرض عملاء هذا المكان فقط */}
        {placesToShow.length > 0 && (
          <div
            className="flex gap-2 mb-4 overflow-x-auto pb-2"
            style={{ borderWidth: 0, borderStyle: 'solid', borderColor: colors.outline }}
          >
            {selectedPlaceFilter && (
              <Button
                type="button"
                onClick={() => setSelectedPlaceFilter(null)}
                variant="outlined"
                size="sm"
                className="shrink-0"
                style={{ borderColor: colors.outline, color: colors.onSurfaceVariant }}
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
                className="shrink-0 flex items-center gap-2"
                style={
                  selectedPlaceFilter === place.id
                    ? {}
                    : { borderColor: colors.outline, color: colors.onSurface }
                }
              >
                {place.logo_url ? (
                  <img src={place.logo_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: selectedPlaceFilter === place.id ? colors.onPrimary : colors.outline,
                      color: selectedPlaceFilter === place.id ? colors.primary : colors.onSurfaceVariant,
                    }}
                  >
                    {(place.name_ar || '?')[0]}
                  </span>
                )}
                <TitleSmall as="span" className="truncate max-w-[100px]">
                  {place.name_ar || 'مكان'}
                </TitleSmall>
              </Button>
            ))}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-4">
          <div 
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{
              backgroundColor: colors.surfaceVariant,
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: colors.outline
            }}
          >
            <Search size={20} style={{ color: colors.onSurface }} />
            <input
              type="text"
              placeholder="ابحث في الرسائل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-base"
              style={{ color: colors.onSurface }}
            />
          </div>
        </div>

        {/* Filter Tabs — M3 Button */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'all', label: 'الكل', count: (conversations || []).length },
            { id: 'places', label: 'الأماكن', count: (conversations || []).filter(c => !c.productId && !c.employeeId).length },
            { id: 'products', label: 'المنتجات', count: (conversations || []).filter(c => c.productId).length },
            { id: 'employees', label: 'الموظفين', count: (conversations || []).filter(c => c.employeeId).length }
          ].map((tab) => (
            <Button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as any)}
              variant={filterType === tab.id ? 'filled' : 'outlined'}
              size="sm"
              className="shrink-0 flex items-center gap-2"
              style={
                filterType === tab.id
                  ? {}
                  : { borderColor: colors.outline, color: colors.onSurface }
              }
            >
              <LabelMedium as="span">{tab.label}</LabelMedium>
              {tab.count > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: filterType === tab.id ? colors.onPrimary : colors.outline,
                    color: filterType === tab.id ? colors.primary : colors.onSurface,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Conversations List */}
        {loading ? (
          <PageSkeleton variant="list" className="py-8" />
        ) : filteredConversations.length === 0 ? (
          <div 
            className="text-center py-20 rounded-3xl"
            style={{ backgroundColor: colors.surface }}
          >
            <MessageCircle 
              size={64} 
              className="mx-auto mb-4" 
              style={{ color: colors.onSurface, opacity: 0.3 }} 
            />
            <h3 
              className="text-xl font-bold mb-2"
              style={{ color: colors.onSurface }}
            >
              {searchQuery || filterType !== 'all' || selectedPlaceFilter
                ? 'لا توجد نتائج'
                : 'لا توجد رسائل بعد'}
            </h3>
            <p style={{ color: colors.onSurface }}>
              {selectedPlaceFilter && !searchQuery && filterType === 'all'
                ? 'لا يوجد عملاء راسلوا هذا المكان بعد'
                : searchQuery || filterType !== 'all'
                  ? 'جرب البحث بكلمات مختلفة أو غيّر الفلتر'
                  : 'ابدأ محادثة مع أحد الأماكن'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conv) => {
              const unreadCount = conv.unreadCount || 0
              const hasUnread = unreadCount > 0

              return (
                <div
                  key={`${conv.senderId}-${conv.placeId}`}
                  onClick={() => handleConversationClick(conv)}
                  className="rounded-3xl p-4 cursor-pointer transition-all hover:scale-[1.01] border"
                  style={{
                    backgroundColor: hasUnread ? colors.surfaceContainer : colors.surface,
                    borderColor: hasUnread ? colors.primary : colors.outline,
                    borderWidth: hasUnread ? '2px' : '1px'
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div 
                      className="rounded-full p-3 flex-shrink-0"
                      style={{
                        backgroundColor: colors.surfaceVariant
                      }}
                    >
                      {getConversationIcon(conv)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 
                          className="font-bold text-lg truncate"
                          style={{ 
                            color: hasUnread ? colors.primary : colors.onSurface 
                          }}
                        >
                          {conv.placeName}
                        </h3>
                        {conv.lastMessageTime && (
                          <span 
                            className="text-xs whitespace-nowrap flex-shrink-0"
                            style={{ 
                              color: hasUnread ? colors.primary : colors.onSurface 
                            }}
                          >
                            {formatDistanceToNow(new Date(conv.lastMessageTime), { 
                              addSuffix: true, 
                              locale: ar 
                            })}
                          </span>
                        )}
                      </div>

                      <p 
                        className="text-sm mb-1"
                        style={{ 
                          color: hasUnread ? colors.primary : colors.onSurface 
                        }}
                      >
                        {getConversationSubtitle(conv)}
                      </p>

                      {conv.lastMessage && (
                        <div className="flex items-center justify-between gap-2">
                          <p 
                            className="text-sm truncate"
                            style={{ 
                              color: hasUnread ? colors.primary : colors.onSurface,
                              fontWeight: hasUnread ? 600 : 400
                            }}
                          >
                            {conv.lastMessage}
                          </p>
                          {hasUnread && (
                            <div
                              className="rounded-full px-2 py-1 text-xs font-bold flex-shrink-0"
                              style={{
                                backgroundColor: colors.primary,
                                color: colors.onPrimary
                              }}
                            >
                              {unreadCount}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
