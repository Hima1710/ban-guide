'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package } from '@/lib/types'
import { useAdminManager } from '@/hooks'
import { showError, showConfirm } from '@/components/SweetAlert'
import { Button, Input, Card, LoadingSpinner } from '@/components/common'
import { HeadlineLarge, BodySmall } from '@/components/m3'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminPackagesPage() {
  const router = useRouter()
  const { colors } = useTheme()
  const {
    isAdmin,
    loading: adminLoading,
    packages,
    packagesLoading,
    createPackage,
    updatePackage,
    deletePackage,
  } = useAdminManager({ autoLoadPackages: true })

  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    price: 0,
    max_places: 1,
    max_product_videos: 0,
    max_product_images: 5,
    max_place_videos: 1,
    priority: 0,
    card_style: 'default',
    is_featured: false,
  })

  // Redirect non-admin users
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      showError('ليس لديك صلاحيات للوصول إلى هذه الصفحة')
      router.push('/dashboard')
    }
  }, [isAdmin, adminLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const success = editingPackage
        ? await updatePackage(editingPackage.id, formData)
        : await createPackage(formData)
      if (success) {
        setShowForm(false)
        setEditingPackage(null)
        resetForm()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name_ar: '',
      name_en: '',
      price: 0,
      max_places: 1,
      max_product_videos: 0,
      max_product_images: 5,
      max_place_videos: 1,
      priority: 0,
      card_style: 'default',
      is_featured: false,
    })
  }

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg)
    setFormData({
      name_ar: pkg.name_ar,
      name_en: pkg.name_en,
      price: pkg.price,
      max_places: pkg.max_places,
      max_product_videos: pkg.max_product_videos,
      max_product_images: pkg.max_product_images,
      max_place_videos: pkg.max_place_videos,
      priority: pkg.priority,
      card_style: pkg.card_style || 'default',
      is_featured: pkg.is_featured,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm('هل أنت متأكد من حذف هذه الباقة؟')
    if (!confirmed.isConfirmed) return
    await deletePackage(id)
  }

  if (adminLoading || packagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <LoadingSpinner size="lg" text="جاري التحميل..." />
      </div>
    )
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
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <HeadlineLarge className="mb-2" style={{ color: colors.onSurface }}>إدارة الباقات</HeadlineLarge>
              <BodySmall color="onSurfaceVariant">إضافة وتعديل وحذف الباقات</BodySmall>
            </div>
            <Button
              variant="filled"
              onClick={() => {
                setShowForm(true)
                setEditingPackage(null)
                resetForm()
              }}
              className="flex items-center gap-2"
            >
              <Plus size={22} />
              إضافة باقة جديدة
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6" style={{ color: colors.onSurface }}>
              {editingPackage ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="الاسم بالعربية"
                  required
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="أدخل الاسم بالعربية"
                />
                <Input
                  label="الاسم بالإنجليزية"
                  required
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="Enter name in English"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="السعر"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
                <Input
                  label="عدد الأماكن"
                  type="number"
                  required
                  min="1"
                  value={formData.max_places}
                  onChange={(e) => setFormData({ ...formData, max_places: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
                <Input
                  label="الأولوية"
                  type="number"
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="فيديوهات المنتج"
                  type="number"
                  min="0"
                  value={formData.max_product_videos}
                  onChange={(e) => setFormData({ ...formData, max_product_videos: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <Input
                  label="صور المنتج"
                  type="number"
                  min="1"
                  value={formData.max_product_images}
                  onChange={(e) => setFormData({ ...formData, max_product_images: parseInt(e.target.value) || 5 })}
                  placeholder="5"
                />
                <Input
                  label="فيديوهات المكان"
                  type="number"
                  min="0"
                  value={formData.max_place_videos}
                  onChange={(e) => setFormData({ ...formData, max_place_videos: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: colors.onSurface }}>
                    نمط الكارت
                  </label>
                  <select
                    value={formData.card_style}
                    onChange={(e) => setFormData({ ...formData, card_style: e.target.value })}
                    className="w-full text-base rounded-extra-large px-4 py-2.5 border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                      color: colors.onSurface,
                    }}
                  >
                    <option value="default">افتراضي</option>
                    <option value="silver">فضي</option>
                    <option value="gold">ذهبي</option>
                    <option value="premium">مميز</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-8">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-6 h-6 rounded focus:ring-2 accent-primary"
                  />
                  <label htmlFor="is_featured" className="text-base font-semibold cursor-pointer" style={{ color: colors.onSurface }}>
                    باقة مميزة (تظهر في الأعلى)
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'جاري الحفظ...' : editingPackage ? 'تحديث الباقة' : 'إضافة الباقة'}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Card className="shadow-lg overflow-hidden" padding="none" style={{ border: `1px solid ${colors.outline}` }}>
          {packages.length === 0 ? (
            <div className="py-16 text-center" style={{ color: colors.onSurfaceVariant }}>
              <p className="text-lg font-medium mb-2">لا توجد باقات</p>
              <p className="text-sm mb-4">أضف باقة جديدة لتبدأ</p>
              <Button
                variant="filled"
                onClick={() => {
                  setShowForm(true)
                  setEditingPackage(null)
                  resetForm()
                }}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus size={20} />
                إضافة باقة جديدة
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead style={{ backgroundColor: colors.surface }}>
                <tr>
                  <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>الاسم</th>
                  <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>السعر</th>
                  <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>الأماكن</th>
                  <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>الأولوية</th>
                  <th className="px-6 py-4 text-right text-base font-bold" style={{ color: colors.onSurface }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    className="transition-colors"
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-base" style={{ color: colors.onSurface }}>{pkg.name_ar}</div>
                        <div className="text-sm mt-1" style={{ color: colors.onSurfaceVariant }}>{pkg.name_en}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-base font-bold" style={{ color: colors.primary }}>{pkg.price} EGP</span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-base" style={{ color: colors.onSurface }}>{pkg.max_places}</span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-base" style={{ color: colors.onSurface }}>{pkg.priority}</span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex gap-3">
                        <Button
                          variant="outlined"
                          size="sm"
                          onClick={() => handleEdit(pkg)}
                          className="!p-2"
                          title="تعديل"
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          variant="filled"
                          size="sm"
                          onClick={() => handleDelete(pkg.id)}
                          className="!p-2"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  )
}
