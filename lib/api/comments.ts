/**
 * API التعليقات — جلب وإدراج تعليقات وردود.
 * الجدول: comments (entity_id, entity_type, user_id, content, created_at, parent_id)
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export type CommentEntityType = 'post' | 'product' | 'place'

export interface Comment {
  id: string
  user_id: string
  entity_id: string
  entity_type: CommentEntityType
  content: string
  created_at: string
  parent_id: string | null
  /** من جدول user_profiles إن وُجد */
  author?: {
    full_name: string | null
    avatar_url: string | null
  }
  /** الردود على هذا التعليق (مُرتّبة حسب التاريخ) */
  replies?: Comment[]
  /** تعليق متفائل (Optimistic) — لم يُؤكد من الخادم بعد */
  optimistic?: boolean
}

/** صف خام من جدول comments (لربط نوع الاستعلام) */
interface CommentRow {
  id: string
  user_id: string
  entity_id: string
  entity_type: CommentEntityType
  content: string
  created_at: string
  parent_id: string | null
}

/** صف من user_profiles للتعليقات */
interface ProfileRow {
  id: string
  full_name: string | null
  avatar_url: string | null
}

/**
 * جلب التعليقات لـ entity. إن وُجد عمود parent_id (بعد تطبيق add_comments_parent_id.sql)
 * تُنظّم كشجرة؛ وإلا تُرجع قائمة مسطحة.
 */
export async function fetchComments(
  entityId: string,
  entityType: CommentEntityType
): Promise<Comment[]> {
  if (!isSupabaseConfigured() || !entityId) return []

  const selectCols = 'id,user_id,entity_id,entity_type,content,created_at,parent_id'
  const { data: rows, error } = await supabase
    .from('comments')
    .select(selectCols)
    .eq('entity_id', entityId)
    .eq('entity_type', entityType)
    .order('created_at', { ascending: true })

  if (error) return []
  const typedRows = (rows ?? []) as CommentRow[]
  if (!typedRows.length) return []

  const userIds = [...new Set(typedRows.map((r) => r.user_id))]
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds)

  const typedProfiles = (profiles ?? []) as ProfileRow[]
  const profileMap = new Map(
    typedProfiles.map((p) => [p.id, { full_name: p.full_name ?? null, avatar_url: p.avatar_url ?? null }])
  )

  const withAuthor = typedRows.map((r) => ({
    ...r,
    parent_id: r.parent_id ?? null,
    author: profileMap.get(r.user_id),
    replies: [] as Comment[],
  })) as Comment[]

  const byId = new Map(withAuthor.map((c) => [c.id, { ...c, replies: [] as Comment[] }]))
  const roots: Comment[] = []

  for (const c of withAuthor) {
    const node = byId.get(c.id)!
    if (!c.parent_id) {
      roots.push(node)
    } else {
      const parent = byId.get(c.parent_id)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(node)
      } else {
        roots.push(node)
      }
    }
  }

  return roots
}

/**
 * جلب عدد التعليقات (بما فيها الردود) لعدة entities دفعة واحدة — للنظام الموحد (هوك الأعداد).
 */
export async function getCommentsCounts(
  entityIds: string[],
  entityType: CommentEntityType
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured() || !entityIds.length) return {}

  const uniq = [...new Set(entityIds)]
  const { data: rows, error } = await supabase
    .from('comments')
    .select('entity_id')
    .in('entity_id', uniq)
    .eq('entity_type', entityType)

  if (error) return {}

  const counts: Record<string, number> = {}
  for (const id of uniq) counts[id] = 0
  for (const r of rows || []) {
    const eid = (r as { entity_id: string }).entity_id
    if (eid in counts) counts[eid] += 1
  }
  return counts
}

/**
 * إضافة تعليق أو رد — يتطلب مستخدماً مسجلاً.
 * parentId اختياري: عند الرد يُمرَّر معرّف التعليق الأب (بعد تطبيق add_comments_parent_id).
 */
export async function addComment(
  entityId: string,
  entityType: CommentEntityType,
  content: string,
  userId: string,
  parentId?: string | null
): Promise<{ id: string } | null> {
  if (!isSupabaseConfigured() || !entityId || !content.trim() || !userId) return null

  const payload = {
    user_id: userId,
    entity_id: entityId,
    entity_type: entityType,
    content: content.trim(),
    ...(parentId ? { parent_id: parentId } : {}),
  }

  const { data, error } = await supabase
    .from('comments')
    .insert(payload as never)
    .select('id')
    .single()

  if (error) return null
  return data ? { id: (data as { id: string }).id } : null
}
