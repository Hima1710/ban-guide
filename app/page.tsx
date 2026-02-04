'use client'

import { useEffect, useState, useRef } from 'react'
import { useUnifiedFeed } from '@/hooks/useUnifiedFeed'
import { useEntityCounts } from '@/hooks/useEntityCounts'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useHeaderContext } from '@/contexts/HeaderContext'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useStoriesForFollowedPlaces, type PlaceWithStories } from '@/hooks/useStories'
import { BanCard, BanSkeleton, PostSkeleton, VideoShortsFeed, VirtualList } from '@/components/common'
import { useScrollContainer } from '@/contexts/ScrollContainerContext'
import { BodySmall, BodyMedium, TitleSmall, LabelSmall, Button } from '@/components/m3'
import { Plus } from 'lucide-react'
import StoryViewer from '@/components/StoryViewer'
import { useAddStorySheet } from '@/contexts/AddStoryContext'
import type { PostFeedItem, ProductFeedItem } from '@/hooks/useUnifiedFeed'

export type HomeTab = 'videos' | 'posts' | 'products'

const TABS: { key: HomeTab; label: string }[] = [
  { key: 'videos', label: 'الفيديوهات' },
  { key: 'posts', label: 'المنشورات' },
  { key: 'products', label: 'المنتجات' },
]
const EMPTY_PLACE_LABEL = 'مكان'

interface FollowedPlace {
  id: string
  name_ar: string | null
  logo_url: string | null
}

/** صفوف المنتجات — كل صف 4 عناصر لاستخدام VirtualList (شبكة: 2 صغير، 3/4 كبير) */
function productRows<T>(items: T[], cols: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols))
  return rows
}

/** محتوى الشريط الفرعي للصفحة الرئيسية: الستوريز + التابات (يُعرض في الهيدر الموحد) */
function HomeSubHeader({
  activeTab,
  setActiveTab,
  followedPlacesLoading,
  storiesLoading,
  placesToShowInStrip,
  myFirstPlaceId,
  myFirstPlaceName,
  placesWithStoriesMap,
  user,
  colors,
  isDark,
  openAddStorySheet,
  setStoryViewerPlace,
}: {
  activeTab: HomeTab
  setActiveTab: (tab: HomeTab) => void
  followedPlacesLoading: boolean
  storiesLoading: boolean
  placesToShowInStrip: FollowedPlace[]
  myFirstPlaceId: string | null
  myFirstPlaceName: string | null
  placesWithStoriesMap: Map<string, PlaceWithStories>
  user: { id: string } | null
  colors: ReturnType<typeof useTheme>['colors']
  isDark: boolean
  openAddStorySheet: (placeId: string, placeName?: string | null) => void
  setStoryViewerPlace: (place: PlaceWithStories | null) => void
}) {
  return (
    <>
      <section
        aria-label="الأماكن المتابعة والحالات"
        className="border-b border-opacity-50"
        style={{ borderColor: colors.outline }}
      >
        <div className="px-4 pt-3 pb-1">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4" role="list">
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
        </div>
      </section>
      <div
        role="tablist"
        aria-label="نوع المحتوى"
        className="flex px-2 pt-0.5 pb-1"
      >
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
              className="w-full !min-h-[44px] rounded-extra-large !shadow-none"
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
    </>
  )
}

/** ارتفاع الشريط الفرعي (ستوريز + تابات) — يطابق --home-subheader-height في globals.css */
const HOME_SUBHEADER_HEIGHT_PX = 154

function FeedPanel({
  entityType,
  contentPaddingTop = 0,
}: {
  entityType: 'posts' | 'products'
  /** مسافة علوية لمحتوى القائمة (ارتفاع Sub-Header) لظهور زجاجي M3 */
  contentPaddingTop?: number
}) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useScrollContainer()
  const { items, fetchNextPage, hasNextPage, loading, error } = useUnifiedFeed({ entityType })
  const postIdsForCounts = entityType === 'posts' ? items.map((i) => i.id) : []
  const { commentCountByEntityId, likeCountByEntityId } = useEntityCounts({
    entityIds: postIdsForCounts,
    entityType: 'post',
  })

  const productGridRows = entityType === 'products' ? productRows(items, 4) : []

  useEffect(() => {
    if (!hasNextPage || loading) return
    const el = sentinelRef.current
    const root = scrollRef?.current ?? null
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage()
      },
      { root, rootMargin: '200px', threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasNextPage, loading, fetchNextPage, scrollRef])

  if (error != null) {
    return (
      <BodyMedium color="error" className="text-center py-6" role="alert">
        حدث خطأ في التحميل. حاول مرة أخرى.
      </BodyMedium>
    )
  }

  if (loading && items.length === 0) {
    return entityType === 'posts' ? (
      <div className="flex flex-col gap-element w-full" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <PostSkeleton key={`post-skeleton-${i}`} showImage showTextLines />
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-element" aria-busy="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <BanSkeleton key={`card-skeleton-${i}`} variant="card" lines={3} />
        ))}
      </div>
    )
  }

  if (!loading && items.length === 0) {
    return (
      <BodyMedium color="onSurfaceVariant" className="text-center py-12">
        لا يوجد {entityType === 'posts' ? 'منشورات' : 'منتجات'} لعرضها.
      </BodyMedium>
    )
  }

  const useVirtual = Boolean(scrollRef)

  return (
    <>
      {useVirtual && scrollRef ? (
        entityType === 'posts' ? (
          <VirtualList<typeof items[0]>
            items={items}
            scrollElementRef={scrollRef}
            estimateSize={380}
            overscan={6}
            contentPaddingTop={contentPaddingTop}
            getItemKey={(item) => item.id}
            renderItem={(item) => (
              <div style={{ paddingBottom: 'var(--element-gap)' }}>
                <BanCard
                  layout="posts"
                  item={item as PostFeedItem}
                  commentCountByEntityId={commentCountByEntityId}
                  likeCountByEntityId={likeCountByEntityId}
                />
              </div>
            )}
          />
        ) : (
          <VirtualList<(typeof items)[0][]>
            items={productGridRows}
            scrollElementRef={scrollRef}
            estimateSize={280}
            overscan={4}
            contentPaddingTop={contentPaddingTop}
            getItemKey={(_row, rowIndex) => rowIndex}
            renderItem={(row) => (
              <div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-element"
                style={{ paddingBottom: 'var(--element-gap)' }}
              >
                {row.map((item) => (
                  <BanCard key={item.id} layout="products" item={item as ProductFeedItem} />
                ))}
              </div>
            )}
          />
        )
      ) : (
        entityType === 'posts' ? (
          <div className="flex flex-col gap-element w-full">
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-element">
            {items.map((item) => (
              <BanCard key={item.id} layout="products" item={item as ProductFeedItem} />
            ))}
          </div>
        )
      )}
      {loading && items.length > 0 && (
        entityType === 'posts' ? (
          <div className="flex flex-col gap-element mt-4 w-full" aria-busy="true">
            <PostSkeleton showImage showTextLines />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-element mt-4" aria-busy="true">
            <BanSkeleton variant="card" lines={3} />
            <BanSkeleton variant="card" lines={3} />
            <BanSkeleton variant="card" lines={3} className="hidden md:block" />
            <BanSkeleton variant="card" lines={3} className="hidden lg:block" />
          </div>
        )
      )}
      <div ref={sentinelRef} className="h-4 w-full" aria-hidden />
    </>
  )
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<HomeTab>('videos')
  const [followedPlaces, setFollowedPlaces] = useState<FollowedPlace[]>([])
  const [ownedPlaces, setOwnedPlaces] = useState<FollowedPlace[]>([])
  const [followedPlacesLoading, setFollowedPlacesLoading] = useState(true)
  const [storyViewerPlace, setStoryViewerPlace] = useState<PlaceWithStories | null>(null)

  const placeIds = [...new Set([...ownedPlaces.map((p) => p.id), ...followedPlaces.map((p) => p.id)])]
  const { placesWithStories, loading: storiesLoading, refresh: refreshStories } = useStoriesForFollowedPlaces(placeIds)
  const placesWithStoriesMap = new Map(placesWithStories.map((p) => [p.placeId, p]))
  const myFirstPlaceId = ownedPlaces[0]?.id ?? null
  const myFirstPlaceName = ownedPlaces[0]?.name_ar ?? null
  const placesToShowInStrip = [...ownedPlaces, ...followedPlaces.filter((f) => !ownedPlaces.some((o) => o.id === f.id))]

  const { user } = useAuthContext()
  const { colors, isDark } = useTheme()
  const { openAddStorySheet } = useAddStorySheet()
  const headerCtx = useHeaderContext()

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
    const handler = () => refreshStories()
    window.addEventListener('add-story-success', handler)
    return () => window.removeEventListener('add-story-success', handler)
  }, [refreshStories])

  /* ربط الشريط الفرعي (الستوريز + التابات) بالهيدر الموحد؛ cleanup عند مغادرة الصفحة. التبعيات مستقرة فقط لتجنب Maximum update depth. */
  useEffect(() => {
    const setSubHeader = headerCtx?.setSubHeader
    if (!setSubHeader) return
    setSubHeader(
      <HomeSubHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        followedPlacesLoading={followedPlacesLoading}
        storiesLoading={storiesLoading}
        placesToShowInStrip={placesToShowInStrip}
        myFirstPlaceId={myFirstPlaceId}
        myFirstPlaceName={myFirstPlaceName}
        placesWithStoriesMap={placesWithStoriesMap}
        user={user}
        colors={colors}
        isDark={isDark}
        openAddStorySheet={openAddStorySheet}
        setStoryViewerPlace={setStoryViewerPlace}
      />
    )
    return () => {
      setSubHeader(null)
    }
    // فقط قيم مستقرة/بدائية — لا colors ولا placesWithStoriesMap (مراجع جديدة كل render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    followedPlacesLoading,
    storiesLoading,
    placesToShowInStrip.length,
    myFirstPlaceId,
    myFirstPlaceName,
    user?.id ?? null,
    isDark,
  ])

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
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

      {/* Feed — التمرير من مسؤولية main في AppShell فقط (لا overflow-y محلي). المنشورات/المنتجات: padding-top داخل VirtualList لظهور زجاجي. */}
      <main
        id="feed-panel"
        role="tabpanel"
        aria-label="التغذية"
        className={activeTab === 'videos' ? 'w-full' : 'container mx-auto px-4 pb-6 max-w-6xl'}
        style={
          activeTab === 'videos'
            ? { paddingTop: 'var(--element-gap)' }
            : undefined
        }
      >
        {activeTab === 'videos' ? (
          <VideoShortsFeed />
        ) : (
          <FeedPanel
            entityType={activeTab}
            contentPaddingTop={HOME_SUBHEADER_HEIGHT_PX}
          />
        )}
      </main>
    </div>
  )
}
