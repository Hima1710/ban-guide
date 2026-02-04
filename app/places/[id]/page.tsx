'use client'

import { useEffect, useState, useRef, Suspense, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Place, Product } from '@/lib/types'
import { incrementPlaceView } from '@/lib/api/places'
import { useAuthContext, usePlace, useProducts } from '@/hooks'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/youtube'
import { MapPin, Phone, MessageCircle, Image as ImageIcon, X, Package, UserPlus, CheckCircle, Plus, Trash2, Video, Upload } from 'lucide-react'
import { showError, showSuccess, showLoading, closeLoading } from '@/components/SweetAlert'
import { LoadingSpinner, Input, PageSkeleton, VirtualList } from '@/components/common'
import { useScrollContainer } from '@/contexts/ScrollContainerContext'
import { useHeaderContext } from '@/contexts/HeaderContext'
import { notifyPlaceFollowers } from '@/lib/api/notifications'
import { NotificationType } from '@/lib/types/database'
import { useConversationContextOptional } from '@/contexts/ConversationContext'
import { TitleLarge, TitleMedium, BodyMedium, BodySmall, LabelMedium, LabelLarge, Button } from '@/components/m3'
import { isValidPlaceId } from '@/lib/validation'

/** ارتفاع شريط التابات المثبت في صفحة تفاصيل المكان — يطابق --place-detail-tabs-height في globals.css؛ يُستخدم في contentPaddingTop للـ VirtualList */
const PLACE_DETAIL_TABS_HEIGHT_PX = 56

/** محتوى الشريط الفرعي لتفاصيل المكان: اسم + صورة مصغرة (يختفي عند التمرير؛ التابات تبقى Pinned في المحتوى) */
function PlaceDetailSubHeader({
  placeName,
  logoUrl,
  colors,
}: {
  placeName: string | null
  logoUrl: string | null
  colors: ReturnType<typeof useTheme>['colors']
}) {
  return (
    <section
      aria-label="معلومات المكان"
      className="flex items-center gap-3 px-4 py-2 border-t border-opacity-50"
      style={{ borderColor: colors.outline }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="w-10 h-10 rounded-lg border-2 shrink-0 object-cover"
          style={{ borderColor: colors.outline }}
        />
      ) : (
        <div
          className="w-10 h-10 rounded-lg border-2 flex items-center justify-center shrink-0 text-lg font-bold"
          style={{
            borderColor: colors.outline,
            background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`,
            color: colors.onPrimary,
          }}
        >
          {placeName?.[0]?.toUpperCase() ?? '?'}
        </div>
      )}
      <TitleMedium as="h2" className="truncate flex-1 min-w-0" style={{ color: colors.onSurface }}>
        {placeName ?? 'المكان'}
      </TitleMedium>
    </section>
  )
}

// Component that uses useSearchParams - must be wrapped in Suspense
function ProductIdHandler({ children }: { children: (productId: string | null) => React.ReactNode }) {
  const searchParams = useSearchParams()
  const productId = searchParams.get('product')
  
  return <>{children(productId)}</>
}

function PlacePageContent({ productId }: { productId: string | null }) {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const placeId = params.id as string

  // Use custom hooks
  const { user } = useAuthContext()
  const { colors, isDark } = useTheme()
  const { place, loading: placeLoading } = usePlace(placeId)
  const { products } = useProducts({ placeId, autoLoad: !!placeId })
  const conversationContext = useConversationContextOptional()

  const [loading, setLoading] = useState(true)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)
  const [showEmployeeRequestModal, setShowEmployeeRequestModal] = useState(false)
  const [employeePhone, setEmployeePhone] = useState('')
  const [isEmployee, setIsEmployee] = useState(false)
  const [employeePermissions, setEmployeePermissions] = useState<'basic' | 'messages_posts' | 'full' | null>(null)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'products' | 'services'>('posts')
  const [posts, setPosts] = useState<any[]>([])
  const [showAddPostModal, setShowAddPostModal] = useState(false)
  const [postData, setPostData] = useState({
    content: '',
    post_type: 'text' as 'text' | 'image' | 'video',
    image_url: '',
    video_url: '',
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoTitle, setVideoTitle] = useState('')
  const [videoUploadMethod, setVideoUploadMethod] = useState<'link' | 'upload'>('link')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const lastCountedPlaceIdRef = useRef<string | null>(null)
  const scrollRef = useScrollContainer()
  const headerCtx = useHeaderContext()
  /** صفوف المنتجات — كل صف 4 عناصر لاستخدام VirtualList (شبكة: 2 صغير، 3/4 كبير) */
  const productGridRows = useMemo(() => {
    const rows: (typeof products)[] = []
    for (let i = 0; i < products.length; i += 4) rows.push(products.slice(i, i + 4))
    return rows
  }, [products])

  /* عدّ المشاهدة فور دخول الصفحة (مرة واحدة لكل placeId) دون انتظار تحميل place */
  useEffect(() => {
    if (!placeId || !isValidPlaceId(placeId)) return
    if (lastCountedPlaceIdRef.current === placeId) return
    lastCountedPlaceIdRef.current = placeId
    incrementPlaceView(placeId).catch(console.error)
  }, [placeId])

  useEffect(() => {
    if (place) {
      loadPosts()
    }
    if (!placeLoading) {
      setLoading(false)
    }
  }, [place, placeLoading])

  useEffect(() => {
    // Check if user is employee or has pending request
    if (user && place) {
      checkEmployeeStatus()
    }
  }, [user, place])

  // Load follow state for logged-in user
  useEffect(() => {
    if (!user || !isValidPlaceId(placeId)) return
    let cancelled = false
    const checkFollow = async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('place_id', placeId)
        .maybeSingle()
      if (!cancelled && !error) setIsFollowing(!!data)
    }
    checkFollow()
    return () => { cancelled = true }
  }, [user, placeId])


  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('place_id', placeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading posts:', error)
        return
      }

      setPosts(data || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  const checkEmployeeStatus = async () => {
    if (!user || !place) return

    try {
      // Check if user is an employee
      const { data: empRow, error: employeeError } = await supabase
        .from('place_employees')
        .select('*')
        .eq('user_id', user.id)
        .eq('place_id', place.id)
        .eq('is_active', true)
        .maybeSingle()
      const employeeData = empRow as { permissions?: 'basic' | 'messages_posts' | 'full' } | null

      if (employeeError) {
        console.error('Error checking employee status:', employeeError)
      }

      if (employeeData) {
        setIsEmployee(true)
        setEmployeePermissions(employeeData.permissions || 'basic')
        setHasPendingRequest(false)
        return
      }

      setIsEmployee(false)
      setEmployeePermissions(null)

      // Check if user has a pending request
      const { data: requestData, error: requestError } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('place_id', place.id)
        .eq('status', 'pending')
        .maybeSingle()

      if (requestError) {
        console.error('Error checking pending request:', requestError)
      }

      if (requestData) {
        setHasPendingRequest(true)
      } else {
        setHasPendingRequest(false)
      }
    } catch (error) {
      console.error('Error checking employee status:', error)
    }
  }

  const toggleFollow = async () => {
    if (!user || !place || followLoading) return
    setFollowLoading(true)
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('place_id', place.id)
        if (error) throw error
        setIsFollowing(false)
        showSuccess('تم إلغاء المتابعة')
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, place_id: place.id } as never)
        if (error) throw error
        setIsFollowing(true)
        showSuccess('تمت المتابعة. سنُعلمك بالمنشورات والمنتجات الجديدة.')
      }
    } catch (e: any) {
      showError(e.message || 'حدث خطأ')
    } finally {
      setFollowLoading(false)
    }
  }

  const handleEmployeeRequest = async () => {
    if (!user || !place || !employeePhone.trim()) {
      showError('يرجى إدخال رقم الهاتف')
      return
    }

    try {
      const reqRow = {
        user_id: user.id,
        place_id: place.id,
        phone: employeePhone.trim(),
        status: 'pending',
        permissions: 'basic' as const,
      }
      const { error } = await supabase
        .from('employee_requests')
        .insert(reqRow as never)

      if (error) {
        console.error('Error creating employee request:', error)
        showError('حدث خطأ في إرسال الطلب. حاول مرة أخرى')
        return
      }

      showSuccess('تم إرسال طلبك بنجاح! سيتم مراجعته قريباً')
      setShowEmployeeRequestModal(false)
      setEmployeePhone('')
      setHasPendingRequest(true)
      
      // Refresh employee status
      await checkEmployeeStatus()
    } catch (error) {
      console.error('Error handling employee request:', error)
      showError('حدث خطأ في إرسال الطلب')
    }
  }

  // Open conversation drawer when landing with ?openConversation=placeId (no redirect)
  const openedConversationRef = useRef(false)
  useEffect(() => {
    if (!conversationContext || !place || !user) return
    const openParam = searchParams.get('openConversation')
    if (openParam !== placeId || openedConversationRef.current) return
    openedConversationRef.current = true
    conversationContext.openConversation(placeId, place.user_id)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('openConversation')
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
    window.history.replaceState({}, '', newUrl)
  }, [conversationContext, place, placeId, user, searchParams])

  /* ربط الشريط الفرعي (اسم المكان + صورة مصغرة) بالهيدر الموحد — يختفي عند التمرير؛ التابات تبقى Pinned في المحتوى */
  useEffect(() => {
    const setSubHeader = headerCtx?.setSubHeader
    if (!setSubHeader) return
    if (!place) {
      setSubHeader(null)
      return
    }
    setSubHeader(
      <PlaceDetailSubHeader
        placeName={place.name_ar}
        logoUrl={place.logo_url}
        colors={colors}
      />
    )
    return () => setSubHeader(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- قيم مستقرة؛ colors مرجع يتغير كل render
  }, [headerCtx?.setSubHeader, place?.id, place?.name_ar ?? '', place?.logo_url ?? ''])

  if (loading) {
    return <PageSkeleton variant="default" />
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <BodyMedium color="onSurfaceVariant">المكان غير موجود</BodyMedium>
      </div>
    )
  }

  const videoId = place.video_url ? extractYouTubeId(place.video_url) : null
  
  // Check if current user is the place owner
  const isOwner = user && place && user.id === place.user_id
  
  // Check if user can manage posts (owner or employee with messages_posts/full permissions)
  const canManagePosts = isOwner || (isEmployee && (employeePermissions === 'messages_posts' || employeePermissions === 'full'))
  
  // Check if user can manage products (owner or employee with full permissions)
  const canManageProducts = isOwner || (isEmployee && employeePermissions === 'full')
  
  // Delete post
  const handleDeletePost = async (postId: string) => {
    if (!canManagePosts) return
    
    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) return
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
      
      if (error) {
        console.error('Error deleting post:', error)
        showError('حدث خطأ في حذف المنشور')
        return
      }
      
      showSuccess('تم حذف المنشور بنجاح')
      loadPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      showError('حدث خطأ في حذف المنشور')
    }
  }
  
  // Handle image upload for post
  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showError('الرجاء اختيار ملف صورة صحيح')
      return
    }

    if (file.size > 32 * 1024 * 1024) {
      showError('حجم الصورة كبير جداً. الحد الأقصى هو 32MB')
      return
    }

    setUploadingImage(true)
    showLoading('جاري رفع الصورة...')

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'حدث خطأ في رفع الصورة')
      }

      setPostData({ ...postData, image_url: result.url, post_type: 'image' })
      closeLoading()
      showSuccess('تم رفع الصورة بنجاح')
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في رفع الصورة')
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle video file select
  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      showError('الرجاء اختيار ملف فيديو صحيح')
      return
    }

    if (file.size > 2 * 1024 * 1024 * 1024) {
      showError('حجم الفيديو كبير جداً. الحد الأقصى هو 2GB')
      return
    }

    setSelectedVideoFile(file)
    if (!videoTitle) {
      setVideoTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  // Handle video upload to YouTube
  const handleVideoUpload = async () => {
    if (!selectedVideoFile || !videoTitle.trim()) {
      showError('الرجاء اختيار فيديو وإدخال عنوان')
      return
    }

    setUploadingVideo(true)
    showLoading('جاري رفع الفيديو إلى YouTube...')

    try {
      const formData = new FormData()
      formData.append('video', selectedVideoFile)
      formData.append('title', videoTitle)
      formData.append('description', postData.content || '')
      formData.append('tags', '')
      formData.append('privacyStatus', 'unlisted')

      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل رفع الفيديو')
      }

      if (data.videoUrl) {
        setPostData({ ...postData, video_url: data.videoUrl, post_type: 'video' })
        setSelectedVideoFile(null)
        setVideoTitle('')
        setVideoUploadMethod('link')
        closeLoading()
        showSuccess('تم رفع الفيديو بنجاح إلى YouTube')
      } else {
        throw new Error('لم يتم إرجاع رابط الفيديو من YouTube')
      }
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في رفع الفيديو. تأكد من ربط حساب YouTube في لوحة الإدارة.')
      console.error('YouTube upload error:', error)
    } finally {
      setUploadingVideo(false)
    }
  }

  // Handle save post
  const handleSavePost = async () => {
    if (!user || !place) return

    if (!postData.content.trim()) {
      showError('الرجاء إدخال محتوى المنشور')
      return
    }

    if (postData.post_type === 'image' && !postData.image_url) {
      showError('الرجاء رفع صورة')
      return
    }

    if (postData.post_type === 'video' && !postData.video_url) {
      if (videoUploadMethod === 'upload') {
        showError('الرجاء رفع الفيديو أولاً')
      } else {
        showError('الرجاء إدخال رابط الفيديو')
      }
      return
    }

      showLoading('جاري إضافة المنشور...')

    try {
      const postPayload: any = {
        place_id: placeId,
        created_by: user.id,
        content: postData.content.trim(),
        post_type: postData.post_type,
        is_active: true,
      }

      if (postData.post_type === 'image') {
        postPayload.image_url = postData.image_url
        postPayload.video_url = null
      } else if (postData.post_type === 'video') {
        postPayload.video_url = postData.video_url
        postPayload.image_url = null
      } else {
        postPayload.image_url = null
        postPayload.video_url = null
      }

      const { error } = await supabase
        .from('posts')
        .insert(postPayload)

      if (error) throw error

      showSuccess('تم إضافة المنشور بنجاح')
      closeLoading()
      setShowAddPostModal(false)
      setPostData({ content: '', post_type: 'text', image_url: '', video_url: '' })
      setSelectedVideoFile(null)
      setVideoTitle('')
      setVideoUploadMethod('link')
      loadPosts()
      // Notify place followers about new post
      await notifyPlaceFollowers({
        placeId,
        titleAr: `منشور جديد من ${place.name_ar}`,
        messageAr: 'تم إضافة منشور جديد.',
        type: NotificationType.POST,
        link: `/places/${placeId}`,
      })
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في إضافة المنشور')
    }
  }

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!canManageProducts) return
    
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
      
      if (error) {
        console.error('Error deleting product:', error)
        showError('حدث خطأ في حذف المنتج')
        return
      }
      
      showSuccess('تم حذف المنتج بنجاح')
      router.refresh()
    } catch (error) {
      console.error('Error deleting product:', error)
      showError('حدث خطأ في حذف المنتج')
    }
  }
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Place Header */}
        <div
          className="shadow-elev-4 p-4 sm:p-6 mb-4 sm:mb-6 rounded-2xl"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
        >
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            {place.logo_url ? (
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <img
                  src={place.logo_url}
                  alt={place.name_ar}
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-cover rounded-lg border-2"
                  style={{ borderColor: colors.outline }}
                  onError={(e) => {
                    // Hide broken image and show placeholder
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent && !parent.querySelector('.logo-placeholder')) {
                      const placeholder = document.createElement('div')
                      placeholder.className = 'logo-placeholder w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-lg border-2 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold'
                      placeholder.style.background = `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`
                      placeholder.style.borderColor = colors.outline
                      placeholder.style.color = colors.onPrimary
                      placeholder.textContent = place.name_ar?.[0]?.toUpperCase() || 'M'
                      parent.appendChild(placeholder)
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div 
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-lg border-2 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{
                    background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`,
                    borderColor: colors.outline,
                    color: colors.onPrimary,
                  }}
                >
                  {place.name_ar?.[0]?.toUpperCase() || 'M'}
                </div>
              </div>
            )}
            <div className="flex-1 text-center md:text-right">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4" style={{ color: colors.onSurfaceVariant }}>{place.name_ar}</h1>
              <p className="text-sm sm:text-base mb-3 sm:mb-4" style={{ color: colors.onSurfaceVariant }}>{place.description_ar}</p>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm justify-center md:justify-start">
                <a
                  href={`tel:${place.phone_1}`}
                  className="flex items-center justify-center md:justify-start gap-2 transition-colors cursor-pointer hover:opacity-70"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  <Phone size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>{place.phone_1}</span>
                </a>
                {place.phone_2 && (
                  <a
                    href={`tel:${place.phone_2}`}
                    className="flex items-center justify-center md:justify-start gap-2 transition-colors cursor-pointer hover:opacity-70"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    <Phone size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span>{place.phone_2}</span>
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center md:justify-start gap-2 transition-colors cursor-pointer hover:opacity-70"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  <MapPin size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{place.address || 'العنوان غير متاح'}</span>
                </a>
              </div>
              
              {/* Follow, Employee Request and Message Buttons - Only for logged-in clients (M3) */}
              {user && !isOwner && (
                <div className="mt-4 flex justify-center md:justify-start gap-2 flex-wrap">
                  <Button
                    variant={isFollowing ? 'outlined' : 'filled'}
                    size="sm"
                    loading={followLoading}
                    disabled={followLoading}
                    onClick={toggleFollow}
                    className="shrink-0"
                    aria-label={isFollowing ? 'إلغاء متابعة المكان' : 'متابعة المكان'}
                  >
                    {!followLoading && (isFollowing ? <CheckCircle size={18} /> : <UserPlus size={18} />)}
                    <span>{isFollowing ? 'متابع' : 'متابعة'}</span>
                  </Button>
                  {!isEmployee && (
                    hasPendingRequest ? (
                      <div
                        className="flex items-center gap-2 px-4 py-2 rounded-extra-large border min-h-[48px]"
                        style={{ background: colors.warningContainer, borderColor: colors.outline }}
                      >
                        <CheckCircle size={18} style={{ color: colors.warning }} />
                        <LabelMedium as="span" color="warning">طلبك قيد المراجعة</LabelMedium>
                      </div>
                    ) : (
                      <Button
                        variant="filled"
                        size="sm"
                        onClick={() => setShowEmployeeRequestModal(true)}
                        aria-label="انضمام كموظف"
                      >
                        <UserPlus size={18} />
                        <span>انضمام كموظف</span>
                      </Button>
                    )
                  )}
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => conversationContext?.openConversation(placeId, place.user_id)}
                    aria-label="إرسال رسالة"
                    className="shrink-0"
                  >
                    <MessageCircle size={18} />
                    <span>إرسال رسالة</span>
                  </Button>
                </div>
              )}

              {/* Video - Small inline video */}
              {videoId && (
                <div className="mt-4">
                  <TitleMedium style={{ color: colors.onSurface }} className="mb-2">فيديو المكان</TitleMedium>
                  <div className="aspect-video rounded-lg overflow-hidden max-w-sm mx-auto md:mx-0">
                    <iframe
                      src={getYouTubeEmbedUrl(videoId)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Employee Request Modal */}
        {showEmployeeRequestModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: colors.overlay }}>
            <div
              className="shadow-elev-5 rounded-3xl max-w-md w-full p-6"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <TitleLarge style={{ color: colors.onSurface }}>طلب انضمام كموظف</TitleLarge>
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => {
                    setShowEmployeeRequestModal(false)
                    setEmployeePhone('')
                  }}
                  className="!min-h-0 !p-2 rounded-full shrink-0"
                  style={{ color: colors.onSurfaceVariant }}
                  aria-label="إغلاق"
                >
                  <X size={24} />
                </Button>
              </div>
              <BodyMedium color="onSurfaceVariant" className="mb-4">
                أدخل رقم هاتفك لإرسال طلب الانضمام كموظف في {place.name_ar}
              </BodyMedium>
              <div className="mb-4">
                <LabelMedium style={{ color: colors.onSurface }} className="block mb-2">رقم الهاتف</LabelMedium>
                <Input
                  type="tel"
                  value={employeePhone}
                  onChange={(e) => setEmployeePhone(e.target.value)}
                  placeholder="مثال: 01234567890"
                  className="w-full"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="filled" fullWidth onClick={handleEmployeeRequest}>
                  إرسال الطلب
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowEmployeeRequestModal(false)
                    setEmployeePhone('')
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Tabs — تابات ثابتة تحت الهيدر عند التمرير (منشورات، منتجات، خدمات) */}
        <div
          className="sticky top-0 z-10 border-b shrink-0"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.outline,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex flex-wrap justify-between items-center gap-3 px-2 sm:px-4 py-2">
            <div role="tablist" aria-label="محتوى المكان" className="flex gap-1 sm:gap-2">
              <Button
                variant="text"
                size="md"
                onClick={() => setActiveTab('posts')}
                role="tab"
                aria-selected={activeTab === 'posts'}
                aria-controls="place-tabpanel"
                id="tab-posts"
                className="!min-h-[44px] rounded-extra-large !shadow-none shrink-0"
                style={{
                  color: activeTab === 'posts' ? colors.primary : colors.onSurface,
                  backgroundColor:
                    activeTab === 'posts'
                      ? `rgba(${colors.primaryRgb}, ${isDark ? 0.1 : 0.22})`
                      : 'transparent',
                }}
              >
                <span className="font-semibold text-sm">المنشورات ({posts.length})</span>
              </Button>
              <Button
                variant="text"
                size="md"
                onClick={() => setActiveTab('products')}
                role="tab"
                aria-selected={activeTab === 'products'}
                aria-controls="place-tabpanel"
                id="tab-products"
                className="!min-h-[44px] rounded-extra-large !shadow-none shrink-0"
                style={{
                  color: activeTab === 'products' ? colors.primary : colors.onSurface,
                  backgroundColor:
                    activeTab === 'products'
                      ? `rgba(${colors.primaryRgb}, ${isDark ? 0.1 : 0.22})`
                      : 'transparent',
                }}
              >
                <span className="font-semibold text-sm">المنتجات ({products.length})</span>
              </Button>
              <Button
                variant="text"
                size="md"
                onClick={() => setActiveTab('services')}
                role="tab"
                aria-selected={activeTab === 'services'}
                aria-controls="place-tabpanel"
                id="tab-services"
                className="!min-h-[44px] rounded-extra-large !shadow-none shrink-0"
                style={{
                  color: activeTab === 'services' ? colors.primary : colors.onSurface,
                  backgroundColor:
                    activeTab === 'services'
                      ? `rgba(${colors.primaryRgb}, ${isDark ? 0.1 : 0.22})`
                      : 'transparent',
                }}
              >
                <span className="font-semibold text-sm">الخدمات</span>
              </Button>
            </div>
            {canManagePosts && activeTab === 'posts' && (
              <Button
                variant="filled"
                size="sm"
                onClick={() => setShowAddPostModal(true)}
                className="flex items-center gap-2 shrink-0"
              >
                <Plus size={16} />
                إضافة منشور
              </Button>
            )}
            {canManageProducts && activeTab === 'products' && (
              <Button
                variant="outlined"
                size="sm"
                onClick={() => router.push(`/dashboard/places/${placeId}/products/new`)}
                className="flex items-center gap-2 shrink-0"
              >
                <Plus size={16} />
                إضافة منتج
              </Button>
            )}
          </div>
        </div>

        {/* Tab content */}
        <div
          id="place-tabpanel"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="shadow-elev-4 p-4 sm:p-6 mb-4 sm:mb-6 rounded-3xl"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
        >
          {/* Posts Tab Content — VirtualList عند توفر حاوية التمرير؛ مسافات MD3 */}
          {activeTab === 'posts' && (
            <div>
              {posts.length === 0 ? (
                <BodyMedium color="onSurfaceVariant" className="text-center py-8">
                  لا توجد منشورات حالياً
                </BodyMedium>
              ) : scrollRef ? (
                <VirtualList<typeof posts[0]>
                  items={posts}
                  scrollElementRef={scrollRef}
                  estimateSize={320}
                  contentPaddingTop={PLACE_DETAIL_TABS_HEIGHT_PX}
                  getItemKey={(post) => post.id}
                  renderItem={(post) => (
                    <div style={{ paddingBottom: 'var(--element-gap)' }}>
                      <div
                        className="border rounded-section p-main relative transition-colors"
                        style={{ borderColor: colors.outline }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        {canManagePosts && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                            className="absolute top-2 left-2 !min-h-0 !p-1.5 rounded-lg"
                            title="حذف المنشور"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                        <BodySmall style={{ color: colors.onSurface }} className="mb-3 whitespace-pre-wrap">
                          {post.content}
                        </BodySmall>
                        {post.post_type === 'image' && post.image_url && (
                          <div className="mb-3">
                            <img src={post.image_url} alt="منشور" className="w-full max-w-xl mx-auto rounded-lg" />
                          </div>
                        )}
                        {post.post_type === 'video' && post.video_url && (
                          <div className="mb-3">
                            <div className="aspect-video rounded-lg overflow-hidden max-w-xl mx-auto">
                              {extractYouTubeId(post.video_url) ? (
                                <iframe
                                  src={getYouTubeEmbedUrl(extractYouTubeId(post.video_url)!)}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <video src={post.video_url} controls className="w-full h-full" />
                              )}
                            </div>
                          </div>
                        )}
                        <BodySmall color="onSurfaceVariant" className="mt-2">
                          {new Date(post.created_at).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </BodySmall>
                      </div>
                    </div>
                  )}
                />
              ) : (
                <div className="flex flex-col gap-element">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="border rounded-section p-main relative transition-colors"
                      style={{ borderColor: colors.outline }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {canManagePosts && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                          className="absolute top-2 left-2 !min-h-0 !p-1.5 rounded-lg"
                          title="حذف المنشور"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                      <BodySmall style={{ color: colors.onSurface }} className="mb-3 whitespace-pre-wrap">
                        {post.content}
                      </BodySmall>
                      {post.post_type === 'image' && post.image_url && (
                        <div className="mb-3">
                          <img src={post.image_url} alt="منشور" className="w-full max-w-xl mx-auto rounded-lg" />
                        </div>
                      )}
                      {post.post_type === 'video' && post.video_url && (
                        <div className="mb-3">
                          <div className="aspect-video rounded-lg overflow-hidden max-w-xl mx-auto">
                            {extractYouTubeId(post.video_url) ? (
                              <iframe
                                src={getYouTubeEmbedUrl(extractYouTubeId(post.video_url)!)}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <video src={post.video_url} controls className="w-full h-full" />
                            )}
                          </div>
                        </div>
                      )}
                      <BodySmall color="onSurfaceVariant" className="mt-2">
                        {new Date(post.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </BodySmall>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Products Tab Content — VirtualList عند توفر حاوية التمرير؛ مسافات MD3 */}
          {activeTab === 'products' && (
            <div>
              {products.length === 0 ? (
                <BodyMedium color="onSurfaceVariant" className="text-center py-8">
                  لا توجد منتجات حالياً
                </BodyMedium>
              ) : scrollRef ? (
                <VirtualList<(typeof products)[0][]>
                  items={productGridRows}
                  scrollElementRef={scrollRef}
                  estimateSize={280}
                  contentPaddingTop={PLACE_DETAIL_TABS_HEIGHT_PX}
                  getItemKey={(_row, rowIndex) => rowIndex}
                  renderItem={(row) => (
                    <div
                      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-element"
                      style={{ paddingBottom: 'var(--element-gap)' }}
                    >
                      {row.map((product) => (
                        <div
                          key={product.id}
                          className="border rounded-section p-main transition-all relative"
                          style={{
                            borderColor: colors.outline,
                            ...(productId === product.id ? { boxShadow: `0 0 0 2px ${colors.primary}` } : {}),
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                        >
                          {canManageProducts && (
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="absolute top-2 left-2 !min-h-0 !p-2 rounded-lg z-10"
                              title="حذف المنتج"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                          {product.images && product.images.length > 0 && (
                            <img
                              src={product.images[0].image_url}
                              alt={product.name_ar}
                              className="w-full h-40 sm:h-48 object-cover rounded-lg mb-2 sm:mb-3"
                            />
                          )}
                          <TitleMedium style={{ color: colors.onSurface }} className="mb-1.5 sm:mb-2">
                            {product.name_ar}
                          </TitleMedium>
                          <BodySmall color="onSurfaceVariant" className="mb-2 line-clamp-2">{product.description_ar}</BodySmall>
                          {product.price && (
                            <BodyMedium style={{ color: colors.primary }} className="font-semibold">
                              {product.price} {product.currency}
                            </BodyMedium>
                          )}
                          {product.variants && product.variants.length > 0 && (
                            <div className="mt-2">
                              <BodySmall color="onSurfaceVariant" className="mb-1">المتغيرات المتاحة:</BodySmall>
                              <div className="flex flex-wrap gap-2">
                                {product.variants.map((variant) => (
                                  <span
                                    key={variant.id}
                                    className="px-2 py-1 rounded text-xs"
                                    style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurface }}
                                  >
                                    {variant.variant_name_ar}: {variant.variant_value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-element">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="border rounded-section p-main transition-all relative"
                      style={{
                        borderColor: colors.outline,
                        ...(productId === product.id ? { boxShadow: `0 0 0 2px ${colors.primary}` } : {}),
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {canManageProducts && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="absolute top-2 left-2 !min-h-0 !p-2 rounded-lg z-10"
                          title="حذف المنتج"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name_ar}
                          className="w-full h-40 sm:h-48 object-cover rounded-lg mb-2 sm:mb-3"
                        />
                      )}
                      <TitleMedium style={{ color: colors.onSurface }} className="mb-1.5 sm:mb-2">
                        {product.name_ar}
                      </TitleMedium>
                      <BodySmall color="onSurfaceVariant" className="mb-2 line-clamp-2">{product.description_ar}</BodySmall>
                      {product.price && (
                        <BodyMedium style={{ color: colors.primary }} className="font-semibold">
                          {product.price} {product.currency}
                        </BodyMedium>
                      )}
                      {product.variants && product.variants.length > 0 && (
                        <div className="mt-2">
                          <BodySmall color="onSurfaceVariant" className="mb-1">المتغيرات المتاحة:</BodySmall>
                          <div className="flex flex-wrap gap-2">
                            {product.variants.map((variant) => (
                              <span
                                key={variant.id}
                                className="px-2 py-1 rounded text-xs"
                                style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurface }}
                              >
                                {variant.variant_name_ar}: {variant.variant_value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Services Tab Content — placeholder حتى تفعيل الخدمات */}
          {activeTab === 'services' && (
            <div className="py-12 text-center">
              <BodyMedium color="onSurfaceVariant" className="mb-2">
                الخدمات قريباً
              </BodyMedium>
              <BodySmall color="onSurfaceVariant">
                سنعرض هنا قائمة الخدمات التي يقدمها المكان
              </BodySmall>
            </div>
          )}
        </div>

      </div>

      {/* Add Post Modal */}
      {showAddPostModal && canManagePosts && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: colors.overlay }}>
          <div
            className="shadow-elev-5 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
          >
            <div
              className="sticky top-0 p-4 flex items-center justify-between border-b"
              style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
            >
              <TitleLarge style={{ color: colors.onSurface }}>إضافة منشور جديد</TitleLarge>
              <button
                type="button"
                onClick={() => {
                  setShowAddPostModal(false)
                  setPostData({ content: '', post_type: 'text', image_url: '', video_url: '' })
                  setSelectedVideoFile(null)
                  setVideoTitle('')
                  setVideoUploadMethod('link')
                }}
                className="transition-colors hover:opacity-70 p-2 rounded-full"
                style={{ color: colors.onSurfaceVariant }}
                aria-label="إغلاق"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Post Type Selection */}
              <div>
                <LabelMedium style={{ color: colors.onSurfaceVariant }} className="block mb-2">نوع المنشور</LabelMedium>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPostData({ ...postData, post_type: 'text', image_url: '', video_url: '' })}
                    className="px-4 py-2 rounded-extra-large border transition-colors"
                    style={
                      postData.post_type === 'text'
                        ? { background: 'transparent', color: colors.primary, borderColor: colors.primary, borderWidth: 2 }
                        : { background: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outline, borderWidth: 1 }
                    }
                  >
                    نص
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostData({ ...postData, post_type: 'image', video_url: '' })}
                    className="px-4 py-2 rounded-extra-large border transition-colors"
                    style={
                      postData.post_type === 'image'
                        ? { background: 'transparent', color: colors.primary, borderColor: colors.primary, borderWidth: 2 }
                        : { background: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outline, borderWidth: 1 }
                    }
                  >
                    صورة
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostData({ ...postData, post_type: 'video', image_url: '' })}
                    className="px-4 py-2 rounded-extra-large border transition-colors"
                    style={
                      postData.post_type === 'video'
                        ? { background: 'transparent', color: colors.primary, borderColor: colors.primary, borderWidth: 2 }
                        : { background: colors.surfaceContainer, color: colors.onSurface, borderColor: colors.outline, borderWidth: 1 }
                    }
                  >
                    فيديو
                  </button>
                </div>
              </div>

              {/* Content */}
              <div>
                <LabelMedium style={{ color: colors.onSurfaceVariant }} className="block mb-2">المحتوى</LabelMedium>
                <textarea
                  value={postData.content}
                  onChange={(e) => setPostData({ ...postData, content: e.target.value })}
                  placeholder="اكتب محتوى المنشور هنا..."
                  rows={6}
                  className="w-full px-4 py-2 rounded-2xl border-2 transition-colors focus:outline-none"
                  style={{ backgroundColor: colors.surface, borderColor: colors.outline, color: colors.onSurface }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
                />
              </div>

              {/* Image Upload */}
              {postData.post_type === 'image' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                    الصورة
                  </label>
                  {postData.image_url ? (
                    <div className="relative inline-block">
                      <img
                        src={postData.image_url}
                        alt="Preview"
                        className="max-w-full h-64 object-contain rounded-lg border"
                        style={{ borderColor: colors.outline }}
                      />
                      <button
                        onClick={() => setPostData({ ...postData, image_url: '' })}
                        className="absolute top-2 right-2 rounded-full p-1 transition-all hover:scale-110"
                        style={{
                          backgroundColor: colors.error,
                          color: 'var(--color-on-error)',
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:opacity-90"
                      style={{ borderColor: colors.outline, backgroundColor: colors.surfaceContainer }}
                    >
                      <ImageIcon className="w-8 h-8 mb-2" style={{ color: colors.onSurfaceVariant }} />
                      <BodySmall color="onSurfaceVariant" className="text-sm">
                        {uploadingImage ? 'جاري الرفع...' : 'انقر لرفع صورة'}
                      </BodySmall>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePostImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Video Upload/Link */}
              {postData.post_type === 'video' && (
                <div className="space-y-4">
                  {/* Video Method Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                      طريقة إضافة الفيديو
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setVideoUploadMethod('link')
                          setSelectedVideoFile(null)
                          setVideoTitle('')
                        }}
                        className="px-4 py-2 rounded-lg transition-colors"
                        style={videoUploadMethod === 'link' ? { background: colors.primary, color: colors.onPrimary } : { background: colors.surfaceContainer, color: colors.onSurface }}
                      >
                        رابط YouTube
                      </button>
                      <button
                        onClick={() => {
                          setVideoUploadMethod('upload')
                          setPostData({ ...postData, video_url: '' })
                        }}
                        className="px-4 py-2 rounded-lg transition-colors"
                        style={videoUploadMethod === 'upload' ? { background: colors.primary, color: colors.onPrimary } : { background: colors.surfaceContainer, color: colors.onSurface }}
                      >
                        رفع من الجهاز
                      </button>
                    </div>
                  </div>

                  {/* Video Link Method */}
                  {videoUploadMethod === 'link' && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                        رابط الفيديو (YouTube)
                      </label>
                      <input
                        type="text"
                        value={postData.video_url}
                        onChange={(e) => setPostData({ ...postData, video_url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-4 py-2 rounded-2xl border-2 transition-colors focus:outline-none"
                  style={{ backgroundColor: colors.surface, borderColor: colors.outline, color: colors.onSurface }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
                      />
                    </div>
                  )}

                  {/* Video Upload Method */}
                  {videoUploadMethod === 'upload' && (
                    <div className="space-y-4">
                      {/* File Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                          اختر فيديو للرفع *
                        </label>
                        {selectedVideoFile ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: colors.surfaceContainer }}>
                              <Video size={20} style={{ color: colors.onSurfaceVariant }} />
                              <div className="flex-1">
                                <BodySmall style={{ color: colors.onSurface }} className="font-medium">
                                  {selectedVideoFile!.name}
                                </BodySmall>
                                <BodySmall color="onSurfaceVariant" className="text-xs">
                                  الحجم: {(selectedVideoFile!.size / (1024 * 1024)).toFixed(2)} MB
                                </BodySmall>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedVideoFile(null)
                                  setVideoTitle('')
                                }}
                                className="transition-colors hover:opacity-70"
                                style={{ color: colors.error }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <button
                              onClick={handleVideoUpload}
                              disabled={uploadingVideo || !videoTitle.trim()}
                              className="w-full px-4 py-2 rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
                              style={{ background: (uploadingVideo || !videoTitle.trim()) ? colors.onSurfaceVariant : colors.secondary, color: (uploadingVideo || !videoTitle.trim()) ? colors.onSurface : colors.onSecondary }}
                              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '0.9')}
                              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '1')}
                            >
                              {uploadingVideo ? 'جاري الرفع...' : 'رفع الفيديو إلى YouTube'}
                            </button>
                          </div>
                        ) : (
                          <label
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:opacity-90"
                          style={{ borderColor: colors.outline, backgroundColor: colors.surfaceContainer }}
                        >
                            <Upload className="w-8 h-8 mb-2" style={{ color: colors.onSurfaceVariant }} />
                            <BodySmall color="onSurfaceVariant" className="text-sm">
                              انقر لاختيار فيديو
                            </BodySmall>
                            <BodySmall color="onSurfaceVariant" className="text-xs mt-1">
                              الحد الأقصى: 2GB
                            </BodySmall>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={handleVideoFileSelect}
                              className="hidden"
                              disabled={uploadingVideo}
                            />
                          </label>
                        )}
                      </div>

                      {/* Video Title */}
                      {selectedVideoFile && (
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                            عنوان الفيديو *
                          </label>
                          <input
                            type="text"
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            placeholder="أدخل عنوان الفيديو"
                            className="w-full px-4 py-2 rounded-2xl border-2 transition-colors focus:outline-none"
                  style={{ backgroundColor: colors.surface, borderColor: colors.outline, color: colors.onSurface }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
                            maxLength={100}
                          />
                          <BodySmall color="onSurfaceVariant" className="mt-1">
                            {videoTitle.length}/100
                          </BodySmall>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="filled"
                  fullWidth
                  onClick={handleSavePost}
                  disabled={uploadingImage || uploadingVideo || !postData.content.trim() || (postData.post_type === 'video' && videoUploadMethod === 'upload' && !postData.video_url)}
                >
                  {uploadingVideo ? 'جاري الرفع...' : 'إضافة المنشور'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowAddPostModal(false)
                    setPostData({ content: '', post_type: 'text', image_url: '', video_url: '' })
                    setSelectedVideoFile(null)
                    setVideoTitle('')
                    setVideoUploadMethod('link')
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Enlargement Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: colors.overlay }}
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={(e) => { e.stopPropagation(); setEnlargedImage(null) }}
              className="absolute -top-12 right-0 hover:opacity-70 transition-opacity p-2 rounded-full border-2"
              style={{ color: colors.primary, borderColor: colors.primary, backgroundColor: colors.surface }}
              aria-label="إغلاق"
            >
              <X size={28} />
            </button>
            <img
              src={enlargedImage}
              alt="Enlarged"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

    </div>
  )
}

export default function PlacePage() {
  return (
    <Suspense fallback={<PageSkeleton variant="default" />}>
      <ProductIdHandler>
        {(productId) => <PlacePageContent productId={productId} />}
      </ProductIdHandler>
    </Suspense>
  )
}
