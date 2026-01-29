'use client'

import { Reply } from 'lucide-react'
import { MessageItemProps } from '@/types'
import { useTheme } from '@/contexts/ThemeContext'

export default function MessageItem({ message, isOwn, onReply, showSender = true }: MessageItemProps) {
  const { colors } = useTheme()
  return (
    <div className={`mb-3 ${isOwn ? 'text-left' : 'text-right'}`}>
      {showSender && message.sender && !isOwn && (
        <p className="text-xs mb-1" style={{ color: colors.onSurfaceVariant }}>
          {message.sender.full_name || message.sender.email || 'مستخدم'}
        </p>
      )}

      {message.replied_message && (
        <div
          className="text-xs p-2 rounded mb-1 border-r-2"
          style={{
            background: `rgba(${colors.primaryRgb}, 0.1)`,
            borderColor: colors.primary,
          }}
        >
          <p className="text-[10px] mb-0.5" style={{ color: colors.onSurfaceVariant }}>
            الرد على: {message.replied_message.sender?.full_name || 'مستخدم'}
          </p>
          {message.replied_message.content && (
            <p className="truncate" style={{ color: colors.onSurface }}>
              {message.replied_message.content}
            </p>
          )}
          {message.replied_message.image_url && !message.replied_message.content && (
            <p className="italic" style={{ color: colors.onSurfaceVariant }}>صورة</p>
          )}
          {message.replied_message.audio_url && !message.replied_message.content && !message.replied_message.image_url && (
            <p className="italic" style={{ color: colors.onSurfaceVariant }}>رسالة صوتية</p>
          )}
        </div>
      )}

      <div
        className={`inline-block max-w-[80%] p-3 rounded-lg ${
          isOwn ? 'rounded-br-none' : 'rounded-bl-none'
        }`}
        style={{
          background: isOwn ? colors.primary : colors.surface,
        }}
      >
        {message.content && (
          <p
            className="text-sm mb-0 whitespace-pre-wrap break-words"
            style={{ color: isOwn ? colors.onPrimary : colors.onSurface }}
          >
            {message.content}
          </p>
        )}

        {message.image_url && (
          <img
            src={message.image_url}
            alt="رسالة"
            className="max-w-full rounded mt-2"
            style={{ maxHeight: '300px' }}
          />
        )}

        {message.audio_url && (
          <audio controls className="mt-2 w-full">
            <source src={message.audio_url} type="audio/webm" />
          </audio>
        )}

        {message.product && (
          <div
            className="mt-2 p-2 rounded border"
            style={{
              background: isOwn ? `rgba(${colors.primaryRgb}, 0.2)` : colors.surfaceContainer,
              borderColor: isOwn ? `rgba(${colors.primaryRgb}, 0.3)` : colors.outline,
            }}
          >
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: isOwn ? colors.onPrimary : colors.onSurface }}
            >
              {message.product.name_ar || message.product.name_en}
            </p>
            {message.product.price && (
              <p
                className="text-xs"
                style={{ color: isOwn ? colors.onPrimary : colors.onSurfaceVariant }}
              >
                {message.product.price} {message.product.currency || 'ج.م'}
              </p>
            )}
          </div>
        )}

        <p
          className="text-[10px] mt-1 mb-0"
          style={{ color: isOwn ? colors.onPrimary : colors.onSurfaceVariant }}
        >
          {new Date(message.created_at).toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {!isOwn && (
        <button
          onClick={() => onReply(message)}
          className="mr-2 p-1 rounded transition-colors hover:opacity-70"
          style={{ color: colors.onSurfaceVariant }}
          title="الرد"
        >
          <Reply size={14} />
        </button>
      )}
    </div>
  )
}
