'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { useAdminManager } from '@/hooks'
import { showError, showSuccess } from '@/components/SweetAlert'
import { PageSkeleton } from '@/components/common'
import Link from 'next/link'
import { Save, Globe, Eye } from 'lucide-react'
import { HeadlineLarge, TitleLarge, BodyMedium, BodySmall, LabelMedium, Button } from '@/components/m3'
import { Input } from '@/components/common'

export default function AdminSettingsPage() {
  const router = useRouter()
  const { colors } = useTheme()
  const { isAdmin, loading: adminLoading } = useAdminManager()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    siteName: 'دليل المحلات والصيدليات',
    siteDescription: 'دليل شامل للمحلات والصيدليات',
    siteEmail: '',
    maintenanceMode: false,
    allowRegistrations: true,
    enableNotifications: true,
    enableAnalytics: true,
  })

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      showError('ليس لديك صلاحيات للوصول إلى هذه الصفحة')
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router])

  useEffect(() => {
    if (isAdmin) loadSettings()
  }, [isAdmin])

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('admin_settings')
      if (saved) setSettings(JSON.parse(saved))
    } catch (e) {
      console.error('Error loading settings:', e)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save to localStorage (can be extended to save to database)
      localStorage.setItem('admin_settings', JSON.stringify(settings))
      showSuccess('تم حفظ الإعدادات بنجاح')
    } catch (error: any) {
      showError('حدث خطأ أثناء حفظ الإعدادات: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  if (adminLoading) {
    return <PageSkeleton variant="default" />
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div 
      className="min-h-screen py-8"
      style={{ backgroundColor: colors.background }}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/admin"
            className="mb-4 inline-block hover:underline"
            style={{ color: colors.primary }}
          >
            ← العودة للوحة الإدارة
          </Link>
          <HeadlineLarge className="mb-2" style={{ color: colors.onSurface }}>إعدادات النظام</HeadlineLarge>
          <BodySmall color="onSurfaceVariant">إدارة إعدادات النظام العامة</BodySmall>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <div
            className="rounded-2xl shadow-lg p-6"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Globe size={24} style={{ color: colors.primary }} />
              <TitleLarge style={{ color: colors.onSurface }}>الإعدادات العامة</TitleLarge>
            </div>
            <div className="space-y-4">
              <div>
                <LabelMedium style={{ color: colors.onSurface }} className="block mb-2">
                  اسم الموقع
                </LabelMedium>
                <Input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <LabelMedium style={{ color: colors.onSurface }} className="block mb-2">
                  وصف الموقع
                </LabelMedium>
                <textarea
                  value={settings.siteDescription}
                  onChange={(e) => handleChange('siteDescription', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border-2 transition-colors focus:outline-none"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.outline,
                    color: colors.onSurface,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.outline
                  }}
                />
              </div>
              <div>
                <LabelMedium style={{ color: colors.onSurface }} className="block mb-2">
                  البريد الإلكتروني للموقع
                </LabelMedium>
                <Input
                  type="email"
                  value={settings.siteEmail}
                  onChange={(e) => handleChange('siteEmail', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div
            className="rounded-3xl shadow-lg p-6"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Eye size={24} style={{ color: colors.primary }} />
              <TitleLarge style={{ color: colors.onSurface }}>إعدادات النظام</TitleLarge>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <LabelMedium style={{ color: colors.onSurface }} className="block">وضع الصيانة</LabelMedium>
                  <BodySmall color="onSurfaceVariant" className="text-xs">إغلاق الموقع للصيانة (للمستخدمين العاديين فقط)</BodySmall>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`toggle-switch ${settings.maintenanceMode ? 'checked' : ''}`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <LabelMedium style={{ color: colors.onSurface }} className="block">السماح بالتسجيل</LabelMedium>
                  <BodySmall color="onSurfaceVariant" className="text-xs">السماح للمستخدمين الجدد بالتسجيل</BodySmall>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowRegistrations}
                    onChange={(e) => handleChange('allowRegistrations', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`toggle-switch ${settings.allowRegistrations ? 'checked' : ''}`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <LabelMedium style={{ color: colors.onSurface }} className="block">تفعيل الإشعارات</LabelMedium>
                  <BodySmall color="onSurfaceVariant" className="text-xs">إرسال إشعارات للمستخدمين</BodySmall>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableNotifications}
                    onChange={(e) => handleChange('enableNotifications', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`toggle-switch ${settings.enableNotifications ? 'checked' : ''}`}></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <LabelMedium style={{ color: colors.onSurface }} className="block">تفعيل التحليلات</LabelMedium>
                  <BodySmall color="onSurfaceVariant" className="text-xs">تتبع إحصائيات الموقع</BodySmall>
                </div>
                <label className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAnalytics}
                    onChange={(e) => handleChange('enableAnalytics', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`toggle-switch ${settings.enableAnalytics ? 'checked' : ''}`}></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              variant="filled"
              loading={saving}
              disabled={saving}
              onClick={handleSave}
              className="flex items-center gap-2"
            >
              <Save size={20} />
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
