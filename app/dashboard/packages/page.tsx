'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Package, DiscountCode, Affiliate } from '@/lib/types'
import { useAuthContext } from '@/hooks'
import { showError, showSuccess, showConfirm } from '@/components/SweetAlert'
import { Check, Crown, Star, Upload, X } from 'lucide-react'
import { Input, LoadingSpinner } from '@/components/common'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import {
  HeadlineLarge,
  HeadlineMedium,
  HeadlineSmall,
  TitleLarge,
  TitleMedium,
  BodyMedium,
  BodySmall,
  LabelLarge,
  LabelMedium,
  Button,
} from '@/components/m3'

export default function PackagesPage() {
  const router = useRouter()
  const { colors } = useTheme()
  const { user, loading: authLoading } = useAuthContext(true)
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [discountCode, setDiscountCode] = useState('')
  const [selectedDiscount, setSelectedDiscount] = useState<any>(null)
  const [discountType, setDiscountType] = useState<'affiliate' | 'code' | null>(null)
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)

  useEffect(() => {
    if (user) {
      loadCurrentSubscription()
    }
    loadPackages()
  }, [user])

  const loadCurrentSubscription = async () => {
    if (!user) return

    // Load current subscription
    const { data: subData } = await supabase
      .from('user_subscriptions')
      .select('*, package:packages(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    setCurrentSubscription(subData || null)
  }

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('priority', { ascending: false })
        .order('price', { ascending: true })

      if (error) throw error
      setPackages(data || [])
    } catch (error: any) {
      showError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const validateDiscountCode = async (code: string) => {
    if (!code.trim()) {
      setSelectedDiscount(null)
      setDiscountType(null)
      return null
    }

    const codeUpper = code.toUpperCase().trim()

    try {
      // First, try to find in discount_codes table
      const now = new Date().toISOString()
      const { data: discountData, error: discountError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', codeUpper)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .single()
      const discountCodeData = discountData as DiscountCode | null

      if (!discountError && discountCodeData) {
        // Check if max_uses is reached
        if (discountCodeData.max_uses && discountCodeData.used_count >= discountCodeData.max_uses) {
          setSelectedDiscount(null)
          setDiscountType(null)
          return null
        }
        setSelectedDiscount(discountCodeData)
        setDiscountType('code')
        return { ...discountCodeData, type: 'code' }
      }

      // If not found in discount_codes, try affiliates table
      const { data: affData, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('code', codeUpper)
        .eq('is_active', true)
        .single()
      const affiliateData = affData as Affiliate | null

      if (!affiliateError && affiliateData) {
        setSelectedDiscount(affiliateData)
        setDiscountType('affiliate')
        return { ...affiliateData, type: 'affiliate' }
      }

      setSelectedDiscount(null)
      setDiscountType(null)
      return null
    } catch (error) {
      setSelectedDiscount(null)
      setDiscountType(null)
      return null
    }
  }

  const handleDiscountCodeChange = async (code: string) => {
    setDiscountCode(code)
    if (code.trim()) {
      await validateDiscountCode(code)
    } else {
      setSelectedDiscount(null)
      setDiscountType(null)
    }
  }

  const handleSubscribeClick = (pkg: Package) => {
    setSelectedPackage(pkg)
    setShowReceiptModal(true)
  }

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReceiptFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
  }

  const handleSubscribe = async (pkg: Package) => {
    // Validate discount code if provided
    let discount = null
    if (discountCode.trim()) {
      discount = await validateDiscountCode(discountCode)
      if (!discount) {
        showError('كود الخصم غير صحيح أو غير نشط أو منتهي الصلاحية')
        return
      }
    }

    // Calculate final price
    let finalPrice = pkg.price
    let discountAmount = 0
    if (discount) {
      discountAmount = (pkg.price * discount.discount_percentage) / 100
      finalPrice = pkg.price - discountAmount
    }

    const confirmed = await showConfirm(
      discount
        ? `هل تريد الاشتراك في باقة "${pkg.name_ar}" بسعر ${pkg.price} EGP مع خصم ${discount.discount_percentage}% (${discountAmount.toFixed(2)} EGP) = ${finalPrice.toFixed(2)} EGP؟`
        : `هل تريد الاشتراك في باقة "${pkg.name_ar}" بسعر ${pkg.price} EGP؟`
    )

    if (!confirmed.isConfirmed) return

    try {
      // Check if user is authenticated
      if (!user) {
        showError('يجب تسجيل الدخول أولاً')
        router.push('/auth/login')
        return
      }

      // Check if user has active subscription
      if (currentSubscription) {
        showError('لديك اشتراك نشط بالفعل. يجب إلغاء الاشتراك الحالي أولاً')
        return
      }

      // Check if receipt is uploaded
      if (!receiptFile) {
        showError('يرجى رفع صورة إيصال الدفع')
        return
      }

      setUploadingReceipt(true)

      // Upload receipt image via API route
      const formData = new FormData()
      formData.append('image', receiptFile)
      
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })
      
      const uploadData = await uploadResponse.json()
      
      if (!uploadData.success || !uploadData.url) {
        throw new Error(uploadData.error || 'فشل رفع صورة الإيصال')
      }
      
      const receiptImageUrl = uploadData.url

      // Ensure user profile exists (required for foreign key constraint)
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!existingProfile) {
        // Create user profile if it doesn't exist
        const profileRow = {
          id: user.id,
          email: user.email || null,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          is_admin: false,
          is_affiliate: false,
        }
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert(profileRow as never, { onConflict: 'id' })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          throw new Error('فشل في إنشاء ملف المستخدم. يرجى المحاولة مرة أخرى.')
        }
      }

      // Create subscription with pending status
      const subscriptionRow = {
        user_id: user.id,
        package_id: pkg.id,
        amount_paid: finalPrice,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        receipt_image_url: receiptImageUrl,
        status: 'pending',
        is_active: false, // Will be activated after admin approval
      }
      const { data: subscriptionData, error: subError } = await supabase
        .from('user_subscriptions')
        .insert(subscriptionRow as never)
        .select()
        .single()

      if (subError) throw subError

      setUploadingReceipt(false)

      // Handle discount code usage
      if (discount && subscriptionData) {
        if (discount.type === 'code') {
          // Increment usage count for discount code
          const { error: incrementError } = await supabase.rpc('increment_discount_code_usage', { code_id: discount.id } as never)
          if (incrementError) {
            console.error('Error incrementing discount code usage:', incrementError)
          }
        } else if (discount.type === 'affiliate') {
          // Create affiliate transaction
          const commissionAmount = (finalPrice * discount.discount_percentage) / 100
          
          const transRow = {
            affiliate_id: discount.id,
            subscription_id: subscriptionData.id,
            amount: commissionAmount,
            commission_percentage: discount.discount_percentage,
            status: 'pending',
          }
          const { error: transError } = await supabase
            .from('affiliate_transactions')
            .insert(transRow as never)

          if (transError) {
            console.error('Error creating affiliate transaction:', transError)
          }
        }
      }

      showSuccess('تم إرسال طلب الاشتراك بنجاح! سيتم مراجعة الإيصال وتفعيل الاشتراك قريباً.')
      setShowReceiptModal(false)
      setReceiptFile(null)
      setReceiptPreview(null)
      setSelectedPackage(null)
      loadCurrentSubscription() // Refresh subscription status
    } catch (error: any) {
      setUploadingReceipt(false)
      showError(error.message || 'حدث خطأ في الاشتراك')
    }
  }

  const getCardStyle = (pkg: Package): React.CSSProperties => {
    if (pkg.is_featured || pkg.card_style === 'gold') {
      return {
        border: `2px solid ${colors.warning}`,
        background: `linear-gradient(to bottom right, ${colors.warningContainer}, rgba(${colors.primaryRgb}, 0.08))`,
      }
    }
    if (pkg.card_style === 'silver') {
      return {
        border: `1px solid ${colors.outline}`,
        background: `linear-gradient(to bottom right, ${colors.surface}, ${colors.background})`,
      }
    }
    return {
      border: `1px solid ${colors.outline}`,
      background: colors.surface,
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="جاري التحميل..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: colors.background }}>
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="mb-4 inline-block"
            style={{ color: colors.primary }}
          >
            ← العودة للوحة التحكم
          </Link>
          <HeadlineLarge className="mb-2">الباقات المتاحة</HeadlineLarge>
          <BodyMedium color="onSurfaceVariant">اختر الباقة المناسبة لك</BodyMedium>
        </div>

        {currentSubscription && (
          <div
            className="rounded-3xl p-4 mb-6 border"
            style={{ background: colors.infoContainer, borderColor: colors.primary }}
          >
            <div className="flex items-center justify-between">
              <div>
                <TitleMedium style={{ color: colors.primary }}>
                  اشتراكك الحالي: {(currentSubscription.package as Package)?.name_ar}
                </TitleMedium>
                <BodySmall color="onSurfaceVariant" className="mt-1">
                  ينتهي في: {new Date(currentSubscription.expires_at).toLocaleDateString('ar-EG')}
                </BodySmall>
              </div>
              <span
                className="px-3 py-1 rounded-full"
                style={{ background: colors.secondary, color: colors.onSecondary }}
              >
                <LabelMedium as="span">نشط</LabelMedium>
              </span>
            </div>
          </div>
        )}

        {/* Discount Code Input */}
        <div
          className="shadow-md p-4 mb-6 rounded-3xl"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
        >
          <div className="flex items-center gap-4">
            <LabelMedium className="whitespace-nowrap">كود الخصم:</LabelMedium>
            <Input
              type="text"
              value={discountCode}
              onChange={(e) => handleDiscountCodeChange(e.target.value)}
              placeholder="أدخل كود الخصم (اختياري)"
              className="flex-1"
            />
            {selectedDiscount && (
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-xl"
                style={{ background: colors.successContainer, color: colors.success }}
              >
                <Check size={16} />
                <LabelMedium as="span">خصم {selectedDiscount.discount_percentage}%</LabelMedium>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isCurrentPackage = currentSubscription?.package_id === pkg.id
            const disabled = isCurrentPackage || !!currentSubscription
            return (
              <div
                key={pkg.id}
                className="rounded-2xl shadow-lg p-6 relative"
                style={getCardStyle(pkg)}
              >
                {pkg.is_featured && (
                  <div
                    className="absolute top-4 left-4 px-3 py-1 rounded-full flex items-center gap-1"
                    style={{ background: colors.warningContainer, color: colors.warning }}
                  >
                    <Star size={12} />
                    <LabelMedium as="span">مميز</LabelMedium>
                  </div>
                )}

                <div className="text-center mb-6">
                  <HeadlineSmall className="mb-2" style={{ color: colors.onSurface }}>
                    {pkg.name_ar}
                  </HeadlineSmall>
                  <BodySmall color="onSurfaceVariant" className="mb-4">{pkg.name_en}</BodySmall>
                  {selectedDiscount ? (
                    <div>
                      <TitleMedium className="line-through mb-1" style={{ color: colors.onSurfaceVariant }}>
                        {pkg.price} <span className="text-sm">EGP</span>
                      </TitleMedium>
                      <HeadlineMedium className="mb-2" style={{ color: colors.secondary }}>
                        {(pkg.price - (pkg.price * selectedDiscount.discount_percentage) / 100).toFixed(2)} <span className="text-lg">EGP</span>
                      </HeadlineMedium>
                      <LabelLarge style={{ color: colors.secondary }}>
                        خصم {selectedDiscount.discount_percentage}%
                      </LabelLarge>
                    </div>
                  ) : (
                    <HeadlineMedium className="mb-2" style={{ color: colors.primary }}>
                      {pkg.price} <span className="text-lg">EGP</span>
                    </HeadlineMedium>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Check size={18} style={{ color: colors.secondary, flexShrink: 0 }} />
                    <BodySmall style={{ color: colors.onSurface }}>{pkg.max_places} مكان/خدمة</BodySmall>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={18} style={{ color: colors.secondary, flexShrink: 0 }} />
                    <BodySmall style={{ color: colors.onSurface }}>{pkg.max_product_images} صورة لكل منتج</BodySmall>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={18} style={{ color: colors.secondary, flexShrink: 0 }} />
                    <BodySmall style={{ color: colors.onSurface }}>{pkg.max_product_videos} فيديو لكل منتج</BodySmall>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={18} style={{ color: colors.secondary, flexShrink: 0 }} />
                    <BodySmall style={{ color: colors.onSurface }}>{pkg.max_place_videos} فيديو للمكان</BodySmall>
                  </div>
                  {pkg.is_featured && (
                    <div className="flex items-center gap-2">
                      <Crown size={18} style={{ color: colors.warning, flexShrink: 0 }} />
                      <BodySmall style={{ color: colors.onSurface }}>ظهور مميز في الصفحة الرئيسية</BodySmall>
                    </div>
                  )}
                </div>

                <Button
                  variant="filled"
                  fullWidth
                  disabled={disabled}
                  onClick={() => handleSubscribeClick(pkg)}
                  style={disabled ? { background: colors.surfaceVariant, color: colors.onSurfaceVariant } : undefined}
                >
                  {isCurrentPackage
                    ? 'الباقة الحالية'
                    : currentSubscription
                    ? 'لديك اشتراك نشط'
                    : 'اشترك الآن'}
                </Button>
              </div>
            )
          })}
        </div>

        {packages.length === 0 && (
          <div className="text-center py-12">
            <BodyMedium color="onSurfaceVariant">لا توجد باقات متاحة حالياً</BodyMedium>
          </div>
        )}

        {/* Receipt Upload Modal */}
        {showReceiptModal && selectedPackage && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: colors.overlay }}
          >
            <div
              className="shadow-xl max-w-md w-full p-6 rounded-3xl"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <TitleLarge style={{ color: colors.onSurface }}>رفع إيصال الدفع</TitleLarge>
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiptModal(false)
                    setReceiptFile(null)
                    setReceiptPreview(null)
                  }}
                  className="p-2 rounded-full transition-opacity hover:opacity-80"
                  style={{ color: colors.onSurfaceVariant }}
                  aria-label="إغلاق"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-4">
                <BodyMedium color="onSurfaceVariant" className="mb-2">
                  الباقة: <span style={{ color: colors.onSurface, fontWeight: 600 }}>{selectedPackage.name_ar}</span>
                </BodyMedium>
                <BodyMedium color="onSurfaceVariant">
                  المبلغ: <span style={{ color: colors.onSurface, fontWeight: 600 }}>{selectedPackage.price} EGP</span>
                </BodyMedium>
              </div>

              <div className="mb-4">
                <LabelMedium style={{ color: colors.onSurface }} className="block mb-2">
                  رفع صورة إيصال الدفع <span style={{ color: colors.error }}>*</span>
                </LabelMedium>
                <BodySmall color="onSurfaceVariant" className="block mb-2">(إلزامي - مطلوب للموافقة على الاشتراك)</BodySmall>
                {receiptPreview ? (
                  <div className="relative">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="w-full h-64 object-contain rounded-2xl"
                      style={{ border: `1px solid ${colors.outline}` }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveReceipt}
                      className="absolute top-2 left-2 p-2 rounded-full transition-opacity hover:opacity-90"
                      style={{ backgroundColor: colors.error, color: colors.onPrimary }}
                      aria-label="إزالة الصورة"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <label
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-opacity hover:opacity-90"
                    style={{ borderColor: colors.outline, backgroundColor: colors.surfaceContainer }}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload size={48} className="mb-2" style={{ color: colors.onSurfaceVariant }} />
                      <BodyMedium color="onSurfaceVariant" className="mb-2">
                        <span style={{ color: colors.onSurface, fontWeight: 600 }}>اضغط للرفع</span> أو اسحب الصورة هنا
                      </BodyMedium>
                      <BodySmall color="onSurfaceVariant">PNG, JPG, GIF (MAX. 10MB)</BodySmall>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleReceiptChange}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outlined"
                  fullWidth
                  disabled={uploadingReceipt}
                  onClick={() => {
                    setShowReceiptModal(false)
                    setReceiptFile(null)
                    setReceiptPreview(null)
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  variant="filled"
                  fullWidth
                  loading={uploadingReceipt}
                  disabled={!receiptFile || uploadingReceipt}
                  onClick={() => handleSubscribe(selectedPackage)}
                >
                  {uploadingReceipt ? 'جاري الرفع...' : 'إرسال الطلب'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
