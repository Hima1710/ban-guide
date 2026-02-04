'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthContext, usePlaces, useMessages } from '@/hooks'
import Link from 'next/link'
import { Plus, Package as PackageIcon, MessageSquare, TrendingUp, Clock, Settings, Users, ChevronDown, FileCheck, LogOut, Mic } from 'lucide-react'
import { showSuccess, showError } from '@/components/SweetAlert'
import { PageSkeleton } from '@/components/common'
import { Button, HeadlineLarge, HeadlineMedium, TitleMedium, TitleLarge, BodyMedium, BodySmall, LabelSmall } from '@/components/m3'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/contexts/ThemeContext'
import { useWebView } from '@/lib/webview-detection'

// Component that uses useSearchParams - must be wrapped in Suspense
function YouTubeAuthHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for YouTube auth result
    const youtubeAuth = searchParams?.get('youtube_auth')
    const error = searchParams?.get('error')
    
    if (youtubeAuth === 'success') {
      showSuccess('تم ربط حساب YouTube بنجاح! يمكنك الآن رفع الفيديوهات.')
      router.replace('/dashboard')
    } else if (error === 'youtube_auth_failed') {
      showError('فشل ربط حساب YouTube. يرجى المحاولة مرة أخرى.')
      router.replace('/dashboard')
    }
  }, [searchParams, router])

  return null
}

type MicStatus = 'unknown' | 'granted' | 'denied' | 'prompt'

export default function DashboardPage() {
  const router = useRouter()
  const { colors } = useTheme()
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [micStatus, setMicStatus] = useState<MicStatus>('unknown')
  const [micRequesting, setMicRequesting] = useState(false)
  const { isWebView, platform } = useWebView()

  // Use custom hooks for data fetching
  const { user, profile, loading: authLoading } = useAuthContext(true)
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }
  const { places, loading: placesLoading } = usePlaces({ 
    userId: user?.id, 
    autoLoad: true  // Always load when hook mounts
  })
  
  // Get place IDs for messages
  const placeIds = places.map(p => p.id)
  const { 
    messages, 
    unreadCount 
  } = useMessages({ 
    placeId: placeIds.length > 0 ? placeIds : undefined,
    autoLoad: true  // Always load when hook mounts
  })

  const loading = authLoading || (user && placesLoading)

  // التحقق من حالة إذن الميكروفون (إن وُجدت واجهة الصلاحيات)
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions?.query) return
    navigator.permissions
      .query({ name: 'microphone' as PermissionDescriptor['name'] })
      .then((result) => {
        setMicStatus(result.state as MicStatus)
        result.onchange = () => setMicStatus(result.state as MicStatus)
      })
      .catch(() => {})
  }, [])

  const requestMicrophone = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      showError('المتصفح لا يدعم الوصول إلى الميكروفون')
      return
    }
    setMicRequesting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      setMicStatus('granted')
      showSuccess('تم منح إذن الميكروفون. يمكنك إرسال رسائل صوتية في المحادثات.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تم رفض الإذن أو حدث خطأ'
      setMicStatus('denied')
      const isDenied = msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('denied')
      const webViewHint = isWebView && platform === 'android'
        ? ' في تطبيق أندرويد: منح إذن الميكروفون من إعدادات الجهاز: الإعدادات ← التطبيقات ← بان ← الصلاحيات.'
        : ''
      showError(isDenied
        ? 'لم يتم منح إذن الميكروفون. يمكنك تفعيله لاحقاً من إعدادات المتصفح.' + webViewHint
        : 'فشل في الوصول إلى الميكروفون. تأكد من إعدادات الجهاز والمتصفح.' + webViewHint)
    } finally {
      setMicRequesting(false)
    }
  }

  if (loading) {
    return <PageSkeleton variant="dashboard" />
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <Suspense fallback={null}>
        <YouTubeAuthHandler />
      </Suspense>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <HeadlineLarge className="mb-4 sm:mb-6" style={{ color: colors.onSurface }}>لوحة التحكم</HeadlineLarge>

        {/* User Profile Section - Mobile & Desktop */}
        {user && profile && (
          <div
            className="rounded-3xl shadow-lg p-4 mb-6"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || ''}
                    className="w-16 h-16 rounded-full border-2 object-cover shadow-sm"
                    style={{ borderColor: colors.outline }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.onPrimary,
                    }}
                  >
                    {(profile.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                {/* Online indicator */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 border-2 rounded-full"
                  style={{ backgroundColor: colors.success, borderColor: colors.surface }}
                />
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <TitleLarge className="truncate" style={{ color: colors.onSurface }}>
                  {profile.full_name || 'مستخدم'}
                </TitleLarge>
                <BodySmall color="onSurfaceVariant" className="truncate">
                  {user.email}
                </BodySmall>
                {/* Badges */}
                <div className="flex items-center gap-2 mt-1">
                  {profile.is_admin && (
                    <LabelSmall
                      as="span"
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: colors.errorContainer, color: colors.error }}
                    >
                      مدير
                    </LabelSmall>
                  )}
                  {profile.is_affiliate && !profile.is_admin && (
                    <LabelSmall
                      as="span"
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: colors.warningContainer, color: colors.warning }}
                    >
                      مسوق
                    </LabelSmall>
                  )}
                </div>
              </div>

              <Button variant="danger" size="sm" onClick={handleLogout} className="!min-h-0 py-2">
                <LogOut size={18} />
                <span className="hidden sm:inline">خروج</span>
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div
            className="shadow p-4 sm:p-6 rounded-3xl"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <PackageIcon className="flex-shrink-0 sm:w-8 sm:h-8" size={28} style={{ color: colors.primary }} />
              <div>
                <BodyMedium color="onSurfaceVariant">الأماكن</BodyMedium>
                <HeadlineMedium style={{ color: colors.onSurface }}>{places.length}</HeadlineMedium>
              </div>
            </div>
          </div>
          <Link
            href="#messages"
            className="shadow p-4 sm:p-6 rounded-3xl hover:shadow-md transition-shadow cursor-pointer block"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <MessageSquare className="flex-shrink-0 sm:w-8 sm:h-8" size={28} style={{ color: colors.secondary }} />
              <div className="flex-1 min-w-0">
                <BodyMedium color="onSurfaceVariant">الرسائل</BodyMedium>
                <div className="flex items-center gap-2 flex-wrap">
                  <HeadlineMedium style={{ color: colors.onSurface }}>{messages.length}</HeadlineMedium>
                  {unreadCount > 0 && (
                    <LabelSmall
                      as="span"
                      className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                      style={{ backgroundColor: colors.error, color: colors.onPrimary }}
                    >
                      {unreadCount} غير مقروء
                    </LabelSmall>
                  )}
                </div>
              </div>
            </div>
          </Link>
          <div
            className="shadow p-4 sm:p-6 rounded-3xl sm:col-span-2 lg:col-span-1"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <TrendingUp className="flex-shrink-0 sm:w-8 sm:h-8" size={28} style={{ color: colors.warning }} />
              <div>
                <BodyMedium color="onSurfaceVariant">المشاهدات</BodyMedium>
                <HeadlineMedium style={{ color: colors.onSurface }}>
                  {places.reduce((sum, p) => sum + p.total_views, 0)}
                </HeadlineMedium>
              </div>
            </div>
          </div>
        </div>

        <div
          className="shadow p-4 sm:p-6 mb-4 sm:mb-6 rounded-3xl"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <TitleLarge style={{ color: colors.onSurface }}>أماكني</TitleLarge>
            <Button
              variant="filled"
              size="md"
              onClick={() => router.push('/dashboard/places/new')}
              className="w-full sm:w-auto"
            >
              <Plus size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">إضافة مكان جديد</span>
              <span className="sm:hidden">إضافة مكان</span>
            </Button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {places.map((place) => (
              <Link
                key={place.id}
                href={`/dashboard/places/${place.id}`}
                className="block p-3 sm:p-4 border rounded-2xl transition-colors"
                style={{ borderColor: colors.outline }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <TitleMedium className="mb-1" style={{ color: colors.onSurface }}>{place.name_ar}</TitleMedium>
                <BodySmall color="onSurfaceVariant" className="mb-1">{place.category}</BodySmall>
                <LabelSmall color="onSurfaceVariant" className="mt-1.5 sm:mt-2">
                  المشاهدات: {place.total_views} | اليوم: {place.today_views}
                </LabelSmall>
              </Link>
            ))}
            {places.length === 0 && (
              <div className="text-center py-6 sm:py-8">
                <BodyMedium color="onSurfaceVariant">لا توجد أماكن بعد</BodyMedium>
              </div>
            )}
          </div>
        </div>

        {/* Messages Section */}
        {messages.length > 0 && (
          <div
            id="messages"
            className="shadow p-4 sm:p-6 mb-4 sm:mb-6 rounded-3xl"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <TitleLarge style={{ color: colors.onSurface }}>الرسائل الأخيرة</TitleLarge>
              {unreadCount > 0 && (
                <LabelSmall
                  as="span"
                  className="px-2 sm:px-3 py-1 rounded-full"
                  style={{ backgroundColor: colors.error, color: colors.onPrimary }}
                >
                  {unreadCount} رسالة غير مقروءة
                </LabelSmall>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.slice(0, 10).map((message) => {
                const place = places.find(p => p.id === message.place_id)
                const isUnread = !message.is_read && message.sender_id !== user?.id
                
                return (
                  <Link
                    key={message.id}
                    href={`/places/${message.place_id}`}
                    className="block p-4 border rounded-2xl transition-colors"
                    style={isUnread ? {
                      background: `rgba(${colors.primaryRgb}, 0.1)`,
                      borderColor: colors.primary
                    } : { borderColor: colors.outline }}
                    onMouseEnter={(e) => {
                      if (!isUnread) e.currentTarget.style.backgroundColor = colors.surfaceContainer
                    }}
                    onMouseLeave={(e) => {
                      if (!isUnread) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TitleMedium className="truncate" style={{ color: colors.onSurface }}>
                            {place?.name_ar || 'مكان غير معروف'}
                          </TitleMedium>
                          {isUnread && (
                            <LabelSmall
                              as="span"
                              className="px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
                            >
                              جديد
                            </LabelSmall>
                          )}
                        </div>
                        {message.sender && (
                          <BodySmall color="onSurfaceVariant" className="mb-1">
                            من: {message.sender.full_name || message.sender.email || 'مستخدم'}
                          </BodySmall>
                        )}
                        {message.content ? (
                          <BodySmall className="line-clamp-2" style={{ color: colors.onSurface }}>{message.content}</BodySmall>
                        ) : message.image_url ? (
                          <BodySmall color="onSurfaceVariant" className="italic">صورة</BodySmall>
                        ) : null}
                        <div className="flex items-center gap-2 mt-2">
                          <Clock size={14} style={{ color: colors.onSurfaceVariant }} />
                          <LabelSmall color="onSurfaceVariant">
                            {new Date(message.created_at).toLocaleString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </LabelSmall>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            {messages.length > 10 && (
              <BodySmall color="onSurfaceVariant" className="text-center text-sm mt-4">
                عرض {messages.length - 10} رسالة أخرى
              </BodySmall>
            )}
          </div>
        )}

        <div
          className="shadow p-6 mb-6 rounded-3xl"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
        >
          <TitleLarge style={{ color: colors.onSurface }} className="mb-4">الباقات والاشتراكات</TitleLarge>
          <Link
            href="/dashboard/packages"
            className="font-medium hover:underline"
            style={{ color: colors.primary }}
          >
            عرض الباقات المتاحة والاشتراك
          </Link>
        </div>

        {profile?.is_admin && (
          <div
            className="shadow p-6 mb-6 rounded-3xl"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <TitleLarge style={{ color: colors.onSurface }}>لوحة الإدارة</TitleLarge>
              <div className="relative">
                <Button
                  variant="filled"
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className="flex items-center gap-2"
                >
                  <Settings size={18} />
                  <span>لوحة الإدارة</span>
                  <ChevronDown size={18} className={`transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
                </Button>
                {adminMenuOpen && (
                  <div
                    className="absolute left-0 mt-2 w-56 rounded-xl shadow-lg border z-10 overflow-hidden"
                    style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
                  >
                    <Link
                      href="/admin"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors border-b block"
                      style={{ color: colors.onSurface, borderColor: colors.outline }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <Settings size={18} style={{ color: colors.error }} />
                      <span>لوحة الإدارة الرئيسية</span>
                    </Link>
                    <Link
                      href="/admin/packages"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors border-b block"
                      style={{ color: colors.onSurface, borderColor: colors.outline }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <PackageIcon size={18} style={{ color: colors.primary }} />
                      <span>إدارة الباقات</span>
                    </Link>
                    <Link
                      href="/admin/users"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors border-b block"
                      style={{ color: colors.onSurface, borderColor: colors.outline }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <Users size={18} style={{ color: colors.secondary }} />
                      <span>المستخدمين</span>
                    </Link>
                    <Link
                      href="/admin/affiliates"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors border-b block"
                      style={{ color: colors.onSurface, borderColor: colors.outline }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <TrendingUp size={18} style={{ color: colors.warning }} />
                      <span>المسوقين</span>
                    </Link>
                    <Link
                      href="/admin/youtube"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors border-b block"
                      style={{ color: colors.onSurface, borderColor: colors.outline }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <MessageSquare size={18} style={{ color: colors.primary }} />
                      <span>إعدادات YouTube</span>
                    </Link>
                    <Link
                      href="/admin/discount-codes"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors border-b block"
                      style={{ color: colors.onSurface, borderColor: colors.outline }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <PackageIcon size={18} style={{ color: colors.primary }} />
                      <span>كوبونات الخصم</span>
                    </Link>
                    <Link
                      href="/admin/subscriptions"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors border-b block"
                      style={{ color: colors.onSurface, borderColor: colors.outline }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <FileCheck size={18} style={{ color: colors.primary }} />
                      <span>مراجعة الاشتراكات</span>
                    </Link>
                    <Link
                      href="/admin/settings"
                      onClick={() => setAdminMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 transition-colors block"
                      style={{ color: colors.onSurface }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <Settings size={18} style={{ color: colors.onSurfaceVariant }} />
                      <span>الإعدادات</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {profile?.is_affiliate && (
          <div
            className="shadow p-6 rounded-3xl"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
          >
            <TitleLarge style={{ color: colors.onSurface }} className="mb-4">التسويق بالعمولة</TitleLarge>
            <Link
              href="/dashboard/affiliate"
              className="font-medium hover:underline"
              style={{ color: colors.primary }}
            >
              عرض لوحة المسوق
            </Link>
          </div>
        )}

        {/* صلاحيات التطبيق — الميكروفون للرسائل الصوتية */}
        <div
          className="shadow p-6 rounded-3xl"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
        >
          <TitleLarge style={{ color: colors.onSurface }} className="mb-4">صلاحيات التطبيق</TitleLarge>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Mic size={22} style={{ color: colors.primary }} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <BodyMedium style={{ color: colors.onSurface }}>الميكروفون</BodyMedium>
                <BodySmall color="onSurfaceVariant">مطلوب لإرسال رسائل صوتية في المحادثات</BodySmall>
              </div>
              <Button
                variant="outlined"
                size="sm"
                onClick={requestMicrophone}
                disabled={micRequesting || micStatus === 'granted'}
                loading={micRequesting}
                aria-label="طلب إذن الميكروفون"
              >
                {micRequesting ? 'جاري الطلب...' : micStatus === 'granted' ? 'تم منح الإذن' : 'طلب إذن الميكروفون'}
              </Button>
            </div>
            {micStatus !== 'unknown' && (
              <LabelSmall color="onSurfaceVariant">
                {micStatus === 'granted' && '✓ مسموح'}
                {micStatus === 'denied' && '✗ مرفوض — يمكنك تفعيله من إعدادات المتصفح'}
                {micStatus === 'prompt' && '— سيُطلب منك عند الضغط على الزر'}
              </LabelSmall>
            )}
            {isWebView && platform === 'android' && (
              <div
                className="rounded-xl p-3"
                style={{ backgroundColor: colors.surfaceContainer, border: `1px solid ${colors.outlineVariant}` }}
              >
                <BodySmall color="onSurfaceVariant">
                  <strong>عند استخدام التطبيق من داخل تطبيق أندرويد (WebView):</strong> تأكد من منح تطبيق بان إذن الميكروفون من إعدادات الجهاز: الإعدادات ← التطبيقات ← بان ← الصلاحيات.
                </BodySmall>
              </div>
            )}
          </div>
        </div>

        {/* Legal & Privacy Links */}
        <div
          className="shadow p-6 rounded-3xl"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
        >
          <TitleLarge style={{ color: colors.onSurface }} className="mb-4">القانونية والخصوصية</TitleLarge>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Link
              href="/dashboard/privacy-ar"
              className="font-medium hover:underline"
              style={{ color: colors.primary }}
            >
              سياسة الخصوصية (عربي)
            </Link>
            <span className="hidden sm:inline" style={{ color: colors.onSurfaceVariant }}>•</span>
            <Link
              href="/dashboard/privacy"
              className="font-medium hover:underline"
              style={{ color: colors.primary }}
            >
              Privacy Policy (English)
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
