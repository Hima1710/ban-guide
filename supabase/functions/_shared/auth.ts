/**
 * Authentication helpers for Supabase Edge Functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Get authenticated user from request
 */
export async function getAuthUser(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

/**
 * Require authentication for an Edge Function
 */
export async function requireAuth(request: Request) {
  const user = await getAuthUser(request)
  
  if (!user) {
    throw {
      message: 'غير مصرح. يرجى تسجيل الدخول',
      status: 401,
      code: 'UNAUTHORIZED',
    }
  }

  return user
}

/**
 * Check if user is admin
 */
export async function requireAdmin(request: Request) {
  const user = await requireAuth(request)
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    throw {
      message: 'غير مصرح. يجب أن تكون مديراً',
      status: 403,
      code: 'FORBIDDEN',
    }
  }

  return user
}
