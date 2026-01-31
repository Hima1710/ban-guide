'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminManager } from '@/hooks'
import { showError, showConfirm } from '@/components/SweetAlert'
import { PageSkeleton, Button, Card } from '@/components/common'
import { HeadlineLarge, BodySmall } from '@/components/m3'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'

export default function AdminAffiliatesPage() {
  const router = useRouter()
  const { colors } = useTheme()
  const {
    isAdmin,
    loading: adminLoading,
    affiliates,
    affiliatesLoading,
    updateAffiliate,
    deleteAffiliate,
  } = useAdminManager({ autoLoadAffiliates: true })

  // Redirect non-admin users
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      showError('ليس لديك صلاحيات للوصول إلى هذه الصفحة')
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router])

  const handleUpdateCode = async (affiliate: any) => {
    const newCode = window.prompt('أدخل كود تسويق جديد', affiliate.code || '')
    if (!newCode || newCode.trim() === affiliate.code) return

    const trimmedCode = newCode.trim().toUpperCase()
    await updateAffiliate(affiliate.id, { code: trimmedCode })
  }

  const handleUpdateDiscountPercentage = async (affiliate: any) => {
    const newPercentage = window.prompt('أدخل نسبة الخصم الجديدة (%)', affiliate.discount_percentage?.toString() || '0')
    if (!newPercentage || parseFloat(newPercentage) === affiliate.discount_percentage) return

    const percentage = parseFloat(newPercentage)
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      showError('يجب أن تكون النسبة بين 0 و 100')
      return
    }

    await updateAffiliate(affiliate.id, { discount_percentage: percentage })
  }

  const handleUpdateCommissionPercentage = async (affiliate: any) => {
    const newPercentage = window.prompt('أدخل نسبة العمولة الجديدة (%)', affiliate.commission_percentage?.toString() || '0')
    if (!newPercentage || parseFloat(newPercentage) === affiliate.commission_percentage) return

    const percentage = parseFloat(newPercentage)
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      showError('يجب أن تكون النسبة بين 0 و 100')
      return
    }

    await updateAffiliate(affiliate.id, { commission_percentage: percentage })
  }

  const handleToggleActive = async (affiliate: any) => {
    const action = affiliate.is_active ? 'تعطيل' : 'تفعيل'
    const confirmed = await showConfirm(`هل تريد ${action} هذا المسوق؟`)
    
    if (!confirmed.isConfirmed) return

    await updateAffiliate(affiliate.id, { is_active: !affiliate.is_active })
  }

  const handleDelete = async (affiliate: any) => {
    const confirmed = await showConfirm('هل أنت متأكد من حذف هذا المسوق؟')
    
    if (!confirmed.isConfirmed) return

    await deleteAffiliate(affiliate.id)
  }

  if (adminLoading || affiliatesLoading) {
    return <PageSkeleton variant="default" />
  }

  if (!isAdmin) {
    return null // Redirecting...
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
          <HeadlineLarge className="mb-2" style={{ color: colors.onSurface }}>إدارة المسوقين</HeadlineLarge>
          <BodySmall color="onSurfaceVariant">إدارة المسوقين بالعمولة والأكواد</BodySmall>
        </div>

        <Card className="shadow-lg overflow-hidden" padding="none" style={{ border: `1px solid ${colors.outline}` }}>
          <table className="w-full">
            <thead style={{ backgroundColor: colors.surface }}>
              <tr>
                <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>المستخدم</th>
                <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>الكود</th>
                <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>نسبة الخصم</th>
                <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>نسبة العمولة</th>
                <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>الأرباح</th>
                <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>الحالة</th>
                <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((affiliate) => (
                <tr
                  key={affiliate.id}
                  className="transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <td className="px-6 py-5">
                    <div>
                      <div className="font-semibold text-base" style={{ color: colors.onSurface }}>
                        {affiliate.user?.full_name || 'لا يوجد اسم'}
                      </div>
                      <div className="text-sm" style={{ color: colors.onSurfaceVariant }}>{affiliate.user?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => handleUpdateCode(affiliate)}
                      className="font-mono text-base hover:underline"
                      style={{ color: colors.primary }}
                    >
                      {affiliate.code}
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => handleUpdateDiscountPercentage(affiliate)}
                      className="text-base hover:underline"
                      style={{ color: colors.primary }}
                    >
                      {affiliate.discount_percentage}%
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => handleUpdateCommissionPercentage(affiliate)}
                      className="text-base hover:underline"
                      style={{ color: colors.primary }}
                    >
                      {affiliate.commission_percentage}%
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <div>
                      <div className="text-sm" style={{ color: colors.onSurfaceVariant }}>الإجمالي: {affiliate.total_earnings} EGP</div>
                      <div className="text-sm" style={{ color: colors.onSurfaceVariant }}>المستحقات: {affiliate.pending_earnings} EGP</div>
                      <div className="text-sm" style={{ color: colors.onSurfaceVariant }}>المدفوع: {affiliate.paid_earnings} EGP</div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => handleToggleActive(affiliate)}
                      className="px-3 py-1 rounded-lg text-sm font-semibold transition-all hover:scale-105"
                      style={{
                        backgroundColor: affiliate.is_active 
                          ? `${colors.success}20`
                          : `${colors.error}20`,
                        color: affiliate.is_active ? colors.success : colors.error,
                      }}
                    >
                      {affiliate.is_active ? 'نشط' : 'معطل'}
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <Button
                      variant="filled"
                      size="sm"
                      onClick={() => handleDelete(affiliate)}
                      className="!p-2"
                      title="حذف"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </td>
                </tr>
              ))}
              {affiliates.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center" style={{ color: colors.onSurfaceVariant }}>
                    لا يوجد مسوقين
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
