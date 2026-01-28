'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { showError, showSuccess } from '@/components/SweetAlert'
import { HeadlineMedium, BodyMedium, Button } from '@/components/m3'

// Google Logo SVG Component
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z" fill="#4285F4"/>
      <path d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z" fill="#34A853"/>
      <path d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z" fill="#FBBC04"/>
      <path d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [receivedEmail, setReceivedEmail] = useState<string | null>(null)

  // استمع لحدث تسجيل الدخول واستقبل الإيميل
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.email) {
          const email = session.user.email
          setReceivedEmail(email)
          showSuccess(`تم تسجيل الدخول بنجاح: ${email}`)
          router.push('/dashboard')
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [router])

  // تحقق من الجلسة الحالية عند تحميل الصفحة (بعد العودة من Google)
  const searchParams = useSearchParams()
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const email = session.user.email
        setReceivedEmail(email)
        const isFromCallback = searchParams?.get('success') === '1'
        if (isFromCallback) {
          showSuccess(`تم تسجيل الدخول بنجاح: ${email}`)
          setTimeout(() => router.push('/dashboard'), 1500)
        } else {
          router.push('/dashboard')
        }
      }
    })
  }, [router, searchParams])

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      // Use NEXT_PUBLIC_SITE_URL if available, otherwise use current origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const redirectTo = `${siteUrl}/auth/callback`
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })

      if (error) throw error
    } catch (error: any) {
      showError(error.message || 'حدث خطأ في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center app-bg-base">
      <div className="app-card shadow-lg p-8 max-w-md w-full rounded-3xl">
        <HeadlineMedium className="text-center mb-6">تسجيل الدخول</HeadlineMedium>

        {receivedEmail && (
          <div className="mb-4 p-3 rounded-2xl app-card app-border text-center">
            <BodyMedium color="onSurfaceVariant" className="text-sm mb-1">
              تم استقبال الإيميل:
            </BodyMedium>
            <BodyMedium className="font-medium break-all">{receivedEmail}</BodyMedium>
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
      </div>
    </div>
  )
}
