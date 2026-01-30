import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Lazy init so build (e.g. Vercel) doesn't fail when env is not yet available at import time.
// Client is created on first use; then NEXT_PUBLIC_SUPABASE_* must be set at runtime.

let supabaseClient: ReturnType<typeof createClient> | ReturnType<typeof createClientComponentClient> | null = null
let supabaseAdminClient: ReturnType<typeof createClient> | null = null

/** Use this to avoid throwing when env vars are missing (e.g. local dev without .env.local). */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return Boolean(url && key)
}

/** Chainable stub that resolves to empty result when awaited (used when Supabase env is missing). */
function createNoopChain() {
  const result = Promise.resolve({ data: null, error: null }) as Promise<{ data: unknown; error: null }>
  const chain = new Proxy(result, {
    get(_, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        const fn = (result as unknown as Record<string, (this: Promise<unknown>) => unknown>)[prop as string]
        return typeof fn === 'function' ? fn.bind(result) : undefined
      }
      return () => chain
    },
  })
  return chain
}

/** Stub client when env vars are missing — no throw, app keeps running with empty auth/data. */
function createStubClient(): ReturnType<typeof createClient> {
  const noopChain = createNoopChain()
  const emptyAuth = {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    setSession: () => Promise.resolve({ data: {}, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    exchangeCodeForSession: () => Promise.resolve({ data: { session: null, user: null }, error: null }),
  }
  return {
    auth: emptyAuth,
    from: () => noopChain,
    rpc: () => noopChain,
    channel: () => ({ on: () => ({ subscribe: () => {} }), unsubscribe: () => Promise.resolve() }),
    removeChannel: () => {},
    rest: {} as ReturnType<typeof createClient>['rest'],
    realtime: {} as ReturnType<typeof createClient>['realtime'],
    storage: {} as ReturnType<typeof createClient>['storage'],
    functions: {} as ReturnType<typeof createClient>['functions'],
    schema: () => noopChain,
  } as unknown as ReturnType<typeof createClient>
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  if (!url || !key) {
    supabaseClient = createStubClient()
    return supabaseClient
  }
  if (typeof window !== 'undefined') {
    supabaseClient = createClientComponentClient({
      supabaseUrl: url,
      supabaseKey: key,
    })
  } else {
    supabaseClient = createClient(url, key)
  }
  return supabaseClient
}

function getSupabaseAdminClient() {
  if (supabaseAdminClient) return supabaseAdminClient
  if (typeof window !== 'undefined') return getSupabaseClient()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  if (!url || !key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) are required for server admin. Set them in Vercel Environment Variables.'
    )
  }
  supabaseAdminClient = createClient(url, key)
  return supabaseAdminClient
}

// Export proxy so existing code (supabase.auth, supabase.from(...)) works unchanged; client is created on first access.
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return (getSupabaseClient() as unknown as Record<string, unknown>)[prop as string]
  },
})

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return (getSupabaseAdminClient() as unknown as Record<string, unknown>)[prop as string]
  },
})
