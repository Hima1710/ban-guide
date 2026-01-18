'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { showError, showSuccess } from '@/components/SweetAlert'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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
      <div className="app-card shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 app-text-main">تسجيل الدخول</h1>
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--primary-color)' }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '1')}
        >
          <LogIn size={20} />
          {loading ? 'جاري التحميل...' : 'تسجيل الدخول بحساب Google'}
        </button>
      </div>
    </div>
  )
}
