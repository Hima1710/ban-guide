/**
 * HeaderContext — سياق الهيدر الموحد
 *
 * يوفر للصفحات إمكانية تعيين محتوى الشريط الفرعي (subHeader) — ستوريز، فلاتر، تابات —
 * ويوفر حالة الإظهار/الإخفاء (showSubHeader) المحسوبة من useHeaderTransform.
 *
 * يجب أن يكون HeaderProvider داخل ScrollContainerContext حتى يعمل useHeaderTransform.
 * SmartTopBar يقرأ من هذا السياق ويعرض الشريط الفرعي مع انتقال collapse.
 */

'use client'

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useHeaderTransform } from '@/hooks/useHeaderTransform'

export interface HeaderContextValue {
  /** المحتوى المعروض تحت الهيدر الرئيسي (ستوريز، فلاتر، تابات) */
  subHeader: ReactNode
  /** تعيين محتوى الشريط الفرعي — تستدعيه الصفحة في useEffect */
  setSubHeader: (node: ReactNode) => void
  /** true = إظهار الشريط الفرعي، false = إخفاؤه (حسب التمرير) */
  showSubHeader: boolean
}

const HeaderContext = createContext<HeaderContextValue | null>(null)

export function useHeaderContext(): HeaderContextValue | null {
  return useContext(HeaderContext)
}

interface HeaderProviderProps {
  children: ReactNode
  /** خيارات useHeaderTransform (عتبات التمرير، التهدئة، إلخ) */
  headerTransformOptions?: Parameters<typeof useHeaderTransform>[0]
}

export function HeaderProvider({
  children,
  headerTransformOptions,
}: HeaderProviderProps) {
  const [subHeader, setSubHeader] = useState<ReactNode>(null)
  const { showSubHeader } = useHeaderTransform(headerTransformOptions)

  const value: HeaderContextValue = {
    subHeader,
    setSubHeader,
    showSubHeader,
  }

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  )
}

export { HeaderContext }
