import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/** Log exchangeCodeForSession errors for Logcat / debugging (PKCE or cookie sync issues). */
function logExchangeError(error: unknown) {
  const err = error && typeof error === 'object' ? error as Record<string, unknown> : {}
  const detail = {
    message: err?.message,
    status: err?.status,
    name: err?.name,
    ...err,
  }
  console.error('[auth/callback] exchangeCodeForSession error:', JSON.stringify(detail, null, 2))
  if (err?.message != null) console.error('[auth/callback] error.message:', err.message)
  if (err?.status != null) console.error('[auth/callback] error.status:', err.status)
}

/**
 * Auth callback when Android (or web) redirects to /auth/callback?code=...
 *
 * MUST:
 * 1. Await supabase.auth.exchangeCodeForSession(code) to establish the session.
 * 2. Set the session in cookies using sameSite: 'lax' so the WebView can store them.
 * 3. After successful exchange, redirect to / with Cache-Control so the UI does a fresh load and picks up the new session.
 *
 * Server-side only: this handler uses a route-handler Supabase client with cookies only (no client-side
 * PKCE verifier). If OAuth was started in an external browser, the code_verifier may be in a different
 * context and the exchange can fail (e.g. PKCE verification). For reliable WebView auth, consider
 * keeping the OAuth flow in the same WebView so the verifier is available, or use a server-side OAuth flow.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  let exchangeSuccess = false

  if (code) {
    try {
      const cookieStore = await cookies()
      // Server-side only: no client storage, no PKCE verifier from client (may fail after app-switch).
      const supabase = createRouteHandlerClient(
        { cookies: (() => cookieStore) as unknown as () => Promise<Awaited<ReturnType<typeof cookies>>> },
        {
          cookieOptions: {
            sameSite: 'lax',
            path: '/',
            domain: undefined,
            secure: process.env.NODE_ENV === 'production',
          },
        }
      )

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        logExchangeError(error)
      }

      if (!error) {
        exchangeSuccess = true
        // Create or update user profile
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { error: profileError } = await supabase.from('user_profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            is_admin: false,
            is_affiliate: false,
          }, {
            onConflict: 'id',
          })

          if (profileError) {
            console.error('Error creating/updating profile:', profileError)
          }

          // Send welcome notification
          try {
            // Check if user has any notifications (to determine if this is first login)
            const { data: existingNotifications } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', user.id)
              .limit(1)
            
            // Send welcome notification if no previous notifications (first login)
            if (!existingNotifications || existingNotifications.length === 0) {
              await supabase.rpc('send_notification', {
                p_user_id: user.id,
                p_title_ar: 'مرحباً بك في بان! 🎉',
                p_title_en: 'Welcome to BAN! 🎉',
                p_message_ar: 'نحن سعداء بانضمامك إلينا. استكشف المحلات والصيدليات القريبة منك الآن!',
                p_message_en: 'We are happy to have you join us. Explore nearby stores and pharmacies now!',
                p_type: 'system',
                p_link: '/dashboard'
              })
            } else {
              // Send login notification for returning users
              await supabase.rpc('send_notification', {
                p_user_id: user.id,
                p_title_ar: 'مرحباً بعودتك! 👋',
                p_title_en: 'Welcome back! 👋',
                p_message_ar: 'سعداء برؤيتك مجدداً. تحقق من التحديثات الجديدة!',
                p_message_en: 'Happy to see you again. Check out the new updates!',
                p_type: 'system',
                p_link: '/dashboard'
              })
            }
          } catch (error) {
            console.error('Error sending welcome notification:', error)
            // Don't fail the login if notification fails
          }
        }
        // Short delay before redirect so cookies are committed and WebView picks up session.
        await new Promise((r) => setTimeout(r, 250))
      }
    } catch (err) {
      console.error('[auth/callback] Unexpected error:', err)
      if (err && typeof err === 'object' && 'message' in err) {
        logExchangeError(err)
      }
    }
  }

  // Redirect to / with cache-busting so the client does a fresh load and picks up the new session (important for WebView/Android).
  const homeUrl = new URL('/', requestUrl.origin)
  homeUrl.searchParams.set('_', String(Date.now()))
  if (!exchangeSuccess) {
    homeUrl.searchParams.set('auth_error', '1')
  }
  const response = NextResponse.redirect(homeUrl)
  // Explicitly kill all cache so WebView/browser does not serve stale page and misses new session.
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Surrogate-Control', 'no-store')
  return response
}
