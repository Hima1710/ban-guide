/**
 * سياق حاوية التمرير — يعرّض مرجع عنصر التمرير الرئيسي (main في AppShell).
 * يُستخدم مع VirtualList وغيرها عندما تحتاج مكوّنات الصفحة لمعرفة من يتحرك (scroll).
 * النظام الموحد: مرجع واحد من AppShell؛ الصفحات لا تنشئ حاويات تمرير مكررة.
 */

'use client'

import { createContext, useContext, type RefObject } from 'react'

export interface ScrollContainerContextValue {
  scrollContainerRef: RefObject<HTMLElement | null>
}

const ScrollContainerContext = createContext<ScrollContainerContextValue | null>(null)

export function useScrollContainer(): RefObject<HTMLElement | null> | null {
  const ctx = useContext(ScrollContainerContext)
  return ctx?.scrollContainerRef ?? null
}

export { ScrollContainerContext }
