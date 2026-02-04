/**
 * Centralized export for all React contexts
 */

export { AuthProvider, useAuthContext } from './AuthContext'
export { ThemeProvider, useTheme } from './ThemeContext'
export { useScrollContainer, ScrollContainerContext } from './ScrollContainerContext'
export { HeaderProvider, useHeaderContext, HeaderContext } from './HeaderContext'

// Re-export for convenience
export type { ThemeColors } from './ThemeContext'
