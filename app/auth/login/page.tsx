'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { showError, showSuccess } from '@/components/SweetAlert'
import { Card, Button } from '@/components/common'
import { useTheme } from '@/contexts/ThemeContext'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4" />
      <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853" />
      <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="#FBBC04" />
      <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { colors } = useTheme()
  const [loading, setLoading] = useState(false)
  const [receivedEmail, setReceivedEmail] = useState<string | null>(null)

  useEffect(() => {
    const handleGoogleAccountSelected = async (e: CustomEvent<{ email: string; accessToken?: string; idToken?: string }>) => {
      const email = e.detail?.email
      if (!email) return
      setReceivedEmail(email)
      setLoading(true)
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
        const redirectTo = `${siteUrl}/auth/callback`
        if (e.detail?.accessToken || e.detail?.idToken) {
          const { error } = await supabase.auth.setSession({
            access_token: e.detail.accessToken || '',
            refresh_token: '',
          } as any)
          if (error) throw error
          showSuccess(`تم تسجيل الدخول بنجاح: ${email}`)
          router.push('/')
          return
        }
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo, queryParams: { login_hint: email } },
        })
        if (error) throw error
      } catch (err: unknown) {
        showError((err as Error)?.message || 'حدث خطأ في تسجيل الدخول')
        setLoading(false)
      }
    }
    window.addEventListener('googleAccountSelected', handleGoogleAccountSelected as EventListener)
    return () => window.removeEventListener('googleAccountSelected', handleGoogleAccountSelected as EventListener)
  }, [router])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        setReceivedEmail(session.user.email)
        showSuccess('تم تسجيل الدخول بنجاح')
        router.push('/')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setReceivedEmail(session.user.email)
        showSuccess('تم تسجيل الدخول بنجاح')
        router.push('/')
      }
    })
  }, [router])

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const redirectTo = `${siteUrl}/auth/callback`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
      if (error) throw error
    } catch (err: unknown) {
      showError((err as Error)?.message || 'حدث خطأ في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: colors.background }}
    >
      <Card
        variant="elevated"
        elevation={2}
        padding="lg"
        className="w-full max-w-md"
      >
        <h1 className="text-headline-medium text-on-surface text-center mb-6">
          تسجيل الدخول
        </h1>

        {receivedEmail && (
          <div
            className="mb-6 p-4 rounded-extra-large text-center"
            style={{
              backgroundColor: 'var(--color-surface-dim)',
              border: '1px solid var(--color-outline)',
            }}
          >
            <p className="text-label-medium text-on-surface-variant mb-1">تم استقبال الإيميل:</p>
            <p className="text-body-medium text-on-surface font-medium break-all">{receivedEmail}</p>
          </div>
        )}

        <Button
          variant="filled"
          size="lg"
          fullWidth
          onClick={handleGoogleLogin}
          loading={loading}
        >
          {!loading && <GoogleIcon />}
          {loading ? 'جاري التحميل...' : 'تسجيل الدخول بحساب Google'}
        </Button>
      </Card>
    </div>
  )
}
