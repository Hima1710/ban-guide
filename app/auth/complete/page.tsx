'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/contexts/ThemeContext'

/**
 * Client-side auth completion page (no conflict with /auth/callback route).
 * When the Android app loads ban-app://auth-callback (or our origin/auth/complete) with
 * the OAuth fragment (#access_token=...), the Supabase client (detectSessionInUrl: true)
 * parses the URL and establishes the session. onAuthStateChange then fires SIGNED_IN.
 * We redirect to / immediately so the user lands on the home page.
 */
export default function AuthCompletePage() {
  const router = useRouter()
  const { colors } = useTheme()

  useEffect(() => {
    const redirectIfSignedIn = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          router.replace('/')
        }
      })
    }

    redirectIfSignedIn()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        router.replace('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: colors.background }}
    >
      <p className="text-body-medium text-on-surface-variant">جاري إكمال تسجيل الدخول...</p>
    </div>
  )
}
