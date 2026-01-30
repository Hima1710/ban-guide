import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Environment only — no hardcoded keys (security + single source of truth)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Singleton pattern to prevent multiple instances
let supabaseClient: ReturnType<typeof createClient> | ReturnType<typeof createClientComponentClient> | null = null
let supabaseAdminClient: ReturnType<typeof createClient> | null = null

// Client: createClientComponentClient (cookies) + supabase-js defaults: detectSessionInUrl: true so OAuth fragment (#access_token=...) is parsed when WebView loads ban-app://auth-callback or /auth/callback.
// Server: plain createClient for SSR.
export const supabase = (() => {
  if (typeof window !== 'undefined') {
    if (!supabaseClient) {
      supabaseClient = createClientComponentClient({
        supabaseUrl,
        supabaseKey: supabaseAnonKey,
      })
    }
    return supabaseClient
  } else {
    return createClient(supabaseUrl, supabaseAnonKey)
  }
})()

// Server-side client with service role
export const supabaseAdmin = (() => {
  if (typeof window !== 'undefined') {
    // Client-side: should not use service role
    return supabase
  } else {
    // Server-side: use singleton for admin
    if (!supabaseAdminClient) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
      supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey)
    }
    return supabaseAdminClient
  }
})()
