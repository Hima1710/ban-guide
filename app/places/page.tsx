'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { usePlaces } from '@/hooks/usePlaces'
import { BanCard, BanSkeleton } from '@/components/common'
import { Search, MapPin, Filter } from 'lucide-react'
import { HeadlineLarge, HeadlineMedium, BodyMedium, BodySmall, LabelMedium } from '@/components/m3'
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

export default function PlacesPage() {
  const { colors } = useTheme()
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

  return (
    <div 
      className="min-h-screen py-6 px-4"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MapPin size={32} style={{ color: colors.primary }} />
            <HeadlineLarge style={{ color: colors.onSurface }}>الأماكن</HeadlineLarge>
          </div>
          <BodyMedium color="onSurfaceVariant">
            اكتشف الأماكن والخدمات القريبة منك
          </BodyMedium>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div 
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border-2"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            }}
          >
            <Search size={20} style={{ color: colors.onSurface }} />
            <input
              type="text"
              placeholder="ابحث عن مكان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-base"
              style={{ color: colors.onSurface }}
            />
          </div>

          {/* Category Filter (M3 chips) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Filter size={20} style={{ color: colors.onSurface }} />
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="shrink-0 rounded-extra-large"
              >
                <span>{category === 'all' ? 'الكل' : category}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* قائمة الأماكن — نفس شكل الكروت الموحد */}
        {loading ? (
          <div className="flex flex-col gap-4" aria-busy="true">
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
            {/* Results Count */}
            <div className="mb-4">
              <BodySmall color="onSurfaceVariant">
                {filteredPlaces.length} {filteredPlaces.length === 1 ? 'مكان' : 'أماكن'}
              </BodySmall>
            </div>

            {/* قائمة رأسية — نفس كارت الأماكن الموحد (BanCard) كما في الصفحة الرئيسية */}
            <div className="flex flex-col gap-4">
              {filteredPlaces.map((place) => (
                <BanCard
                  key={place.id}
                  layout="places"
                  item={toPlaceFeedItem(place)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
