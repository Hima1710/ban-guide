'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { TitleLarge, BodyMedium } from '@/components/m3'
import { Button } from '@/components/common'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'global' | 'section' | 'component'
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Prevents the entire app from crashing in Android WebView
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error('❌ [ERROR BOUNDARY] Caught error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      level: this.props.level || 'component',
    })

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to log to an error tracking service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      const { level = 'component' } = this.props
      return (
        <ErrorBoundaryFallback
          level={level}
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
        />
      )
    }
    return this.props.children
  }
}

function ErrorBoundaryFallback({
  level,
  error,
  errorInfo,
  onReset,
  onReload,
  onGoHome,
}: {
  level: string
  error: Error | null
  errorInfo: ErrorInfo | null
  onReset: () => void
  onReload: () => void
  onGoHome: () => void
}) {
  const { colors } = useTheme()

  if (level === 'global') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: colors.background }}>
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <AlertTriangle size={64} className="mx-auto mb-4" style={{ color: colors.error }} />
            <TitleLarge style={{ color: colors.onSurface }} className="mb-2">عذراً، حدث خطأ غير متوقع</TitleLarge>
            <BodyMedium color="onSurfaceVariant" className="mb-4">نعتذر عن الإزعاج. يرجى المحاولة مرة أخرى.</BodyMedium>
          </div>
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mb-6 text-left p-4 rounded" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}>
              <p className="text-sm font-mono mb-2" style={{ color: colors.error }}>{error.toString()}</p>
              {errorInfo && (
                <details className="text-xs" style={{ color: colors.onSurfaceVariant }}>
                  <summary className="cursor-pointer mb-2">Component Stack</summary>
                  <pre className="whitespace-pre-wrap overflow-x-auto">{errorInfo.componentStack}</pre>
                </details>
              )}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Button variant="filled" shape="large" fullWidth onClick={onReload} className="justify-center gap-2">
              <RefreshCcw size={20} />
              إعادة تحميل الصفحة
            </Button>
            <Button variant="filled-tonal" shape="large" fullWidth onClick={onGoHome} className="justify-center gap-2" style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurface }}>
              <Home size={20} />
              العودة للصفحة الرئيسية
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (level === 'section') {
    return (
      <div className="p-6 rounded-lg" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}>
        <div className="flex items-start gap-4">
          <AlertTriangle size={24} className="flex-shrink-0 mt-1" style={{ color: colors.warning }} />
          <div className="flex-1">
            <TitleLarge style={{ color: colors.onSurface }} className="mb-2">فشل في تحميل هذا القسم</TitleLarge>
            <BodyMedium color="onSurfaceVariant" className="mb-4 text-sm">حدث خطأ أثناء تحميل هذا الجزء من الصفحة</BodyMedium>
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-4 p-3 rounded" style={{ backgroundColor: colors.errorContainer, border: `1px solid ${colors.error}` }}>
                <p className="text-sm font-mono" style={{ color: colors.error }}>{error.toString()}</p>
              </div>
            )}
            <Button variant="filled" shape="large" size="sm" onClick={onReset} className="gap-2">
              <RefreshCcw size={16} />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 rounded" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.warning}` }}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={16} style={{ color: colors.warning }} />
        <BodyMedium style={{ color: colors.onSurface }} className="font-semibold">فشل في التحميل</BodyMedium>
      </div>
      {process.env.NODE_ENV === 'development' && error && (
        <p className="text-xs mb-2 font-mono" style={{ color: colors.error }}>{error.message}</p>
      )}
      <button
        type="button"
        onClick={onReset}
        className="text-xs hover:underline"
        style={{ color: colors.primary }}
      >
        إعادة المحاولة
      </button>
    </div>
  )
}

/**
 * Hook-based wrapper for Error Boundary (for functional components)
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}

export default ErrorBoundary
