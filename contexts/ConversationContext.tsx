'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { usePlaces } from '@/hooks'
import { useConversationsManager } from '@/hooks/useConversationsManager'
import type { Place } from '@/types'

export type OpenConversationFn = (placeId: string, partnerId: string) => void
export type CloseConversationFn = () => void

type ConversationManager = ReturnType<typeof useConversationsManager>

type ConversationContextValue = ConversationManager & {
  isDrawerOpen: boolean
  openConversation: OpenConversationFn
  closeConversation: CloseConversationFn
  userPlaces: Place[]
}

const ConversationContext = createContext<ConversationContextValue | null>(null)

export function ConversationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext()
  const { places: userPlaces } = usePlaces({ userId: user?.id, autoLoad: !!user })
  const manager = useConversationsManager({
    userId: user?.id ?? null,
    userPlaces: userPlaces ?? [],
  })

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const openConversation = useCallback<OpenConversationFn>(
    (placeId, partnerId) => {
      manager.selectConversation(partnerId, placeId)
      setIsDrawerOpen(true)
    },
    [manager]
  )

  const closeConversation = useCallback(() => {
    setIsDrawerOpen(false)
    manager.selectConversation(null, null)
    manager.setReplyingTo(null)
  }, [manager])

  const value: ConversationContextValue = {
    ...manager,
    isDrawerOpen,
    openConversation,
    closeConversation,
    userPlaces: userPlaces ?? [],
  }

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversationContext(): ConversationContextValue {
  const ctx = useContext(ConversationContext)
  if (!ctx) {
    throw new Error('useConversationContext must be used within ConversationProvider')
  }
  return ctx
}

export function useConversationContextOptional(): ConversationContextValue | null {
  return useContext(ConversationContext)
}
