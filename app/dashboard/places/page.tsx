'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageSkeleton } from '@/components/common'

export default function PlacesRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return <PageSkeleton variant="dashboard" />
}
