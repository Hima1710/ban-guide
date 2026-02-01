/**
 * هوك مجموع مشاهدات الأماكن — اليوم + الإجمالي (نفس منطق الكروت).
 * للعرض في الهيدر.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { getPlacesViewsStats } from '@/lib/api/places'

export interface UsePlacesViewsStatsReturn {
  today: number
  total: number
  refresh: () => Promise<void>
}

export function usePlacesViewsStats(): UsePlacesViewsStatsReturn {
  const [today, setToday] = useState(0)
  const [total, setTotal] = useState(0)

  const fetchStats = useCallback(async () => {
    try {
      const stats = await getPlacesViewsStats()
      setToday(stats.today)
      setTotal(stats.total)
    } catch {
      setToday(0)
      setTotal(0)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onFocus = () => fetchStats()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchStats])

  return { today, total, refresh: fetchStats }
}
