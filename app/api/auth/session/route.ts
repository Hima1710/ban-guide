import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * GET /api/auth/session
 * Returns the current session from server-side cookies.
 * Used when the client (e.g. WebView) cannot read cookies after OAuth redirect;
 * the server can read them and send the session back so the client can setSession().
 */
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) {
      return NextResponse.json({ session: null })
    }
    return NextResponse.json({ session })
  } catch {
    return NextResponse.json({ session: null })
  }
}
