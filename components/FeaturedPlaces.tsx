'use client'

import { Place } from '@/types'
import PlaceCard from './PlaceCard'
import { useTheme } from '@/contexts/ThemeContext'
import { Carousel, HeadlineMedium } from '@/components/m3'
import type { CarouselItemSize } from '@/components/m3'

interface FeaturedPlacesProps {
  places: Place[]
}

const CAROUSEL_SIZES: CarouselItemSize[] = ['large', 'medium', 'small']

export default function FeaturedPlaces({ places }: FeaturedPlacesProps) {
  const { colors } = useTheme()

  return (
    <Carousel<Place>
      title={
        <HeadlineMedium className="mb-4 sm:mb-6" style={{ color: colors.onSurface }}>
          الأماكن المميزة
        </HeadlineMedium>
      }
      ariaLabel="الأماكن المميزة"
      items={places}
      keyExtractor={(p) => p.id}
      renderItem={(place, index) => {
        const size = CAROUSEL_SIZES[index % CAROUSEL_SIZES.length]
        return <PlaceCard place={place} cardStyle="premium" size={size} />
      }}
      getItemSize={(index) => CAROUSEL_SIZES[index % CAROUSEL_SIZES.length]}
      autoScroll
      pauseOnHover
      snap
    />
  )
}
