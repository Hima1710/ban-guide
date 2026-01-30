'use client'

import { Reply } from 'lucide-react'
import { MessageItemProps } from '@/types'
import { useTheme } from '@/contexts/ThemeContext'

const PREMIUM = {
  bubbleSent: 'var(--chat-bubble-sent)',
  bubbleReceived: 'var(--chat-bubble-received)',
  onBubbleSent: 'var(--chat-on-bubble-sent)',
  onBubbleReceived: 'var(--chat-on-bubble-received)',
  replyBg: 'rgba(212, 175, 55, 0.15)',
  replyBorder: 'var(--chat-bubble-sent)',
  muted: 'var(--chat-on-bubble-received)',
  opacity: 0.8,
}

export default function MessageItem({ message, isOwn, onReply, showSender = true, variant = 'default' }: MessageItemProps) {
  const { colors } = useTheme()
  const isPremium = variant === 'premium'
  const bubbleBg = isPremium ? (isOwn ? PREMIUM.bubbleSent : PREMIUM.bubbleReceived) : (isOwn ? colors.primary : colors.surface)
  const bubbleColor = isPremium ? (isOwn ? PREMIUM.onBubbleSent : PREMIUM.onBubbleReceived) : (isOwn ? colors.onPrimary : colors.onSurface)
  const mutedColor = isPremium ? PREMIUM.muted : colors.onSurfaceVariant
  const replyBg = isPremium ? PREMIUM.replyBg : `rgba(${colors.primaryRgb}, 0.1)`
  const replyBorder = isPremium ? PREMIUM.replyBorder : colors.primary
  const productBg = isPremium && isOwn ? 'rgba(212, 175, 55, 0.25)' : (isOwn ? `rgba(${colors.primaryRgb}, 0.2)` : colors.surfaceContainer)
  const productBorder = isPremium && isOwn ? 'rgba(212, 175, 55, 0.4)' : (isOwn ? `rgba(${colors.primaryRgb}, 0.3)` : colors.outline)

  return (
    <div className={`mb-3 ${isOwn ? 'text-left' : 'text-right'}`}>
      {showSender && message.sender && !isOwn && (
        <p className="text-xs mb-1" style={{ color: mutedColor }}>
          {message.sender.full_name || message.sender.email || 'مستخدم'}
        </p>
      )}

      {message.replied_message && (
        <div
          className="text-xs p-2 rounded mb-1 border-r-2"
          style={{
            background: replyBg,
            borderColor: replyBorder,
          }}
        >
          <p className="text-[10px] mb-0.5" style={{ color: mutedColor }}>
            الرد على: {message.replied_message.sender?.full_name || 'مستخدم'}
          </p>
          {message.replied_message.content && (
            <p className="truncate" style={{ color: bubbleColor }}>
              {message.replied_message.content}
            </p>
          )}
          {message.replied_message.image_url && !message.replied_message.content && (
            <p className="italic" style={{ color: mutedColor }}>صورة</p>
          )}
          {message.replied_message.audio_url && !message.replied_message.content && !message.replied_message.image_url && (
            <p className="italic" style={{ color: mutedColor }}>رسالة صوتية</p>
          )}
        </div>
      )}

      <div
        className={`inline-block max-w-[80%] p-3 rounded-lg ${
          isOwn ? 'rounded-br-none' : 'rounded-bl-none'
        } ${isPremium ? (isOwn ? 'chat-drawer-bubble chat-drawer-bubble-sent' : 'chat-drawer-bubble chat-drawer-bubble-received') : ''}`}
        style={{
          background: bubbleBg,
        }}
      >
        {message.content && (
          <p
            className="text-sm mb-0 whitespace-pre-wrap break-words"
            style={{ color: bubbleColor }}
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
              background: productBg,
              borderColor: productBorder,
            }}
          >
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: bubbleColor }}
            >
              {message.product.name_ar || message.product.name_en}
            </p>
            {message.product.price && (
              <p
                className="text-xs"
                style={{ color: mutedColor }}
              >
                {message.product.price} {message.product.currency || 'ج.م'}
              </p>
            )}
          </div>
        )}

        <p
          className="text-[10px] mt-1 mb-0"
          style={{ color: isPremium ? mutedColor : (isOwn ? colors.onPrimary : colors.onSurfaceVariant) }}
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
          style={{ color: mutedColor }}
          title="الرد"
        >
          <Reply size={14} />
        </button>
      )}
    </div>
  )
}
