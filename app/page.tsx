'use client'

import { useEffect, useState, useRef } from 'react'
import { useUnifiedFeed, type EntityType } from '@/hooks/useUnifiedFeed'
import { useEntityCounts } from '@/hooks/useEntityCounts'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useStoriesForFollowedPlaces, type PlaceWithStories } from '@/hooks/useStories'
import { BanCard, BanSkeleton, PostSkeleton } from '@/components/common'
import { BodySmall, BodyMedium, TitleSmall, LabelSmall, Button } from '@/components/m3'
import { Plus } from 'lucide-react'
import StoryViewer from '@/components/StoryViewer'
import { useAddStorySheet } from '@/contexts/AddStoryContext'
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
  const [ownedPlaces, setOwnedPlaces] = useState<FollowedPlace[]>([])
  const [followedPlacesLoading, setFollowedPlacesLoading] = useState(true)
  const [storyViewerPlace, setStoryViewerPlace] = useState<PlaceWithStories | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const placeIds = [...new Set([...ownedPlaces.map((p) => p.id), ...followedPlaces.map((p) => p.id)])]
  const { placesWithStories, loading: storiesLoading, refresh: refreshStories } = useStoriesForFollowedPlaces(placeIds)
  const placesWithStoriesMap = new Map(placesWithStories.map((p) => [p.placeId, p]))
  const myFirstPlaceId = ownedPlaces[0]?.id ?? null
  const myFirstPlaceName = ownedPlaces[0]?.name_ar ?? null
  const placesToShowInStrip = [...ownedPlaces, ...followedPlaces.filter((f) => !ownedPlaces.some((o) => o.id === f.id))]

  const { user } = useAuthContext()
  const { colors, isDark } = useTheme()
  const { openAddStorySheet } = useAddStorySheet()
  const { items, fetchNextPage, hasNextPage, loading, error } = useUnifiedFeed({ entityType: activeTab })

  const postIdsForCounts = activeTab === 'posts' ? items.map((i) => i.id) : []
  const { commentCountByEntityId, likeCountByEntityId } = useEntityCounts({
    entityIds: postIdsForCounts,
    entityType: 'post',
  })

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured()) {
      setFollowedPlaces([])
      setOwnedPlaces([])
      setFollowedPlacesLoading(false)
      return
    }
    setFollowedPlacesLoading(true)
    const load = async () => {
      try {
        const [followsRes, ownedRes] = await Promise.all([
          supabase
            .from('follows')
            .select('places(id, name_ar, logo_url)')
            .eq('follower_id', user.id),
          supabase.from('places').select('id, name_ar, logo_url').eq('user_id', user.id),
        ])
        if (followsRes.error) {
          setFollowedPlaces([])
        } else {
          type Row = { places: FollowedPlace | FollowedPlace[] | null }
          const list = (followsRes.data || []).flatMap((r: Row) => {
            const p = (r as Row).places
            if (!p) return []
            return Array.isArray(p) ? p : [p]
          }) as FollowedPlace[]
          setFollowedPlaces(list)
        }
        setOwnedPlaces((ownedRes.data ?? []) as FollowedPlace[])
      } finally {
        setFollowedPlacesLoading(false)
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

  useEffect(() => {
    const handler = () => refreshStories()
    window.addEventListener('add-story-success', handler)
    return () => window.removeEventListener('add-story-success', handler)
  }, [refreshStories])

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Stories: متابعات المستخدم — من عنده حالات تفتح المشاهد، الباقي رابط للمكان */}
      <section
        aria-label="الأماكن المتابعة والحالات"
        className="border-b px-4 py-4 surface-chameleon"
        style={{ borderColor: colors.outline }}
      >
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4" role="list">
          {followedPlacesLoading || storiesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <BanSkeleton key={`story-skeleton-${i}`} variant="avatar" className="shrink-0" />
            ))
          ) : placesToShowInStrip.length === 0 && !myFirstPlaceId ? (
            <BodySmall color="onSurfaceVariant" className="py-2">
              {user?.id ? 'لم تتابع أي مكان بعد' : 'سجّل الدخول لمتابعة الأماكن'}
            </BodySmall>
          ) : (
            <>
              {myFirstPlaceId && (
                <Button
                  type="button"
                  variant="text"
                  size="sm"
                  onClick={() => openAddStorySheet(myFirstPlaceId, myFirstPlaceName)}
                  className="flex flex-col items-center gap-1.5 shrink-0 min-w-[64px] !min-h-0 !p-0 !rounded-full"
                  aria-label="إضافة حالة"
                >
                  <div
                    className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: colors.primary,
                      backgroundColor: colors.surfaceContainer,
                    }}
                  >
                    <Plus size={28} style={{ color: colors.primary }} aria-hidden />
                  </div>
                  <LabelSmall color="onSurface" className="truncate max-w-[64px] text-center">
                    إضافة حالة
                  </LabelSmall>
                </Button>
              )}
              {placesToShowInStrip.map((place) => {
              const hasStories = placesWithStoriesMap.has(place.id)
              const placeWithStories = placesWithStoriesMap.get(place.id)
              const content = (
                <>
                  <div
                    className="w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0"
                    style={{
                      borderColor: hasStories ? colors.primary : colors.outline,
                      backgroundColor: colors.surface,
                    }}
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
                </>
              )
              if (hasStories && placeWithStories) {
                return (
                  <Button
                    key={place.id}
                    type="button"
                    variant="text"
                    size="sm"
                    onClick={() => setStoryViewerPlace(placeWithStories)}
                    className="flex flex-col items-center gap-1.5 shrink-0 min-w-[64px] !min-h-0 !p-0 !rounded-full"
                    aria-label={`عرض حالات ${place.name_ar || EMPTY_PLACE_LABEL}`}
                  >
                    {content}
                  </Button>
                )
              }
              return (
                <a
                  key={place.id}
                  href={`/places/${place.id}`}
                  className="flex flex-col items-center gap-1.5 shrink-0 min-w-[64px] min-h-[48px] touch-manipulation"
                  aria-label={place.name_ar || EMPTY_PLACE_LABEL}
                >
                  {content}
                </a>
              )
            })}
            </>
          )}
        </div>
      </section>

      {storyViewerPlace && (
        <StoryViewer
          placeName={storyViewerPlace.placeName}
          placeLogo={storyViewerPlace.placeLogo}
          stories={storyViewerPlace.stories}
          onClose={() => {
            setStoryViewerPlace(null)
            refreshStories()
          }}
        />
      )}

      {/* Tabs: Chameleon glass — شريط لاصق يتكيّف مع المحتوى عند التمرير */}
      <div
        role="tablist"
        aria-label="نوع المحتوى"
        className="sticky top-[var(--header-height,56px)] z-30 border-b surface-chameleon-glass"
        style={{ borderColor: colors.outline }}
      >
        <div className="flex px-4">
          {TABS.map((tab) => (
            <div key={tab.key} className="flex-1 flex flex-col items-center">
              <Button
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls="feed-panel"
                id={`tab-${tab.key}`}
                variant="text"
                size="md"
                onClick={() => setActiveTab(tab.key)}
                className="w-full !min-h-[48px] rounded-extra-large !shadow-none"
                style={{
                  color: activeTab === tab.key ? colors.primary : colors.onSurface,
                  backgroundColor:
                    activeTab === tab.key
                      ? `rgba(${colors.primaryRgb}, ${isDark ? 0.1 : 0.22})`
                      : 'transparent',
                }}
              >
                <TitleSmall as="span" color={activeTab === tab.key ? 'primary' : 'onSurface'}>
                  {tab.label}
                </TitleSmall>
              </Button>
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
          activeTab === 'posts' ? (
            <div className="flex flex-col gap-4 w-full" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <PostSkeleton key={`post-skeleton-${i}`} showImage showTextLines />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-busy="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <BanSkeleton key={`card-skeleton-${i}`} variant="card" lines={3} />
              ))}
            </div>
          )
        ) : !loading && items.length === 0 && !error ? (
          <BodyMedium color="onSurfaceVariant" className="text-center py-12">
            لا يوجد {activeTab === 'places' ? 'أماكن' : activeTab === 'posts' ? 'منشورات' : 'منتجات'} لعرضها.
          </BodyMedium>
        ) : error && items.length === 0 ? null : activeTab === 'posts' ? (
          <div className="flex flex-col gap-4 w-full">
            {items.map((item) => (
              <BanCard
                key={item.id}
                layout="posts"
                item={item as PostFeedItem}
                commentCountByEntityId={commentCountByEntityId}
                likeCountByEntityId={likeCountByEntityId}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((item) =>
              activeTab === 'places' ? (
                <BanCard key={item.id} layout="places" item={item as PlaceFeedItem} />
              ) : (
                <BanCard key={item.id} layout="products" item={item as ProductFeedItem} />
              )
            )}
          </div>
        )}

        {loading && items.length > 0 && (
          activeTab === 'posts' ? (
            <div className="flex flex-col gap-4 mt-4 w-full" aria-busy="true">
              <PostSkeleton showImage showTextLines />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4" aria-busy="true">
              <BanSkeleton variant="card" lines={3} />
              <BanSkeleton variant="card" lines={3} className="hidden md:block" />
              <BanSkeleton variant="card" lines={3} className="hidden md:block" />
            </div>
          )
        )}

        <div ref={sentinelRef} className="h-4 w-full" aria-hidden />
      </main>
    </div>
  )
}
