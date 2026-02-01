/**
 * API التفاعلات — أعداد الإعجابات (ولاحقاً المفضلة إن احتجنا).
 * الجدول: interactions (entity_id, entity_type, user_id, type) — عمود النوع اسمه type في الداتابيز.
 * النظام الموحد: تسمية snake_case، معاملات الدوال بـ p_ عند RPC.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export type InteractionEntityType = 'post' | 'product' | 'place'

const BATCH_SIZE = 20

/**
 * جلب عدد الإعجابات لعدة entities — دفعات صغيرة + تصفية في JS.
 */
export async function getLikeCounts(
  entityIds: string[],
  entityType: InteractionEntityType
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured() || !entityIds.length) return {}

  const uniq = [...new Set(entityIds)]
  const counts: Record<string, number> = {}
  for (const id of uniq) counts[id] = 0

  try {
    for (let i = 0; i < uniq.length; i += BATCH_SIZE) {
      const batch = uniq.slice(i, i + BATCH_SIZE)
      const { data: rows, error } = await supabase
        .from('interactions')
        .select('entity_id, type')
        .in('entity_id', batch)
        .eq('entity_type', entityType)

      if (error) return counts
      for (const r of rows || []) {
        const row = r as { entity_id: string; type: string }
        if (row.type === 'like' && row.entity_id in counts) counts[row.entity_id] += 1
      }
    }
  } catch {
    return counts
  }
  return counts
}
