'use client'

import { PageSkeleton } from '@/components/common'

/**
 * يعرض سكيلتون أثناء تحميل مسارات لوحة التحكم — بدون نص "جاري التحميل".
 * يتوافق مع النظام الموحد (لا سبينر + نص في المحتوى الرئيسي).
 */
export default function DashboardLoading() {
  return <PageSkeleton variant="dashboard" />
}
