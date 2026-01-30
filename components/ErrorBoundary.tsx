'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'

/** Fixed colors for error fallback so it works without ThemeProvider (e.g. when error is caught above ThemeProvider). */
const FALLBACK_COLORS = {
  background: '#ffffff',
  surface: '#f5f5f5',
  surfaceContainer: '#e5e5e7',
  onSurface: '#1c1c1e',
  onSurfaceVariant: '#49454f',
  error: '#b3261e',
  errorContainer: '#fdecea',
  warning: '#7d5700',
  outline: '#79747e',
  primary: '#6750a4',
}

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
  const c = FALLBACK_COLORS

  if (level === 'global') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: c.background }}>
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <AlertTriangle size={64} className="mx-auto mb-4" style={{ color: c.error }} />
            <p className="text-xl font-semibold mb-2" style={{ color: c.onSurface }}>عذراً، حدث خطأ غير متوقع</p>
            <p className="text-base mb-4" style={{ color: c.onSurfaceVariant }}>نعتذر عن الإزعاج. يرجى المحاولة مرة أخرى.</p>
          </div>
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mb-6 text-left p-4 rounded" style={{ backgroundColor: c.surface, border: `1px solid ${c.outline}` }}>
              <p className="text-sm font-mono mb-2" style={{ color: c.error }}>{error.toString()}</p>
              {errorInfo && (
                <details className="text-xs" style={{ color: c.onSurfaceVariant }}>
                  <summary className="cursor-pointer mb-2">Component Stack</summary>
                  <pre className="whitespace-pre-wrap overflow-x-auto">{errorInfo.componentStack}</pre>
                </details>
              )}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onReload}
              className="w-full py-3 px-4 rounded-full font-medium flex items-center justify-center gap-2"
              style={{ backgroundColor: c.primary, color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              <RefreshCcw size={20} />
              إعادة تحميل الصفحة
            </button>
            <button
              type="button"
              onClick={onGoHome}
              className="w-full py-3 px-4 rounded-full font-medium flex items-center justify-center gap-2 border"
              style={{ backgroundColor: c.surfaceContainer, color: c.onSurface, borderColor: c.outline, cursor: 'pointer' }}
            >
              <Home size={20} />
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (level === 'section') {
    return (
      <div className="p-6 rounded-lg" style={{ backgroundColor: c.surface, border: `1px solid ${c.outline}` }}>
        <div className="flex items-start gap-4">
          <AlertTriangle size={24} className="flex-shrink-0 mt-1" style={{ color: c.warning }} />
          <div className="flex-1">
            <p className="text-xl font-semibold mb-2" style={{ color: c.onSurface }}>فشل في تحميل هذا القسم</p>
            <p className="text-sm mb-4" style={{ color: c.onSurfaceVariant }}>حدث خطأ أثناء تحميل هذا الجزء من الصفحة</p>
            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-4 p-3 rounded" style={{ backgroundColor: c.errorContainer, border: `1px solid ${c.error}` }}>
                <p className="text-sm font-mono" style={{ color: c.error }}>{error.toString()}</p>
              </div>
            )}
            <button
              type="button"
              onClick={onReset}
              className="py-2 px-4 rounded-full text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: c.primary, color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              <RefreshCcw size={16} />
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 rounded" style={{ backgroundColor: c.surface, border: `1px solid ${c.warning}` }}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={16} style={{ color: c.warning }} />
        <p className="text-base font-semibold" style={{ color: c.onSurface }}>فشل في التحميل</p>
      </div>
      {process.env.NODE_ENV === 'development' && error && (
        <p className="text-xs mb-2 font-mono" style={{ color: c.error }}>{error.message}</p>
      )}
      <button
        type="button"
        onClick={onReset}
        className="text-xs hover:underline"
        style={{ color: c.primary, background: 'none', border: 'none', cursor: 'pointer' }}
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
