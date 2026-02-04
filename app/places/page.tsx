'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useScrollContainer } from '@/contexts/ScrollContainerContext'
import { useHeaderContext } from '@/contexts/HeaderContext'
import { usePlaces } from '@/hooks/usePlaces'
import { BanCard, BanSkeleton, VirtualList } from '@/components/common'
import { Search, MapPin, Filter } from 'lucide-react'
import { HeadlineMedium, TitleLarge, BodyMedium, BodySmall } from '@/components/m3'
import { Button } from '@/components/m3'
import type { PlaceFeedItem } from '@/hooks/useUnifiedFeed'

/** تحويل Place من usePlaces إلى PlaceFeedItem للنظام الموحد (BanCard) */
function toPlaceFeedItem(place: ReturnType<typeof usePlaces>['places'][0]): PlaceFeedItem {
  return {
    ...place,
    tier: 'basic',
    isLiked: false,
    isFavorited: false,
  }
}

/** ارتفاع الشريط الفرعي لصفحة الأماكن — يطابق --places-subheader-height في globals.css */
const PLACES_SUBHEADER_HEIGHT_PX = 180

/** محتوى الشريط الفرعي لصفحة الأماكن: بحث + عنوان + فلاتر التصنيفات (يُعرض في الهيدر الموحد) */
function PlacesSubHeader({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  colors,
}: {
  searchQuery: string
  setSearchQuery: (v: string) => void
  selectedCategory: string
  setSelectedCategory: (v: string) => void
  categories: string[]
  colors: ReturnType<typeof useTheme>['colors']
}) {
  return (
    <>
      <section
        aria-label="البحث والأماكن"
        className="border-b border-opacity-50"
        style={{ borderColor: colors.outline }}
      >
        <div className="px-4 pt-3 pb-1.5">
          <div className="flex items-center gap-2 mb-0.5">
            <MapPin size={24} style={{ color: colors.primary }} />
            <TitleLarge style={{ color: colors.onSurface }}>الأماكن</TitleLarge>
          </div>
          <BodySmall color="onSurfaceVariant" className="mb-2 block">
            اكتشف الأماكن والخدمات القريبة منك
          </BodySmall>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border-2"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            }}
          >
            <Search size={18} style={{ color: colors.onSurface }} />
            <input
              type="text"
              placeholder="ابحث عن مكان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm min-w-0"
              style={{ color: colors.onSurface }}
              aria-label="البحث"
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-2 pt-0.5 px-4" role="list">
          <Filter size={18} style={{ color: colors.onSurface }} className="shrink-0" />
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'filled' : 'outlined'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="shrink-0 rounded-extra-large !min-h-[36px] !py-1.5 !px-3 text-xs"
            >
              <span>{category === 'all' ? 'الكل' : category}</span>
            </Button>
          ))}
        </div>
      </section>
    </>
  )
}

export default function PlacesPage() {
  const { colors } = useTheme()
  const scrollRef = useScrollContainer()
  const headerCtx = useHeaderContext()
  const { places, loading, error, refresh } = usePlaces({ autoLoad: true })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Filter places based on search and category
  const filteredPlaces = places.filter(place => {
    const matchesSearch = (place.name_ar || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (place.name_en || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (place.description_ar || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (place.description_en || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(places.map(p => p.category).filter(Boolean)))]

  /* ربط الشريط الفرعي (بحث + عنوان + فلاتر) بالهيدر الموحد؛ تنظيف عند مغادرة الصفحة. التبعيات مستقرة فقط (لا categories ولا colors) لتجنب Maximum update depth. */
  useEffect(() => {
    const setSubHeader = headerCtx?.setSubHeader
    if (!setSubHeader) return
    setSubHeader(
      <PlacesSubHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        colors={colors}
      />
    )
    return () => setSubHeader(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- قيم مستقرة فقط؛ categories و colors مراجع تتغير كل render
  }, [headerCtx?.setSubHeader, searchQuery, selectedCategory, places.length])

  return (
    <div
      className="min-h-screen px-4"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto max-w-7xl">
        {/* قائمة الأماكن — التمرير من main في AppShell؛ padding-top داخل VirtualList */}
        <div className="pb-6">
        {loading ? (
          <div className="flex flex-col gap-element" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <BanSkeleton key={`place-skeleton-${i}`} variant="card" lines={2} showImage={false} />
            ))}
          </div>
        ) : error ? (
          <div
            className="text-center py-20 rounded-3xl border"
            style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
          >
            <HeadlineMedium className="mb-2" style={{ color: colors.error }}>
              فشل التحميل
            </HeadlineMedium>
            <BodyMedium color="onSurfaceVariant" className="mb-6">
              {error}
            </BodyMedium>
            <Button variant="outlined" size="md" onClick={() => refresh()}>
              إعادة المحاولة
            </Button>
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div
            className="text-center py-20 rounded-3xl"
            style={{ backgroundColor: colors.surface }}
          >
            <MapPin
              size={64}
              className="mx-auto mb-4"
              style={{ color: colors.onSurface, opacity: 0.3 }}
            />
            <HeadlineMedium className="mb-2">
              {searchQuery || selectedCategory !== 'all'
                ? 'لا توجد نتائج'
                : 'لا توجد أماكن بعد'}
            </HeadlineMedium>
            <BodyMedium color="onSurfaceVariant">
              {searchQuery || selectedCategory !== 'all'
                ? 'جرب البحث بكلمات مختلفة أو غيّر الفئة'
                : 'سيتم إضافة الأماكن قريباً'}
            </BodyMedium>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <BodySmall color="onSurfaceVariant">
                {filteredPlaces.length} {filteredPlaces.length === 1 ? 'مكان' : 'أماكن'}
              </BodySmall>
            </div>

            {scrollRef ? (
              <VirtualList<ReturnType<typeof usePlaces>['places'][0]>
                items={filteredPlaces}
                scrollElementRef={scrollRef}
                estimateSize={200}
                contentPaddingTop={PLACES_SUBHEADER_HEIGHT_PX}
                getItemKey={(place) => place.id}
                renderItem={(place) => (
                  <div style={{ paddingBottom: 'var(--element-gap)' }}>
                    <BanCard layout="places" item={toPlaceFeedItem(place)} />
                  </div>
                )}
              />
            ) : (
              <div className="flex flex-col gap-element">
                {filteredPlaces.map((place) => (
                  <BanCard
                    key={place.id}
                    layout="places"
                    item={toPlaceFeedItem(place)}
                  />
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  )
}
