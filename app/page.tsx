'use client'

import { useEffect, useState, useRef } from 'react'
import { useUnifiedFeed, type EntityType } from '@/hooks/useUnifiedFeed'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { BanCard, BanSkeleton } from '@/components/common'
import { BodySmall, BodyMedium, TitleSmall, LabelSmall } from '@/components/m3'
import type { PlaceFeedItem, PostFeedItem, ProductFeedItem } from '@/hooks/useUnifiedFeed'

const TABS: { key: EntityType; label: string }[] = [
  { key: 'places', label: 'الأماكن' },
  { key: 'posts', label: 'المنشورات' },
  { key: 'products', label: 'المنتجات' },
]
const EMPTY_PLACE_LABEL = 'مكان'

interface FollowedPlace {
  id: string
  name_ar: string | null
  logo_url: string | null
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<EntityType>('places')
  const [followedPlaces, setFollowedPlaces] = useState<FollowedPlace[]>([])
  const [storiesLoading, setStoriesLoading] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const { user } = useAuthContext()
  const { colors } = useTheme()
  const { items, fetchNextPage, hasNextPage, loading, error } = useUnifiedFeed({ entityType: activeTab })

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured()) {
      setFollowedPlaces([])
      setStoriesLoading(false)
      return
    }
    setStoriesLoading(true)
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('follows')
          .select('places(id, name_ar, logo_url)')
          .eq('follower_id', user.id)
        if (error) {
          setFollowedPlaces([])
          return
        }
        type Row = { places: FollowedPlace | FollowedPlace[] | null }
        const list = (data || []).flatMap((r: Row) => {
          const p = (r as Row).places
          if (!p) return []
          return Array.isArray(p) ? p : [p]
        }) as FollowedPlace[]
        setFollowedPlaces(list)
      } finally {
        setStoriesLoading(false)
      }
    }
    void load()
  }, [user?.id])

  useEffect(() => {
    if (!hasNextPage || loading) return
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage()
      },
      { rootMargin: '200px', threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasNextPage, loading, fetchNextPage])

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Stories: متابعات المستخدم — M3 Surface + 16dp padding */}
      <section
        aria-label="الأماكن المتابعة"
        className="border-b px-4 py-4"
        style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
      >
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4" role="list">
          {storiesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <BanSkeleton key={`story-skeleton-${i}`} variant="avatar" className="shrink-0" />
            ))
          ) : followedPlaces.length === 0 ? (
            <BodySmall color="onSurfaceVariant" className="py-2">
              {user?.id ? 'لم تتابع أي مكان بعد' : 'سجّل الدخول لمتابعة الأماكن'}
            </BodySmall>
          ) : (
            followedPlaces.map((place) => (
              <a
                key={place.id}
                href={`/places/${place.id}`}
                className="flex flex-col items-center gap-1.5 shrink-0 min-w-[64px] min-h-[48px] touch-manipulation"
                aria-label={place.name_ar || EMPTY_PLACE_LABEL}
              >
                <div
                  className="w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0"
                  style={{ borderColor: colors.primary, backgroundColor: colors.surface }}
                >
                  {place.logo_url ? (
                    <img src={place.logo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ color: colors.onSurfaceVariant }}
                    >
                      <TitleSmall>{place.name_ar?.[0] || '?'}</TitleSmall>
                    </div>
                  )}
                </div>
                <LabelSmall color="onSurface" className="truncate max-w-[64px] text-center">
                  {place.name_ar || EMPTY_PLACE_LABEL}
                </LabelSmall>
              </a>
            ))
          )}
        </div>
      </section>

      {/* Tabs: M3 Surface + مؤشر ذهبي تحت النشط */}
      <div
        role="tablist"
        aria-label="نوع المحتوى"
        className="sticky top-[var(--header-height,56px)] z-30 border-b"
        style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
      >
        <div className="flex px-4">
          {TABS.map((tab) => (
            <div key={tab.key} className="flex-1 flex flex-col items-center">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls="feed-panel"
                id={`tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className="w-full min-h-[48px] rounded-extra-large transition-colors border-0 shadow-none hover:opacity-90 active:opacity-80"
                style={{
                  color: activeTab === tab.key ? colors.primary : colors.onSurface,
                  backgroundColor:
                    activeTab === tab.key ? `rgba(${colors.primaryRgb}, 0.1)` : 'transparent',
                }}
              >
                <TitleSmall as="span" color={activeTab === tab.key ? 'primary' : 'onSurface'}>
                  {tab.label}
                </TitleSmall>
              </button>
              {activeTab === tab.key && (
                <span
                  className="w-10 h-1 rounded-full mt-0.5 shrink-0"
                  style={{ backgroundColor: colors.primary }}
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feed — M3: خلفية رئيسية + 16dp أفقياً، 24dp عمودياً */}
      <main id="feed-panel" role="tabpanel" aria-label="التغذية" className="container mx-auto px-4 py-6 max-w-6xl">
        {error != null ? (
          <BodyMedium color="error" className="text-center py-6" role="alert">
            حدث خطأ في التحميل. حاول مرة أخرى.
          </BodyMedium>
        ) : null}

        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <BanSkeleton key={`card-skeleton-${i}`} variant="card" lines={3} />
            ))}
          </div>
        ) : !loading && items.length === 0 && !error ? (
          <BodyMedium color="onSurfaceVariant" className="text-center py-12">
            لا يوجد {activeTab === 'places' ? 'أماكن' : activeTab === 'posts' ? 'منشورات' : 'منتجات'} لعرضها.
          </BodyMedium>
        ) : error && items.length === 0 ? null : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((item) =>
              activeTab === 'places' ? (
                <BanCard key={item.id} layout="places" item={item as PlaceFeedItem} />
              ) : activeTab === 'posts' ? (
                <BanCard key={item.id} layout="posts" item={item as PostFeedItem} />
              ) : (
                <BanCard key={item.id} layout="products" item={item as ProductFeedItem} />
              )
            )}
          </div>
        )}

        {loading && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4" aria-busy="true">
            <BanSkeleton variant="card" lines={3} />
            <BanSkeleton variant="card" lines={3} className="hidden md:block" />
            <BanSkeleton variant="card" lines={3} className="hidden md:block" />
          </div>
        )}

        <div ref={sentinelRef} className="h-4 w-full" aria-hidden />
      </main>
    </div>
  )
}
