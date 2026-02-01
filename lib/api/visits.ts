import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function recordSiteVisit(visitorIp?: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase.from('site_visits').insert({
    visitor_ip: visitorIp,
  } as never)

  if (error) {
    console.error('Error recording site visit:', error)
  }
}

export async function getSiteStats(): Promise<{ today: number; total: number }> {
  if (!isSupabaseConfigured()) return { today: 0, total: 0 }
  const today = new Date().toISOString().split('T')[0]

  const { count: todayCount, error: todayError } = await supabase
    .from('site_visits')
    .select('id', { count: 'exact', head: true })
    .eq('visit_date', today)

  const { count: totalCount, error: totalError } = await supabase
    .from('site_visits')
    .select('id', { count: 'exact', head: true })

  if (todayError || totalError) {
    return { today: 0, total: 0 }
  }

  return {
    today: todayCount ?? 0,
    total: totalCount ?? 0,
  }
}
