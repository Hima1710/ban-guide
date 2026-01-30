'use client'

import { useEffect, useState, useRef } from 'react'
import { useUnifiedFeed, type EntityType } from '@/hooks/useUnifiedFeed'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { BanCard, BanSkeleton } from '@/components/common'
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
    <div className="min-h-screen bg-background">
      {/* Stories: متابعات المستخدم */}
      <section aria-label="الأماكن المتابعة" className="border-b border-outline bg-surface px-3 py-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-3 px-3" role="list">
          {storiesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <BanSkeleton key={`story-skeleton-${i}`} variant="avatar" className="shrink-0" />
            ))
          ) : followedPlaces.length === 0 ? (
            <p className="text-body-small text-on-surface-variant py-2 px-1">
              {user?.id ? 'لم تتابع أي مكان بعد' : 'سجّل الدخول لمتابعة الأماكن'}
            </p>
          ) : (
            followedPlaces.map((place) => (
              <a
                key={place.id}
                href={`/places/${place.id}`}
                className="flex flex-col items-center gap-1.5 shrink-0 min-w-[64px] min-h-[48px] touch-manipulation"
                aria-label={place.name_ar || EMPTY_PLACE_LABEL}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary flex-shrink-0 bg-surface">
                  {place.logo_url ? (
                    <img src={place.logo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-title-small">
                      {place.name_ar?.[0] || '?'}
                    </div>
                  )}
                </div>
                <span className="text-label-small text-on-surface truncate max-w-[64px] text-center">
                  {place.name_ar || EMPTY_PLACE_LABEL}
                </span>
              </a>
            ))
          )}
        </div>
      </section>

      {/* Tabs: transparent bg, gold indicator pill under active */}
      <div
        role="tablist"
        aria-label="نوع المحتوى"
        className="sticky top-[var(--header-height,56px)] z-30 bg-transparent border-b border-outline"
      >
        <div className="flex px-2">
          {TABS.map((tab) => (
            <div key={tab.key} className="flex-1 flex flex-col items-center">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls="feed-panel"
                id={`tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  w-full min-h-[48px] rounded-extra-large text-title-small font-semibold transition-colors
                  ${activeTab === tab.key ? 'text-primary' : 'text-on-surface-variant'}
                `}
              >
                {tab.label}
              </button>
              {activeTab === tab.key && (
                <span
                  className="w-10 h-1 rounded-full bg-primary mt-0.5 shrink-0"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feed */}
      <main id="feed-panel" role="tabpanel" aria-label="التغذية" className="container mx-auto px-3 py-4 max-w-6xl">
        {error != null ? (
          <p className="text-body-medium text-error text-center py-4" role="alert">
            حدث خطأ في التحميل. حاول مرة أخرى.
          </p>
        ) : null}

        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <BanSkeleton key={`card-skeleton-${i}`} variant="card" lines={3} />
            ))}
          </div>
        ) : !loading && items.length === 0 && !error ? (
          <p className="text-body-medium text-on-surface-variant text-center py-12">
            لا يوجد {activeTab === 'places' ? 'أماكن' : activeTab === 'posts' ? 'منشورات' : 'منتجات'} لعرضها.
          </p>
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
