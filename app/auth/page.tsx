import { redirect } from 'next/navigation'

/**
 * /auth يسبب 404 عند طلب Next.js له (_rsc).
 * نوجّه مباشرة لصفحة تسجيل الدخول.
 */
export default function AuthPage() {
  redirect('/auth/login')
}
