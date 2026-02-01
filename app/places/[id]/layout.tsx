import type { Metadata } from 'next'
import { getPlaceById } from '@/lib/api/places'

function getBaseUrl(): string {
  if (typeof process.env.NEXT_PUBLIC_SITE_URL === 'string' && process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  }
  if (typeof process.env.VERCEL_URL === 'string' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return ''
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const place = await getPlaceById(id).catch(() => null)
  const base = getBaseUrl()

  if (!place) {
    return {
      title: 'مكان | بان',
    }
  }

  const title = `${place.name_ar} | بان`
  const description =
    place.description_ar?.slice(0, 160)?.trim() ||
    `شاهد ${place.name_ar} على بان — دليلك للأماكن والخدمات`
  const path = `/places/${id}`
  const url = base ? `${base}${path}` : undefined

  /** صورة المعاينة: لو المكان فيه لوجو استخدمه (يجب أن يكون رابط مطلق لو واتساب يجلبه) */
  let imageUrl: string | undefined
  if (place.logo_url) {
    imageUrl = place.logo_url.startsWith('http') ? place.logo_url : base ? `${base}${place.logo_url}` : undefined
  }
  if (!imageUrl && base) {
    imageUrl = `${base}/logo.webp`
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'بان',
      images: imageUrl ? [{ url: imageUrl, width: 512, height: 512, alt: place.name_ar }] : undefined,
      locale: 'ar_AR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export default function PlaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
