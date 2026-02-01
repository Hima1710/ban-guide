'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { showError, showSuccess, showLoading, closeLoading } from '@/components/SweetAlert'
import { Image as ImageIcon, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import YouTubeUpload from '@/components/YouTubeUpload'
import { useTheme } from '@/contexts/ThemeContext'
import { useUploadImage } from '@/hooks/useUploadImage'
import { LoadingSpinner, PageSkeleton } from '@/components/common'
import { Button } from '@/components/m3'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false })

export default function NewPlacePage() {
  const router = useRouter()
  const { colors } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    category: 'shop',
    latitude: 30.0444, // Default: Cairo
    longitude: 31.2357, // Default: Cairo
    address: '',
    phone_1: '',
    phone_2: '',
    video_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('url')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const { uploadImage, isUploading: uploadingLogo } = useUploadImage()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    setUser(user)

    // Check subscription
    const { data: subRow } = await supabase
      .from('user_subscriptions')
      .select('*, package:packages(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()
    const subData = subRow as { package?: { max_places: number }; [key: string]: unknown } | null
    // عند عدم وجود اشتراك نسمح بإضافة أماكن بحد افتراضي
    const effectiveSub = subData ?? { package: { max_places: 999 } }

    // Check if user can add more places
    const { data: placesRow } = await supabase
      .from('places')
      .select('id')
      .eq('user_id', user.id)
    const placesData = (placesRow ?? []) as { id: string }[]

    const maxPlaces = (effectiveSub.package as { max_places: number })?.max_places ?? 999
    if ((placesData?.length || 0) >= maxPlaces) {
      showError(`لقد وصلت للحد الأقصى من الأماكن المسموحة في باقاتك (${maxPlaces})`)
      router.push('/dashboard')
      return
    }

    setSubscription(effectiveSub)
    setLoading(false)
  }

  const handleLogoUpload = async (file: File) => {
    try {
      const url = await uploadImage(file)
      if (url) {
        setLogoUrl(url)
        showSuccess('تم رفع الشعار بنجاح')
      } else {
        showError('حدث خطأ في رفع الشعار')
      }
    } catch (error: any) {
      showError(error?.message || 'حدث خطأ في رفع الشعار')
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      handleLogoUpload(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setLogoUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    showLoading('جاري إضافة المكان...')

    try {
      const placeRow = {
        user_id: user.id,
        subscription_id: subscription.id,
        ...formData,
        logo_url: logoUrl,
        is_featured: (subscription.package as any).is_featured || false,
      }
      const { data: placeData, error } = await supabase
        .from('places')
        .insert(placeRow as never)
        .select()
        .single()
      const data = placeData as { id: string } | null

      if (error || !data) throw error || new Error('فشل إنشاء المكان')

      closeLoading()
      showSuccess('تم إضافة المكان بنجاح')
      router.push(`/dashboard/places/${data.id}`)
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في إضافة المكان')
    }
  }

  if (loading) {
    return <PageSkeleton variant="form" />
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: colors.background }}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <Button
            variant="outlined"
            size="sm"
            onClick={() => router.back()}
            className="shrink-0"
          >
            ← العودة للوحة التحكم
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.onSurface }}>إضافة مكان جديد</h1>
        </div>

        <form onSubmit={handleSubmit} className="shadow-lg p-6 space-y-6 rounded-3xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.onSurface }}>الاسم بالعربية *</label>
              <input
                type="text"
                required
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg focus:outline-none"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}`, color: colors.onSurface }}
                onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: colors.onSurface }}>الاسم بالإنجليزية *</label>
              <input
                type="text"
                required
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg focus:outline-none"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}`, color: colors.onSurface }}
                onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.onSurface }}>الوصف بالعربية</label>
            <textarea
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg focus:outline-none"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}`, color: colors.onSurface }}
              onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.onSurface }}>النوع *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg focus:outline-none"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}`, color: colors.onSurface }}
              onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
            >
              <option value="shop">محل</option>
              <option value="pharmacy">صيدلية</option>
              <option value="restaurant">مطعم</option>
              <option value="service">خدمة</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.onSurface }}>شعار المكان</label>
            {logoPreview ? (
              <div className="relative inline-block">
                <img
                  src={logoPreview}
                  alt="شعار المكان"
                  className="w-32 h-32 object-cover rounded-lg border-2"
                  style={{ borderColor: colors.outline }}
                />
                <Button
                  type="button"
                  onClick={removeLogo}
                  variant="danger"
                  size="sm"
                  className="absolute -top-2 -right-2 !min-h-0 !p-1.5"
                >
                  <X size={16} />
                </Button>
                {uploadingLogo && (
                  <div className="absolute inset-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.overlay }}>
                    <LoadingSpinner size="sm" iconOnly />
                  </div>
                )}
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors"
                style={{ borderColor: colors.outline, backgroundColor: colors.surfaceContainer }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceVariant || colors.surfaceContainer }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-10 h-10 mb-2" style={{ color: colors.onSurfaceVariant }} />
                  <p className="mb-2 text-sm font-semibold" style={{ color: colors.onSurfaceVariant }}>اضغط لرفع شعار المكان</p>
                  <p className="text-xs" style={{ color: colors.onSurfaceVariant }}>PNG, JPG, WEBP (حد أقصى 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>
              الشعار سيتم تحويله تلقائياً إلى WebP لتحسين الأداء
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurface }}>رقم الهاتف الأول *</label>
              <input
                type="tel"
                required
                value={formData.phone_1}
                onChange={(e) => setFormData({ ...formData, phone_1: e.target.value })}
                className="w-full px-4 py-2 rounded-lg focus:outline-none"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}`, color: colors.onSurface }}
                onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurface }}>رقم الهاتف الثاني</label>
              <input
                type="tel"
                value={formData.phone_2}
                onChange={(e) => setFormData({ ...formData, phone_2: e.target.value })}
                className="w-full px-4 py-2 rounded-lg focus:outline-none"
                style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}`, color: colors.onSurface }}
                onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
                onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.onSurface }}>فيديو YouTube</label>
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className="px-4 py-2 rounded-extra-large border transition-colors text-sm font-semibold"
                style={
                  uploadMethod === 'url'
                    ? { background: 'transparent', color: colors.primary, borderColor: colors.primary, borderWidth: 2 }
                    : { background: colors.surfaceContainer, color: colors.onSurfaceVariant, borderColor: colors.outline, borderWidth: 1 }
                }
              >
                إدخال رابط
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('upload')}
                className="px-4 py-2 rounded-extra-large border transition-colors text-sm font-semibold"
                style={
                  uploadMethod === 'upload'
                    ? { background: 'transparent', color: colors.primary, borderColor: colors.primary, borderWidth: 2 }
                    : { background: colors.surfaceContainer, color: colors.onSurfaceVariant, borderColor: colors.outline, borderWidth: 1 }
                }
              >
                رفع فيديو
              </button>
            </div>

            {uploadMethod === 'url' ? (
              <div>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-2 rounded-lg focus:outline-none"
                  style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}`, color: colors.onSurface }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
                />
                <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>
                  الحد الأقصى: {(subscription.package as any).max_place_videos} فيديو
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-4" style={{ backgroundColor: colors.surface, borderColor: colors.outline }}>
                <YouTubeUpload
                  onVideoUploaded={(videoUrl) => {
                    setFormData({ ...formData, video_url: videoUrl })
                    setUploadMethod('url') // Switch back to URL view after upload
                  }}
                  maxVideos={(subscription.package as any).max_place_videos || 1}
                  currentVideos={formData.video_url ? 1 : 0}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.onSurface }}>اختر الموقع على الخريطة *</label>
            <div className="h-96 rounded-lg overflow-hidden border mb-4" style={{ borderColor: colors.outline }}>
              <MapPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={(lat, lng, address) => {
                  setFormData({ 
                    ...formData, 
                    latitude: lat, 
                    longitude: lng,
                    address: address || formData.address // Update address if provided
                  })
                }}
              />
            </div>
            <p className="text-xs mb-2" style={{ color: colors.onSurfaceVariant }}>
              اضغط على زر تحديد الموقع في الخريطة لسحب موقعك تلقائياً. يمكنك أيضاً سحب العلامة أو النقر على الخريطة لتغيير الموقع.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.onSurface }}>العنوان</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="سيتم ملؤه تلقائياً من الخريطة"
              className="w-full px-4 py-2.5 rounded-lg focus:outline-none"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}`, color: colors.onSurface }}
              onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
              onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
            />
            <p className="text-xs mt-1" style={{ color: colors.onSurfaceVariant }}>
              العنوان سيتم تحديثه تلقائياً عند اختيار موقع على الخريطة
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" variant="filled" className="flex-1">
              إضافة المكان
            </Button>
            <Button type="button" variant="outlined" onClick={() => router.back()}>
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
