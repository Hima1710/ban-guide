/**
 * Central export point for all custom hooks
 */

export { useAuthContext } from '../contexts/AuthContext'
export { useTheme } from '../contexts/ThemeContext'
export { useAffiliate } from './useAffiliate'
export { useNotifications } from './useNotifications'
export { usePlaces, usePlace } from './usePlaces'
export { useConversationsManager } from './useConversationsManager'
export { useMessages } from './useMessages'
export { useProducts } from './useProducts'
export { useAdminManager } from './useAdminManager'
export { useAffiliateManager } from './useAffiliateManager'
export { useUnifiedFeed } from './useUnifiedFeed'
export type { EntityType, UnifiedFeedItem, PlaceFeedItem, PostFeedItem, ProductFeedItem, UseUnifiedFeedOptions, UseUnifiedFeedReturn } from './useUnifiedFeed'

// Add other hooks as they are created
