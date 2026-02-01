/**
 * هوك إحصائيات زيارات الموقع — النظام الموحد.
 * يسجّل زيارة مرة واحدة لكل جلسة ويجلب اليوم/الإجمالي.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { getSiteStats, recordSiteVisit } from '@/lib/api/visits'

const SESSION_KEY = 'ban_site_visit_recorded'

export interface UseSiteStatsReturn {
  today: number
  total: number
  refresh: () => Promise<void>
}

export function useSiteStats(): UseSiteStatsReturn {
  const [today, setToday] = useState(0)
  const [total, setTotal] = useState(0)

  const fetchStats = useCallback(async () => {
    try {
      const stats = await getSiteStats()
      setToday(stats.today)
      setTotal(stats.total)
    } catch {
      setToday(0)
      setTotal(0)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const recorded = sessionStorage.getItem(SESSION_KEY)
    if (!recorded) {
      recordSiteVisit()
        .then(() => sessionStorage.setItem(SESSION_KEY, '1'))
        .catch(() => {})
    }
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
