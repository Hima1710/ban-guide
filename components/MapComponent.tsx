'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { getLocationInfo } from '@/lib/geocoding'
import { MapPin } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { BodySmall } from '@/components/m3'

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false })

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-shadow.png',
  })
}

interface MapComponentProps {
  latitude: number
  longitude: number
  placeName: string
}

export default function MapComponent({ latitude, longitude, placeName }: MapComponentProps) {
  const { colors } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [locationInfo, setLocationInfo] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    
    // Get location info
    getLocationInfo(latitude, longitude).then((info) => {
      if (info) {
        setLocationInfo(info)
      }
    })
  }, [latitude, longitude])

  if (!mounted) {
    return (
      <div
        className="w-full h-full flex items-center justify-center rounded-lg"
        style={{ backgroundColor: colors.surface }}
      >
        <BodySmall color="onSurfaceVariant">جاري تحميل الخريطة...</BodySmall>
      </div>
    )
  }

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup className="min-w-[250px]">
            <div className="text-right">
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="mt-1 flex-shrink-0" size={18} style={{ color: colors.primary }} />
                <div className="flex-1">
                  <BodySmall style={{ color: colors.onSurface, fontWeight: 600 }} className="text-lg mb-1">{placeName}</BodySmall>
                  {locationInfo ? (
                    <div className="space-y-1">
                      <BodySmall style={{ color: colors.onSurface }} className="text-sm">{locationInfo.fullAddress}</BodySmall>
                      {locationInfo.district && (
                        <BodySmall color="onSurfaceVariant" className="text-xs">المنطقة: {locationInfo.district}</BodySmall>
                      )}
                      {locationInfo.city && (
                        <BodySmall color="onSurfaceVariant" className="text-xs">المدينة: {locationInfo.city}</BodySmall>
                      )}
                    </div>
                  ) : (
                    <BodySmall color="onSurfaceVariant" className="text-sm">جاري جلب معلومات الموقع...</BodySmall>
                  )}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t" style={{ borderColor: colors.outline }}>
                <BodySmall color="onSurfaceVariant" className="text-xs">
                  الإحداثيات: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </BodySmall>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
