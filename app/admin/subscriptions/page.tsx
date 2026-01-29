'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useAdminManager } from '@/hooks'
import { showError, showConfirm } from '@/components/SweetAlert'
import { LoadingSpinner } from '@/components/common'
import { Card } from '@/components/common'
import { HeadlineLarge, BodySmall, TitleLarge, Button } from '@/components/m3'
import Link from 'next/link'
import { Check, X, Eye } from 'lucide-react'

export default function AdminSubscriptionsPage() {
  const router = useRouter()
  const { colors } = useTheme()
  const {
    isAdmin,
    loading: adminLoading,
    subscriptions,
    subscriptionsLoading,
    loadSubscriptions,
    approveSubscription,
    rejectSubscription,
  } = useAdminManager({ autoLoadSubscriptions: true })

  const [selectedSubscription, setSelectedSubscription] = useState<any>(null)
  const [showImageModal, setShowImageModal] = useState(false)

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      showError('ليس لديك صلاحيات للوصول إلى هذه الصفحة')
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router])

  const handleApprove = async (subscription: any) => {
    const confirmed = await showConfirm(
      `هل أنت متأكد من الموافقة على اشتراك ${subscription.user?.full_name || subscription.user?.email || 'المستخدم'} في باقة ${subscription.package?.name_ar || ''}؟`
    )
    if (!confirmed.isConfirmed) return
    const ok = await approveSubscription(subscription.id)
    if (ok) {
      setShowImageModal(false)
      setSelectedSubscription(null)
    }
  }

  const handleReject = async (subscription: any) => {
    const confirmed = await showConfirm(
      `هل أنت متأكد من رفض اشتراك ${subscription.user?.full_name || subscription.user?.email || 'المستخدم'} في باقة ${subscription.package?.name_ar || ''}؟`
    )
    if (!confirmed.isConfirmed) return
    const ok = await rejectSubscription(subscription.id)
    if (ok) {
      setShowImageModal(false)
      setSelectedSubscription(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const base = 'px-3 py-1 rounded-full text-sm font-medium'
    switch (status) {
      case 'pending':
        return (
          <span
            className={base}
            style={{ backgroundColor: colors.warningContainer, color: colors.warning }}
          >
            قيد المراجعة
          </span>
        )
      case 'approved':
        return (
          <span
            className={base}
            style={{ backgroundColor: colors.successContainer, color: colors.success }}
          >
            موافق عليه
          </span>
        )
      case 'rejected':
        return (
          <span
            className={base}
            style={{ backgroundColor: colors.errorContainer, color: colors.error }}
          >
            مرفوض
          </span>
        )
      default:
        return (
          <span
            className={base}
            style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurfaceVariant }}
          >
            غير معروف
          </span>
        )
    }
  }

  if (adminLoading || subscriptionsLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <LoadingSpinner size="lg" text="جاري التحميل..." />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div
      className="min-h-screen py-8"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/admin"
            className="mb-4 inline-block hover:underline"
            style={{ color: colors.primary }}
          >
            ← العودة للوحة الإدارة
          </Link>
          <HeadlineLarge className="mb-2" style={{ color: colors.onSurface }}>
            مراجعة الاشتراكات
          </HeadlineLarge>
          <BodySmall color="onSurfaceVariant">
            مراجعة وتأكيد طلبات الاشتراك في الباقات
          </BodySmall>
        </div>

        <Card className="shadow-lg overflow-hidden" padding="none" style={{ border: `1px solid ${colors.outline}` }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: colors.surface }}>
                <tr>
                  <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>
                    المستخدم
                  </th>
                  <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>
                    الباقة
                  </th>
                  <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>
                    المبلغ
                  </th>
                  <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>
                    تاريخ الطلب
                  </th>
                  <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>
                    تاريخ الانتهاء
                  </th>
                  <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>
                    الإيصال
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.surfaceContainer
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.onSurface }}>
                      {sub.user?.full_name || sub.user?.email || 'مستخدم'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.onSurface }}>
                      {sub.package?.name_ar || 'باقة غير معروفة'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.onSurface }}>
                      {sub.amount_paid} EGP
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(sub.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.onSurfaceVariant }}>
                      {new Date(sub.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: colors.onSurfaceVariant }}>
                      {sub.expires_at
                        ? new Date(sub.expires_at).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'غير محدد'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {sub.receipt_image_url ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubscription(sub)
                            setShowImageModal(true)
                          }}
                          className="flex items-center gap-1 transition-opacity hover:opacity-80"
                          style={{ color: colors.primary }}
                        >
                          <Eye size={16} />
                          <span>عرض</span>
                        </button>
                      ) : (
                        <span style={{ color: colors.onSurfaceVariant }}>لا يوجد</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {subscriptions.length === 0 && (
            <div className="py-12 text-center" style={{ color: colors.onSurfaceVariant }}>
              <BodySmall>لا توجد اشتراكات</BodySmall>
            </div>
          )}
        </Card>

        {showImageModal && selectedSubscription && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ backgroundColor: colors.overlay }}
          >
            <div
              className="shadow-xl rounded-3xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <TitleLarge style={{ color: colors.onSurface }}>صورة إيصال الدفع</TitleLarge>
                <button
                  type="button"
                  onClick={() => {
                    setShowImageModal(false)
                    setSelectedSubscription(null)
                  }}
                  className="rounded-full p-2 transition-colors hover:opacity-80"
                  style={{ color: colors.onSurfaceVariant }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.surfaceContainer
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="mb-4 space-y-1">
                <BodySmall color="onSurfaceVariant">
                  <span className="font-semibold" style={{ color: colors.onSurface }}>المستخدم:</span>{' '}
                  {selectedSubscription.user?.full_name || selectedSubscription.user?.email || 'مستخدم'}
                </BodySmall>
                <BodySmall color="onSurfaceVariant">
                  <span className="font-semibold" style={{ color: colors.onSurface }}>الباقة:</span>{' '}
                  {selectedSubscription.package?.name_ar || 'باقة غير معروفة'}
                </BodySmall>
                <BodySmall color="onSurfaceVariant">
                  <span className="font-semibold" style={{ color: colors.onSurface }}>المبلغ:</span>{' '}
                  {selectedSubscription.amount_paid} EGP
                </BodySmall>
                {selectedSubscription.expires_at && (
                  <BodySmall color="onSurfaceVariant">
                    <span className="font-semibold" style={{ color: colors.onSurface }}>تاريخ الانتهاء:</span>{' '}
                    {new Date(selectedSubscription.expires_at).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </BodySmall>
                )}
              </div>
              {selectedSubscription.receipt_image_url && (
                <div className="rounded-3xl overflow-hidden mb-4" style={{ border: `1px solid ${colors.outline}` }}>
                  <img
                    src={selectedSubscription.receipt_image_url}
                    alt="إيصال"
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                </div>
              )}
              {selectedSubscription.status === 'pending' && (
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="filled"
                    onClick={() => handleApprove(selectedSubscription)}
                    className="flex-1 gap-2"
                    style={{ backgroundColor: colors.success, color: colors.onPrimary }}
                  >
                    <Check size={18} />
                    موافق
                  </Button>
                  <Button
                    variant="filled"
                    onClick={() => handleReject(selectedSubscription)}
                    className="flex-1 gap-2"
                    style={{ backgroundColor: colors.error, color: colors.onPrimary }}
                  >
                    <X size={18} />
                    رفض
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
