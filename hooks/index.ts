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
export { useEntityCounts } from './useEntityCounts'
export type { UseEntityCountsOptions, UseEntityCountsReturn } from './useEntityCounts'
export { useSiteStats } from './useSiteStats'
export type { UseSiteStatsReturn } from './useSiteStats'
export { usePlacesViewsStats } from './usePlacesViewsStats'
export type { UsePlacesViewsStatsReturn } from './usePlacesViewsStats'
