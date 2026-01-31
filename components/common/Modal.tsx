'use client'

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { TitleLarge, Button } from '@/components/m3'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
}

/**
 * Reusable modal component (M3 theme-aware)
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
}: ModalProps) {
  const { colors } = useTheme()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--overlay-bg)' }}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={`w-full rounded-3xl ${sizeStyles[size]} max-h-[90vh] overflow-y-auto`}
        style={{ backgroundColor: colors.surface, borderWidth: 1, borderStyle: 'solid', borderColor: colors.outline }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between mb-4 pb-4 border-b"
          style={{ borderColor: colors.outline }}
        >
          {title && (
            <TitleLarge style={{ color: colors.onSurface }}>{title}</TitleLarge>
          )}
          <Button
            type="button"
            variant="text"
            size="sm"
            onClick={onClose}
            className="!min-h-0 !p-1 ml-auto"
            style={{ color: colors.onSurfaceVariant }}
            aria-label="إغلاق"
          >
            <X size={20} />
          </Button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
