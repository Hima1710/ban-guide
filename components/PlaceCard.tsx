'use client'

import { PlaceCardProps } from '@/types'
import Link from 'next/link'
import { MapPin, Phone, Eye, Video } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { TitleMedium, BodySmall, LabelSmall } from '@/components/m3'

/** ارتفاع ثابت لمنطقة الصورة في الشريط المميز حتى تكون كل الصور بنفس الحجم */
const FEATURED_IMAGE_HEIGHT = 'h-44 sm:h-52'

const sizeStyles = {
  small: { imageClass: FEATURED_IMAGE_HEIGHT, paddingClass: 'p-2.5 sm:p-3' },
  medium: { imageClass: FEATURED_IMAGE_HEIGHT, paddingClass: 'p-3 sm:p-4' },
  large: { imageClass: FEATURED_IMAGE_HEIGHT, paddingClass: 'p-4 sm:p-5' },
}

export default function PlaceCard({ place, cardStyle = 'default', size = 'medium' }: PlaceCardProps) {
  const { colors } = useTheme()
  const { imageClass, paddingClass } = sizeStyles[size]
  const getCardStyle = (): React.CSSProperties => {
    switch (cardStyle) {
      case 'premium':
        return {
          border: `2px solid ${colors.warning}`,
          background: `linear-gradient(to bottom right, ${colors.warningContainer}, rgba(${colors.primaryRgb}, 0.08))`,
          boxShadow: 'var(--shadow-lg)',
        }
      case 'gold':
        return {
          border: `2px solid ${colors.warning}`,
          background: `linear-gradient(to bottom right, ${colors.warningContainer}, rgba(${colors.primaryRgb}, 0.08))`,
          boxShadow: 'var(--shadow-xl)',
        }
      case 'silver':
        return {
          border: `1px solid ${colors.outline}`,
          background: `linear-gradient(to bottom right, ${colors.surface}, ${colors.background})`,
          boxShadow: 'var(--shadow-md)',
        }
      default:
        return {
          border: `1px solid ${colors.outline}`,
          background: colors.background,
          boxShadow: 'var(--shadow-sm)',
        }
    }
  }

  return (
    <Link href={`/places/${place.id}`}>
      <div
        className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 cursor-pointer"
        style={getCardStyle()}
      >
        <div className={`relative w-full overflow-hidden ${imageClass}`} style={{ backgroundColor: colors.surface }}>
          {place.logo_url ? (
            <div className="w-full h-full relative block">
              <img
                src={place.logo_url}
                alt={place.name_ar}
                className="w-full h-full object-cover block"
                style={{ objectFit: 'cover' }}
              />
              {(cardStyle === 'premium' || cardStyle === 'gold') && (
                <div
                  className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, var(--overlay-bg), transparent)',
                  }}
                  aria-hidden
                />
              )}
              {place.video_url && (
                <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: colors.overlay }}
              >
                  <div 
                    className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold flex items-center gap-0.5 sm:gap-1"
                    style={{
                      backgroundColor: colors.error,
                      color: 'var(--color-on-error)',
                    }}
                  >
                    <Video size={10} className="sm:w-3 sm:h-3" />
                    <span className="hidden sm:inline">فيديو</span>
                  </div>
                </div>
              )}
            </div>
          ) : place.video_url ? (
            <iframe
              src={place.video_url.replace('watch?v=', 'embed/')}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: colors.onSurfaceVariant }}>
              <MapPin size={36} className="sm:w-12 sm:h-12" />
            </div>
          )}
          {place.is_featured && (
            <div
              className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold"
              style={{ background: colors.warningContainer, color: colors.warning }}
            >
              مميز
            </div>
          )}
        </div>
        <div className={paddingClass}>
          <TitleMedium className="mb-1.5 sm:mb-2 line-clamp-1">{place.name_ar}</TitleMedium>
          <BodySmall color="onSurfaceVariant" className="mb-2 sm:mb-3 line-clamp-2">{place.description_ar}</BodySmall>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
              <Phone size={14} className="sm:w-4 sm:h-4" />
              <LabelSmall color="onSurfaceVariant" className="truncate">{place.phone_1}</LabelSmall>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={14} className="sm:w-4 sm:h-4" />
              <LabelSmall color="onSurfaceVariant">{place.today_views} اليوم</LabelSmall>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
