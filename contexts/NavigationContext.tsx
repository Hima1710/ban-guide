'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface NavigationContextValue {
  /** التبويب المُختار تفاؤلياً (يُعرض ذهبياً فور الضغط قبل اكتمال التحميل) */
  optimisticTabId: string | null
  /** جاري التنقل — نعرض Skeleton حتى يصل pathname الجديد */
  isNavigating: boolean
  /** استدعاء عند الضغط على تبويب (تفعيل الحالة التفاؤلية + Skeleton) */
  startNavigation: (tabId: string) => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [optimisticTabId, setOptimisticTabId] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  const startNavigation = useCallback((tabId: string) => {
    setOptimisticTabId(tabId)
    setIsNavigating(true)
  }, [])

  useEffect(() => {
    setOptimisticTabId(null)
    setIsNavigating(false)
  }, [pathname])

  const value: NavigationContextValue = {
    optimisticTabId,
    isNavigating,
    startNavigation,
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigationContext() {
  return useContext(NavigationContext)
}
