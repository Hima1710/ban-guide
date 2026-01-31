'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useAffiliate } from '@/hooks/useAffiliate'
import { formatDateTime } from '@/utils/helpers'
import { showError, showSuccess } from '@/components/SweetAlert'
import { PageSkeleton } from '@/components/common'
import { Button } from '@/components/m3'
import {
  Copy,
  CreditCard,
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  MapPin,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  CheckCircle
} from 'lucide-react'

export default function AffiliateDashboardPage() {
  const { colors } = useTheme()
  const { profile } = useAuthContext()
  const router = useRouter()
  const { affiliate, transactions, stats, loading, copyCode, requestWithdrawal } = useAffiliate()
  const [activeTab, setActiveTab] = useState<'earnings' | 'places'>('earnings')
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')

  // Get transaction type label and color
  const getTransactionStyle = (type: string) => {
    const styles: Record<string, { label: string; color: string; icon: any }> = {
      earning: { label: 'عمولة', color: colors.success, icon: ArrowUpRight },
      withdrawal: { label: 'سحب', color: colors.error, icon: ArrowDownRight },
      bonus: { label: 'مكافأة', color: colors.warning, icon: Gift },
      adjustment: { label: 'تعديل', color: colors.onSurfaceVariant, icon: CheckCircle }
    }
    return styles[type] || styles.earning
  }

  // Handle withdrawal request
  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount)
    if (isNaN(amount)) {
      showError('الرجاء إدخال مبلغ صحيح')
      return
    }

    const result = await requestWithdrawal(amount)
    if (result.success) {
      showSuccess('تم إرسال طلب السحب بنجاح! سيتم مراجعته قريباً.')
      setShowWithdrawalModal(false)
      setWithdrawalAmount('')
    } else {
      showError(result.error || 'فشل طلب السحب')
    }
  }

  if (loading) {
    return <PageSkeleton variant="dashboard" />
  }

  if (!affiliate) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: colors.background }}
      >
        <div 
          className="max-w-md w-full text-center p-8"
          style={{
            backgroundColor: colors.surface,
            borderRadius: '24px',
            border: `1px solid ${colors.outline}`
          }}
        >
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${colors.primary}20` }}
          >
            <TrendingUp size={40} style={{ color: colors.primary }} />
          </div>
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ color: colors.onSurface }}
          >
            أنت لست مسوقاً
          </h2>
          <p 
            className="mb-6"
            style={{ color: colors.onSurface }}
          >
            للحصول على حساب مسوق، يرجى التواصل مع الإدارة
          </p>
          <Button variant="filled" onClick={() => router.push('/dashboard')}>
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen py-6 px-4"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: colors.onSurface }}
          >
            لوحة المسوق 💰
          </h1>
          <p style={{ color: colors.onSurface }}>
            إدارة أرباحك وأماكنك من مكان واحد
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            onClick={() => setActiveTab('earnings')}
            variant={activeTab === 'earnings' ? 'filled' : 'outlined'}
            size="sm"
            className="whitespace-nowrap rounded-full"
            style={activeTab === 'earnings' ? {} : { borderColor: colors.outline, color: colors.onSurface }}
          >
            💰 أرباحي
          </Button>
          <Button
            onClick={() => setActiveTab('places')}
            variant={activeTab === 'places' ? 'filled' : 'outlined'}
            size="sm"
            className="whitespace-nowrap rounded-full"
            style={activeTab === 'places' ? {} : { borderColor: colors.outline, color: colors.onSurface }}
          >
            🏪 أماكني
          </Button>
        </div>

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Available Balance */}
              <div
                className="p-6 transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '24px',
                  border: `1px solid ${colors.outline}`
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.successContainer }}
                  >
                    <DollarSign size={24} style={{ color: colors.success }} />
                  </div>
                  <Button
                    onClick={() => setShowWithdrawalModal(true)}
                    disabled={stats.pendingBalance <= 0}
                    variant="filled"
                    size="sm"
                    className="!min-h-0 py-1.5 px-3 rounded-full text-xs"
                  >
                    سحب
                  </Button>
                </div>
                <p 
                  className="text-sm mb-1"
                  style={{ color: colors.onSurface }}
                >
                  الرصيد المتاح
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colors.onSurface }}
                >
                  {stats.pendingBalance.toFixed(2)} <span className="text-base">جنيه</span>
                </p>
              </div>

              {/* Total Earnings */}
              <div
                className="p-6 transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '24px',
                  border: `1px solid ${colors.outline}`
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: colors.infoContainer }}
                >
                  <TrendingUp size={24} style={{ color: colors.info }} />
                </div>
                <p 
                  className="text-sm mb-1"
                  style={{ color: colors.onSurface }}
                >
                  إجمالي الأرباح
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colors.onSurface }}
                >
                  {stats.totalEarnings.toFixed(2)} <span className="text-base">جنيه</span>
                </p>
              </div>

              {/* Referrals */}
              <div
                className="p-6 transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '24px',
                  border: `1px solid ${colors.outline}`
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: colors.warningContainer }}
                >
                  <Users size={24} style={{ color: colors.warning }} />
                </div>
                <p 
                  className="text-sm mb-1"
                  style={{ color: colors.onSurface }}
                >
                  المستخدمين المسجلين
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colors.onSurface }}
                >
                  {stats.totalReferrals}
                </p>
              </div>

              {/* Active Subscriptions */}
              <div
                className="p-6 transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '24px',
                  border: `1px solid ${colors.outline}`
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: colors.surfaceContainer }}
                >
                  <ShoppingBag size={24} style={{ color: colors.secondary }} />
                </div>
                <p 
                  className="text-sm mb-1"
                  style={{ color: colors.onSurface }}
                >
                  الاشتراكات النشطة
                </p>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: colors.onSurface }}
                >
                  {stats.activeSubscriptions}
                </p>
              </div>
            </div>

            {/* Affiliate Code Card */}
            <div
              className="p-6"
              style={{
                backgroundColor: colors.surface,
                borderRadius: '24px',
                border: `1px solid ${colors.outline}`
              }}
            >
              <h3 
                className="text-lg font-bold mb-4"
                style={{ color: colors.onSurface }}
              >
                كود التسويق الخاص بك
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div 
                  className="flex-1 px-4 py-4 rounded-2xl font-mono text-lg font-bold text-center"
                  style={{
                    backgroundColor: colors.surfaceContainer,
                    color: colors.primary
                  }}
                >
                  {affiliate.code}
                </div>
                <Button onClick={copyCode} variant="filled" size="md" className="inline-flex items-center justify-center gap-2">
                  <Copy size={20} />
                  <span className="hidden sm:inline">نسخ الكود</span>
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                <p 
                  className="text-sm"
                  style={{ color: colors.onSurface }}
                >
                  نسبة الخصم: <span className="font-bold" style={{ color: colors.onSurface }}>{affiliate.discount_percentage}%</span>
                </p>
              </div>
            </div>

            {/* Transactions Table */}
            <div
              className="overflow-hidden"
              style={{
                backgroundColor: colors.surface,
                borderRadius: '24px',
                border: `1px solid ${colors.outline}`
              }}
            >
              <div className="p-6 border-b" style={{ borderColor: colors.outline }}>
                <h3 
                  className="text-lg font-bold"
                  style={{ color: colors.onSurface }}
                >
                  سجل المعاملات
                </h3>
              </div>
              <div className="overflow-x-auto">
                {transactions.length === 0 ? (
                  <div className="p-12 text-center">
                    <CreditCard 
                      size={48} 
                      className="mx-auto mb-4" 
                      style={{ color: colors.onSurface, opacity: 0.5 }} 
                    />
                    <p style={{ color: colors.onSurface }}>
                      لا توجد معاملات بعد
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead style={{ backgroundColor: colors.outline }}>
                      <tr>
                        <th 
                          className="px-6 py-4 text-right text-xs font-medium uppercase"
                          style={{ color: colors.onSurface }}
                        >
                          النوع
                        </th>
                        <th 
                          className="px-6 py-4 text-right text-xs font-medium uppercase"
                          style={{ color: colors.onSurface }}
                        >
                          المبلغ
                        </th>
                        <th 
                          className="px-6 py-4 text-right text-xs font-medium uppercase"
                          style={{ color: colors.onSurface }}
                        >
                          الحالة
                        </th>
                        <th 
                          className="px-6 py-4 text-right text-xs font-medium uppercase"
                          style={{ color: colors.onSurface }}
                        >
                          التاريخ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction, index) => {
                        const style = getTransactionStyle(transaction.transaction_type)
                        const Icon = style.icon
                        return (
                          <tr 
                            key={transaction.id}
                            className="border-b transition-colors hover:bg-opacity-50"
                            style={{ 
                              borderColor: colors.outline,
                              backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.outline
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: `${style.color}20` }}
                                >
                                  <Icon size={16} style={{ color: style.color }} />
                                </div>
                                <span 
                                  className="font-medium text-sm"
                                  style={{ color: colors.onSurface }}
                                >
                                  {style.label}
                                </span>
                              </div>
                            </td>
                            <td 
                              className="px-6 py-4 font-bold"
                              style={{ color: colors.onSurface }}
                            >
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)} جنيه
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: transaction.status === 'completed' ? colors.successContainer : 
                                                  transaction.status === 'pending' ? colors.warningContainer : colors.errorContainer,
                                  color: transaction.status === 'completed' ? colors.success : 
                                        transaction.status === 'pending' ? colors.warning : colors.error
                                }}
                              >
                                {transaction.status === 'completed' ? 'مكتمل' : 
                                 transaction.status === 'pending' ? 'قيد المراجعة' : 'ملغي'}
                              </span>
                            </td>
                            <td 
                              className="px-6 py-4 text-sm"
                              style={{ color: colors.onSurface }}
                            >
                              {formatDateTime(transaction.created_at)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Places Tab */}
        {activeTab === 'places' && (
          <div className="space-y-6">
            <div
              className="p-8 text-center"
              style={{
                backgroundColor: colors.surface,
                borderRadius: '24px',
                border: `1px solid ${colors.outline}`
              }}
            >
              <MapPin 
                size={48} 
                className="mx-auto mb-4" 
                style={{ color: colors.primary }} 
              />
              <h3 
                className="text-xl font-bold mb-2"
                style={{ color: colors.onSurface }}
              >
                أماكني
              </h3>
              <p 
                className="mb-6"
                style={{ color: colors.onSurface }}
              >
                إدارة الصيدليات والمحلات والأماكن الخاصة بك
              </p>
              <Button
                onClick={() => router.push('/dashboard/places')}
                variant="filled"
                size="sm"
                className="inline-flex items-center gap-2"
              >
                <Plus size={20} />
                انتقل إلى أماكني
              </Button>
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {showWithdrawalModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: colors.overlay }}
            onClick={() => setShowWithdrawalModal(false)}
          >
            <div
              className="max-w-md w-full p-6"
              style={{
                backgroundColor: colors.surface,
                borderRadius: '24px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 
                className="text-xl font-bold mb-4"
                style={{ color: colors.onSurface }}
              >
                طلب سحب
              </h3>
              <p 
                className="text-sm mb-4"
                style={{ color: colors.onSurface }}
              >
                الرصيد المتاح: <span className="font-bold">{stats.pendingBalance.toFixed(2)} جنيه</span>
              </p>
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="المبلغ المطلوب"
                className="w-full px-4 py-3 rounded-2xl mb-4 border outline-none"
                style={{
                  backgroundColor: colors.outline,
                  borderColor: colors.outline,
                  color: colors.onSurface
                }}
              />
              <div className="flex gap-3">
                <Button onClick={handleWithdrawal} variant="filled" size="md" className="flex-1">
                  تأكيد
                </Button>
                <Button onClick={() => setShowWithdrawalModal(false)} variant="outlined" size="md" className="flex-1">
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
