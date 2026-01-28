'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { LabelSmall } from '@/components/m3'

/**
 * Version Badge Component
 * يعرض رقم الإصدار/الفرجن في الصفحة الرئيسية
 * يتغير مع كل deploy جديد
 */
export default function VersionBadge() {
  const { colors } = useTheme()
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    // استخدام build time من next.config.ts (يتم تعيينه في build time - كل build له timestamp مختلف)
    const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString()
    const date = new Date(buildTime)
    
    // Format: v-YYYY-MM-DD-HH-MM
    // مثال: v-2026-01-28-15-30
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    
    const versionStr = `v-${year}-${month}-${day}-${hour}-${minute}`
    setVersion(versionStr)
  }, [])

  if (!version) return null

  return (
    <div
      className="fixed bottom-2 left-2 px-2 py-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity z-50"
      style={{
        backgroundColor: colors.surfaceVariant,
        border: `1px solid ${colors.outline}`,
      }}
      title={`Build: ${version}`}
    >
      <LabelSmall color="onSurfaceVariant" className="font-mono text-[9px]">
        {version}
      </LabelSmall>
    </div>
  )
}
