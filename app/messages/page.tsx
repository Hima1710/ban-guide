'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useConversationContext } from '@/contexts/ConversationContext'
import { usePlacesForMessages } from '@/hooks/usePlacesForMessages'
import { getPlaceEmployees, getPlaceFollowers, type PlaceEmployeeProfile, type FollowerProfile } from '@/lib/api/messagesPlaces'
import type { PlaceWithRole, PlaceRoleInMessages } from '@/lib/api/messagesPlaces'
import { getPlaceById } from '@/lib/api/places'
import type { Conversation } from '@/types'
import { MessageCircle, MapPin, Users, UserCircle, ChevronLeft } from 'lucide-react'
import { PageSkeleton, BanSkeleton, VirtualList } from '@/components/common'
import { useScrollContainer } from '@/contexts/ScrollContainerContext'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import { Button, TitleSmall, LabelMedium, BodySmall } from '@/components/m3'
import MessagesInlineChat from '@/components/MessagesInlineChat'
import { showError } from '@/components/SweetAlert'

const ROLE_LABELS: Record<PlaceRoleInMessages, string> = {
  owner: 'أماكني',
  employee: 'أماكن أعمل فيها',
  follower: 'أماكن أتابعها',
}

export default function MessagesPage() {
  const router = useRouter()
  const { user } = useAuthContext()
  const { colors } = useTheme()
  const { getConversations, selectConversation } = useConversationContext()
  const { ownedPlaces, employedPlaces, followedPlaces, placesWithRole, loading, error: placesError } = usePlacesForMessages()

  const [filterRole, setFilterRole] = useState<PlaceRoleInMessages>('owner')
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithRole | null>(null)
  const [placeEmployees, setPlaceEmployees] = useState<PlaceEmployeeProfile[]>([])
  const [placeFollowers, setPlaceFollowers] = useState<FollowerProfile[]>([])
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [openingConversationPlaceId, setOpeningConversationPlaceId] = useState<string | null>(null)
  /** بعد هذا الوقت نوقف السكيلتون ونعرض المحتوى حتى لو التحميل لم ينتهِ */
  const [loadingTimedOut, setLoadingTimedOut] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const scrollRef = useScrollContainer()

  const conversations = useMemo(() => getConversations(), [getConversations])

  const openConversationFromList = useCallback(
    async (conv: Conversation) => {
      setOpeningConversationPlaceId(conv.placeId)
      try {
        const place = await getPlaceById(conv.placeId)
        if (place) setSelectedPlace({ place, role: 'owner' })
        selectConversation(conv.senderId, conv.placeId)
      } catch {
        showError('تعذّر فتح المحادثة. جرّب مرة أخرى.')
      } finally {
        setOpeningConversationPlaceId(null)
      }
    },
    [selectConversation]
  )

  useEffect(() => {
    if (!loading || placesWithRole.length > 0) {
      setLoadingTimedOut(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }
    timeoutRef.current = setTimeout(() => {
      setLoadingTimedOut(true)
      timeoutRef.current = null
    }, 4000)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [loading, placesWithRole.length])

  const placesByFilter = useMemo(() => {
    if (filterRole === 'owner') return ownedPlaces
    if (filterRole === 'employee') return employedPlaces
    return followedPlaces
  }, [filterRole, ownedPlaces, employedPlaces, followedPlaces])

  const placesWithRoleFiltered = useMemo(
    () => placesWithRole.filter((p) => p.role === filterRole),
    [placesWithRole, filterRole]
  )

  /** صفوف الأماكن — كل صف عنصران لاستخدام VirtualList (شبكة 2 أعمدة) */
  const placesGridRows = useMemo(() => {
    const rows: PlaceWithRole[][] = []
    for (let i = 0; i < placesWithRoleFiltered.length; i += 2) {
      rows.push(placesWithRoleFiltered.slice(i, i + 2))
    }
    return rows
  }, [placesWithRoleFiltered])

  useEffect(() => {
    if (!selectedPlace) {
      setPlaceEmployees([])
      setPlaceFollowers([])
      return
    }
    const placeId = selectedPlace.place.id
    setLoadingPartners(true)
    Promise.all([getPlaceEmployees(placeId), getPlaceFollowers(placeId)])
      .then(([employees, followers]) => {
        setPlaceEmployees(employees)
        setPlaceFollowers(followers)
      })
      .finally(() => setLoadingPartners(false))
  }, [selectedPlace?.place.id])

  const clientsForPlace = useMemo(() => {
    if (!selectedPlace) return []
    return conversations.filter((c) => c.placeId === selectedPlace.place.id)
  }, [conversations, selectedPlace])

  const openChat = useCallback(
    (partnerId: string) => {
      if (!selectedPlace) return
      selectConversation(partnerId, selectedPlace.place.id)
    },
    [selectedPlace, selectConversation]
  )

  const openMyConversation = useCallback(() => {
    if (!selectedPlace) return
    openChat(selectedPlace.place.user_id)
  }, [selectedPlace, openChat])

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div className="text-center px-4">
          <MessageCircle size={64} className="mx-auto mb-4 opacity-30" style={{ color: colors.onSurface }} />
          <TitleSmall as="h2" color="onSurface" className="mb-2">
            يجب تسجيل الدخول
          </TitleSmall>
          <BodySmall color="onSurfaceVariant" className="mb-4 block">
            قم بتسجيل الدخول لعرض رسائلك
          </BodySmall>
          <Button onClick={() => router.push('/auth/login')} variant="filled" size="md">
            تسجيل الدخول
          </Button>
        </div>
      </div>
    )
  }

  const showSkeleton = loading && placesWithRole.length === 0 && !loadingTimedOut

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    console.log('[Messages] المحتوى ظهر ✓', {
      loading,
      placesCount: placesWithRole.length,
      conversationsCount: conversations.length,
      showSkeleton,
    })
  }, [loading, placesWithRole.length, conversations.length, showSkeleton])

  return (
    <div
      className="min-h-full py-4 px-4"
      style={{ backgroundColor: colors.background, minHeight: 'min(100%, 400px)' }}
    >
      <div className="container mx-auto max-w-5xl">
        <header className="mb-4 py-2">
          <h1 className="flex items-center gap-3 mb-1" style={{ color: colors.onSurface }}>
            <MessageCircle size={28} style={{ color: colors.primary }} />
            <TitleSmall as="span">المحادثات</TitleSmall>
          </h1>
          <BodySmall color="onSurfaceVariant">
            فلتر حسب الدور: أماكنك، أماكن تعمل فيها، أو أماكن تتابعها
          </BodySmall>
        </header>

        {placesError ? (
          <div
            className="rounded-2xl border p-4 mb-4"
            style={{ borderColor: colors.error, backgroundColor: colors.surface }}
          >
            <BodySmall color="onSurface">
              حدث خطأ في تحميل الأماكن. تحقق من الاتصال وحاول مرة أخرى.
            </BodySmall>
          </div>
        ) : null}

        {selectedPlace ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
            <div className="flex-shrink-0 w-full lg:max-w-[320px] space-y-4">
              <Button
                type="button"
                variant="text"
                size="sm"
                onClick={() => setSelectedPlace(null)}
                className="gap-2"
                style={{ color: colors.primary }}
              >
                <ChevronLeft size={20} />
                <LabelMedium as="span">العودة للأماكن</LabelMedium>
              </Button>

              <div className="rounded-2xl border p-3" style={{ borderColor: colors.outline, backgroundColor: colors.surface }}>
                <div className="flex items-center gap-3 mb-3">
                  {selectedPlace.place.logo_url ? (
                    <img
                      src={selectedPlace.place.logo_url}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colors.surfaceContainer, color: colors.primary }}
                    >
                      <MapPin size={24} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <TitleSmall as="p" color="onSurface" className="truncate">
                      {selectedPlace.place.name_ar || 'مكان'}
                    </TitleSmall>
                    <BodySmall color="onSurfaceVariant">{ROLE_LABELS[selectedPlace.role]}</BodySmall>
                  </div>
                </div>

                {loadingPartners ? (
                  <div className="space-y-2">
                    <BanSkeleton variant="text" className="h-12" />
                    <BanSkeleton variant="text" className="h-12" />
                    <BanSkeleton variant="text" className="h-12" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    {selectedPlace.role === 'follower' && (
                      <Button
                        type="button"
                        variant="text"
                        size="md"
                        onClick={openMyConversation}
                        className="w-full justify-start gap-3 rounded-xl"
                        style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurface }}
                      >
                        <UserCircle size={24} style={{ color: colors.primary }} />
                        <LabelMedium as="span" className="flex-1 min-w-0 text-start">محادثتي مع المكان</LabelMedium>
                      </Button>
                    )}

                    {selectedPlace.role !== 'follower' && placeEmployees.length > 0 && (
                      <>
                        <BodySmall color="onSurfaceVariant" className="px-2 py-1 block">
                          الموظفون
                        </BodySmall>
                        {placeEmployees.map((emp) => (
                          <Button
                            key={emp.id}
                            type="button"
                            variant="text"
                            size="md"
                            onClick={() => openChat(emp.user_id)}
                            className="w-full justify-start gap-3 rounded-xl"
                            style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurface }}
                          >
                            {emp.avatar_url ? (
                              <img src={emp.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: colors.outline, color: colors.onSurface }}
                              >
                                <Users size={20} />
                              </div>
                            )}
                            <LabelMedium as="span" className="flex-1 min-w-0 truncate text-start">
                              {emp.full_name || 'موظف'}
                            </LabelMedium>
                          </Button>
                        ))}
                      </>
                    )}

                    {selectedPlace.role !== 'follower' && clientsForPlace.length > 0 && (
                      <>
                        <BodySmall color="onSurfaceVariant" className="px-2 py-1 block">
                          العملاء
                        </BodySmall>
                        {clientsForPlace.map((conv) => (
                          <Button
                            key={`${conv.senderId}-${conv.placeId}`}
                            type="button"
                            variant="text"
                            size="md"
                            onClick={() => openChat(conv.senderId)}
                            className="w-full justify-start gap-3 rounded-xl"
                            style={{
                              backgroundColor: (conv.unreadCount ?? 0) > 0 ? colors.surfaceContainer : colors.surface,
                              borderColor: colors.outline,
                              borderWidth: '1px',
                            }}
                          >
                            {conv.partnerAvatar ? (
                              <img src={conv.partnerAvatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: colors.outline, color: colors.onSurface }}
                              >
                                <UserCircle size={20} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 text-start">
                              <LabelMedium as="span" className="truncate block">
                                {conv.partnerName || 'عميل'}
                              </LabelMedium>
                              {conv.lastMessageTime && (
                                <BodySmall color="onSurfaceVariant">
                                  {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true, locale: ar })}
                                </BodySmall>
                              )}
                            </div>
                            {(conv.unreadCount ?? 0) > 0 && (
                              <span
                                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                              >
                                {conv.unreadCount}
                              </span>
                            )}
                          </Button>
                        ))}
                      </>
                    )}

                    {selectedPlace.role !== 'follower' && placeFollowers.length > 0 && (
                      <>
                        <BodySmall color="onSurfaceVariant" className="px-2 py-1 block">
                          المتابعون
                        </BodySmall>
                        {placeFollowers.map((f) => (
                          <Button
                            key={f.id}
                            type="button"
                            variant="text"
                            size="md"
                            onClick={() => openChat(f.user_id)}
                            className="w-full justify-start gap-3 rounded-xl"
                            style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurface }}
                          >
                            {f.avatar_url ? (
                              <img src={f.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: colors.outline, color: colors.onSurface }}
                              >
                                <UserCircle size={20} />
                              </div>
                            )}
                            <LabelMedium as="span" className="flex-1 min-w-0 truncate text-start">
                              {f.full_name || 'متابع'}
                            </LabelMedium>
                          </Button>
                        ))}
                      </>
                    )}

                    {!loadingPartners &&
                      selectedPlace.role === 'follower' &&
                      clientsForPlace.length === 0 &&
                      placeEmployees.length === 0 &&
                      placeFollowers.length === 0 && (
                        <BodySmall color="onSurfaceVariant" className="py-4 block text-center">
                          اختر «محادثتي مع المكان» أعلاه
                        </BodySmall>
                      )}
                    {!loadingPartners &&
                      selectedPlace.role !== 'follower' &&
                      clientsForPlace.length === 0 &&
                      placeEmployees.length === 0 &&
                      placeFollowers.length === 0 && (
                        <BodySmall color="onSurfaceVariant" className="py-4 block text-center">
                          لا يوجد عملاء أو موظفون أو متابعون بعد
                        </BodySmall>
                      )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-[320px] flex flex-col">
              <MessagesInlineChat />
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2" role="tablist" aria-label="فلتر الأماكن">
              {(['owner', 'employee', 'follower'] as const).map((role) => (
                <Button
                  key={role}
                  type="button"
                  role="tab"
                  aria-selected={filterRole === role}
                  variant={filterRole === role ? 'filled' : 'outlined'}
                  size="sm"
                  onClick={() => setFilterRole(role)}
                  className="shrink-0"
                  style={
                    filterRole !== role
                      ? { borderColor: colors.outline, color: colors.onSurface }
                      : undefined
                  }
                >
                  <LabelMedium as="span">{ROLE_LABELS[role]}</LabelMedium>
                  {role === 'owner' && ownedPlaces.length > 0 && (
                    <span
                      className="mr-1 px-1.5 py-0.5 rounded-full text-xs"
                      style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurface }}
                    >
                      {ownedPlaces.length}
                    </span>
                  )}
                  {role === 'employee' && employedPlaces.length > 0 && (
                    <span
                      className="mr-1 px-1.5 py-0.5 rounded-full text-xs"
                      style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurface }}
                    >
                      {employedPlaces.length}
                    </span>
                  )}
                  {role === 'follower' && followedPlaces.length > 0 && (
                    <span
                      className="mr-1 px-1.5 py-0.5 rounded-full text-xs"
                      style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurface }}
                    >
                      {followedPlaces.length}
                    </span>
                  )}
                </Button>
              ))}
            </div>

            {showSkeleton ? (
              <div
                className="rounded-2xl border py-8 px-4"
                style={{ borderColor: colors.outline, backgroundColor: colors.surface }}
              >
                <PageSkeleton variant="list" />
              </div>
            ) : placesWithRoleFiltered.length === 0 ? (
              <div
                className="rounded-2xl border py-16 px-4 text-center"
                style={{ borderColor: colors.outline, backgroundColor: colors.surface }}
              >
                <MapPin size={48} className="mx-auto mb-3 opacity-40" style={{ color: colors.primary }} />
                <BodySmall color="onSurfaceVariant" className="block mb-2">
                  لا توجد أماكن في «{ROLE_LABELS[filterRole]}».
                </BodySmall>
                <BodySmall color="onSurfaceVariant" className="block">
                  {placesWithRole.length === 0
                    ? 'أنشئ مكاناً، أو تابع مكاناً، أو انضم كموظف في مكان لعرض المحادثات هنا.'
                    : 'غيّر التبويب (أماكن أتابعها / أماكن أعمل فيها) لعرض أماكن أخرى.'}
                </BodySmall>
              </div>
            ) : scrollRef && placesGridRows.length > 0 ? (
              <VirtualList<PlaceWithRole[]>
                items={placesGridRows}
                scrollElementRef={scrollRef}
                estimateSize={100}
                getItemKey={(_row, rowIndex) => rowIndex}
                renderItem={(row) => (
                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-element"
                    style={{ paddingBottom: 'var(--element-gap)' }}
                  >
                    {row.map(({ place, role }) => (
                      <Button
                        key={place.id}
                        type="button"
                        variant="text"
                        size="md"
                        onClick={() => setSelectedPlace({ place, role })}
                        className="flex items-center gap-3 p-main rounded-section border text-start h-auto"
                        style={{
                          borderColor: colors.outline,
                          backgroundColor: colors.surface,
                        }}
                      >
                        {place.logo_url ? (
                          <img src={place.logo_url} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
                        ) : (
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: colors.surfaceContainer, color: colors.primary }}
                          >
                            <MapPin size={28} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <TitleSmall as="p" color="onSurface" className="truncate">
                            {place.name_ar || 'مكان'}
                          </TitleSmall>
                          <BodySmall color="onSurfaceVariant">{ROLE_LABELS[role]}</BodySmall>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-element">
                {placesWithRoleFiltered.map(({ place, role }) => (
                  <Button
                    key={place.id}
                    type="button"
                    variant="text"
                    size="md"
                    onClick={() => setSelectedPlace({ place, role })}
                    className="flex items-center gap-3 p-main rounded-section border text-start h-auto"
                    style={{
                      borderColor: colors.outline,
                      backgroundColor: colors.surface,
                    }}
                  >
                    {place.logo_url ? (
                      <img src={place.logo_url} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: colors.surfaceContainer, color: colors.primary }}
                      >
                        <MapPin size={28} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <TitleSmall as="p" color="onSurface" className="truncate">
                        {place.name_ar || 'مكان'}
                      </TitleSmall>
                      <BodySmall color="onSurfaceVariant">{ROLE_LABELS[role]}</BodySmall>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
