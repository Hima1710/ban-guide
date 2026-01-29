'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, X } from 'lucide-react'
import { useTheme, type ThemeColors } from '@/contexts/ThemeContext'
import { useNotifications } from '@/hooks/useNotifications'
import { Notification } from '@/lib/types/database'
import { useRouter } from 'next/navigation'

interface NotificationBellProps {
  userId: string | undefined
}

const getNotificationStyle = (type: string, colors: ThemeColors): { icon: string; color: string } => {
  const icons: Record<string, string> = {
    message: '💬',
    subscription: '💳',
    employee_request: '👥',
    post: '📝',
    product: '🛍️',
    system: '⚙️',
    promotion: '🎁',
    payment: '💰',
  }
  const colorMap: Record<string, string> = {
    message: colors.info,
    subscription: colors.success,
    employee_request: colors.warning,
    post: colors.secondary,
    product: colors.primary,
    system: colors.onSurfaceVariant,
    promotion: colors.error,
    payment: colors.success,
  }
  return {
    icon: icons[type] ?? icons.system,
    color: colorMap[type] ?? colors.onSurfaceVariant,
  }
}

// Format time ago
const timeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'الآن'
  if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`
  if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`
  if (seconds < 604800) return `منذ ${Math.floor(seconds / 86400)} يوم`
  return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const { colors } = useTheme()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications(userId)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }

    // Navigate if there's a link
    if (notification.link) {
      router.push(notification.link)
      setIsOpen(false)
    }
  }

  if (!userId) return null

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full transition-all duration-200"
        style={{
          color: colors.onSurface,
          backgroundColor: isOpen ? colors.surfaceVariant : 'transparent'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = colors.surfaceVariant
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
        title="الإشعارات"
      >
        <Bell size={20} className="transition-transform" style={{
          transform: isOpen ? 'scale(1.1)' : 'scale(1)'
        }} />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1 animate-pulse"
            style={{
              backgroundColor: colors.error,
              color: colors.onPrimary,
              boxShadow: `0 2px 8px ${colors.error}40`
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute left-0 mt-2 w-96 max-w-[calc(100vw-2rem)] shadow-2xl border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.outline,
            borderRadius: '24px', // M3 rounded-3xl
            maxHeight: '80vh'
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.outline
            }}
          >
            <h3 
              className="text-base font-bold"
              style={{ color: colors.onSurface }}
            >
              الإشعارات
              {unreadCount > 0 && (
                <span
                  className="mr-2 text-sm font-medium"
                  style={{ color: colors.primary }}
                >
                  ({unreadCount} جديد)
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
                style={{
                  color: colors.primary,
                  backgroundColor: `rgba(${colors.primaryRgb}, 0.1)`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `rgba(${colors.primaryRgb}, 0.15)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `rgba(${colors.primaryRgb}, 0.1)`
                }}
              >
                <CheckCheck size={14} />
                تم قراءة الكل
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div 
            className="overflow-y-auto"
            style={{ maxHeight: 'calc(80vh - 80px)' }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div 
                  className="w-8 h-8 border-3 rounded-full animate-spin"
                  style={{
                    borderColor: colors.surfaceVariant,
                    borderTopColor: colors.primary
                  }}
                />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: colors.surfaceVariant }}
                >
                  <Bell size={28} style={{ color: colors.onSurface }} />
                </div>
                <p 
                  className="text-sm font-medium"
                  style={{ color: colors.onSurface }}
                >
                  لا توجد إشعارات
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: colors.outline }}>
                {notifications.map((notification) => {
                  const style = getNotificationStyle(notification.type, colors)
                  const isUnread = !notification.is_read

                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full text-right px-5 py-4 transition-all duration-200 hover:scale-[0.98]"
                      style={{
                        backgroundColor: isUnread 
                          ? `rgba(${colors.primaryRgb}, 0.05)` 
                          : 'transparent',
                        cursor: notification.link ? 'pointer' : 'default'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.surfaceVariant
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isUnread 
                          ? `rgba(${colors.primaryRgb}, 0.05)` 
                          : 'transparent'
                      }}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                          style={{ 
                            backgroundColor: `${style.color}20`,
                            color: style.color,
                          }}
                        >
                          {notification.icon || style.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 
                              className="text-sm font-semibold truncate"
                              style={{ color: colors.onSurface }}
                            >
                              {notification.title_ar}
                            </h4>
                            {isUnread && (
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                                style={{ backgroundColor: colors.primary }}
                              />
                            )}
                          </div>
                          <p 
                            className="text-xs line-clamp-2 mb-1"
                            style={{ color: colors.onSurface }}
                          >
                            {notification.message_ar}
                          </p>
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-[10px] font-medium"
                              style={{ color: colors.onSurface }}
                            >
                              {timeAgo(notification.created_at)}
                            </span>
                            {notification.priority === 'urgent' && (
                              <span 
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: `${colors.error}20`,
                                  color: colors.error
                                }}
                              >
                                عاجل
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer - View All */}
          {notifications.length > 0 && (
            <div 
              className="border-t px-5 py-3 text-center sticky bottom-0"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.outline
              }}
            >
              <button
                onClick={() => {
                  router.push('/dashboard')
                  setIsOpen(false)
                }}
                className="text-sm font-medium transition-colors"
                style={{ color: colors.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                عرض جميع الإشعارات
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
