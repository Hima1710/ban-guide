'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PageSkeleton } from '@/components/common'

/** مفتاح تخزين code_verifier في sessionStorage (نفس منطق Supabase) — إن لم يوجد لا نرسل طلب التبادل فنمنع 400 */
function getCodeVerifierFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!url) return null
  try {
    const hostname = new URL(url).hostname
    const storageKey = `sb-${hostname.split('.')[0]}-auth-token`
    const raw = sessionStorage.getItem(`${storageKey}-code-verifier`)
    const verifier = (raw ?? '').split('/')[0]?.trim()
    return verifier || null
  } catch {
    return null
  }
}

/**
 * Auth callback page — يعمل من جانب العميل (مهم لـ WebView/Android مع PKCE).
 *
 * عندما يفتح المستخدم OAuth في Chrome ثم يعود إلى التطبيق، Android يحمّل
 * https://ban-guide.vercel.app/auth/callback?code=... داخل WebView.
 * الـ code_verifier مخزّن في نفس الـ WebView من بداية التدفق، لذلك التبادل
 * يجب أن يحدث هنا (عميل) وليس على السيرفر.
 */
function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'exchanging' | 'done' | 'error'>('exchanging')
  const ranRef = useRef(false)

  useEffect(() => {
    const code = searchParams.get('code')?.trim() || ''
    const hash = typeof window !== 'undefined' ? window.location.hash : ''

    const run = async () => {
      // لا نستدعي التبادل إلا إذا وُجد code (تأتي من OAuth redirect). إن فُتحت الصفحة مباشرة أو بعد تحديث، نوجّه لصفحة الدخول.
      if (code) {
        // منع التشغيل المزدوج (React Strict Mode يفعّل الـ effect مرتين) — الاستدعاء الثاني يستهلك code_verifier ويسبب 400
        if (ranRef.current) return
        ranRef.current = true

        // إن لم يوجد code_verifier — نوجّه لصفحة الدخول دون إظهار رسالة خطأ (نبقي على «جاري إكمال...» حتى التوجيه)
        if (!getCodeVerifierFromStorage()) {
          router.replace('/auth/login')
          return
        }

        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            const isVerifierMissing =
              error.message?.includes('code verifier') || error.message?.includes('non-empty')
            if (isVerifierMissing) {
              router.replace('/auth/login')
            } else {
              console.error('[auth/callback] exchangeCodeForSession error:', error)
              router.replace('/?auth_error=1')
            }
            return
          }
          const user = data?.user
          if (user) {
            const profileRow = {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              avatar_url: user.user_metadata?.avatar_url || null,
              is_admin: false,
              is_affiliate: false,
            }
            await supabase.from('user_profiles').upsert(profileRow as never, { onConflict: 'id' })

            try {
              const { data: existing } = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', user.id)
                .limit(1)
              const isFirst = !(existing as unknown[] | null)?.length
              const rpcParams = {
                p_user_id: user.id,
                p_title_ar: isFirst ? 'مرحباً بك في بان! 🎉' : 'مرحباً بعودتك! 👋',
                p_title_en: isFirst ? 'Welcome to BAN! 🎉' : 'Welcome back! 👋',
                p_message_ar: isFirst
                  ? 'نحن سعداء بانضمامك إلينا. استكشف الأماكن والخدمات القريبة منك الآن!'
                  : 'سعداء برؤيتك مجدداً. تحقق من التحديثات الجديدة!',
                p_message_en: isFirst
                  ? 'We are happy to have you join us. Explore nearby stores and pharmacies now!'
                  : 'Happy to see you again. Check out the new updates!',
                p_type: 'system',
                p_link: '/dashboard',
              }
              await supabase.rpc('send_notification', rpcParams as never)
            } catch {
              // لا نفشل تسجيل الدخول إذا فشل الإشعار
            }
          }
          setStatus('done')
          router.replace('/?_=' + Date.now())
        } catch (err) {
          console.error('[auth/callback] Unexpected error:', err)
          router.replace('/?auth_error=1')
        }
        return
      }

      // دعم implicit/hash: #access_token=...
      if (hash && (hash.includes('access_token=') || hash.includes('refresh_token='))) {
        setStatus('done')
        router.replace('/?_=' + Date.now())
        return
      }

      // فتح الصفحة بدون code ولا hash (مثلاً زيارة مباشرة أو تحديث) — نوجّه لصفحة الدخول بدون رسالة خطأ
      router.replace('/auth/login')
    }

    run()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      {status === 'exchanging' && (
        <p className="text-body-large text-on-surface-variant">جاري إكمال تسجيل الدخول...</p>
      )}
      {status === 'error' && (
        <p className="text-body-large text-error">حدث خطأ. جرب مرة أخرى.</p>
      )}
      {status === 'done' && (
        <p className="text-body-large text-on-surface-variant">تم تسجيل الدخول. جاري التحويل...</p>
      )}
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="default" />}>
      <CallbackContent />
    </Suspense>
  )
}
