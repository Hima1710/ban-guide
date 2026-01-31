'use client'

import { Send, ImageIcon, Mic, Square, Package, X } from 'lucide-react'
import { ChatInputProps } from '@/types'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/m3'

export default function ChatInput({
  value,
  onChange,
  onSend,
  onImageSelect,
  onStartRecording,
  onStopRecording,
  onProductSelect,
  selectedImage,
  replyingTo,
  onCancelReply,
  isRecording,
  recordingTime,
  disabled = false,
  placeholder = 'اكتب رسالة...',
  variant = 'default',
}: ChatInputProps) {
  const { colors } = useTheme()
  const isDark = variant === 'dark'
  const bg = isDark ? 'var(--chat-drawer-surface)' : colors.surface
  const border = isDark ? 'var(--chat-drawer-bg)' : colors.outline
  const text = isDark ? 'var(--chat-on-bubble-received)' : colors.onSurface
  const textMuted = isDark ? 'var(--chat-on-bubble-received)' : colors.onSurfaceVariant
  const accent = isDark ? 'var(--chat-bubble-sent)' : colors.primary
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="border-t p-3" style={{ backgroundColor: bg, borderColor: border }}>
      {replyingTo && (
        <div
          className="mb-2 p-2 rounded border-r-2 flex items-start justify-between gap-2"
          style={{
            background: `rgba(${colors.primaryRgb}, ${isDark ? 0.15 : 0.1})`,
            borderColor: accent,
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs mb-0.5" style={{ color: textMuted }}>
              الرد على: {replyingTo.sender?.full_name || 'مستخدم'}
            </p>
            {replyingTo.content && (
              <p className="text-sm truncate" style={{ color: text }}>{replyingTo.content}</p>
            )}
            {replyingTo.image_url && !replyingTo.content && (
              <p className="text-sm italic" style={{ color: textMuted }}>صورة</p>
            )}
          </div>
          <Button
            onClick={onCancelReply}
            variant="text"
            size="sm"
            className="!min-h-0 !p-1"
            style={{ color: textMuted }}
          >
            <X size={14} />
          </Button>
        </div>
      )}

      {/* Selected image preview */}
      {selectedImage && (
        <div className="mb-2 relative inline-block">
          <img
            src={URL.createObjectURL(selectedImage)}
            alt="معاينة"
            className="max-h-20 rounded"
          />
          <button
            onClick={() => onImageSelect(null as any)}
            className="absolute top-1 left-1 p-1 rounded-full transition-all hover:scale-110"
            style={{
              backgroundColor: colors.error,
              color: colors.onPrimary,
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div
          className="mb-2 p-2 rounded flex items-center gap-2"
          style={{ background: colors.errorContainer }}
        >
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ background: colors.error }}
          />
          <span className="text-sm" style={{ color: text }}>{formatRecordingTime(recordingTime)}</span>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <label
            className="p-2 rounded transition-colors cursor-pointer hover:opacity-70"
            style={{ color: accent }}
          >
            <ImageIcon size={20} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onImageSelect(file)
              }}
              disabled={disabled}
            />
          </label>
          <Button
            onClick={onProductSelect}
            variant="text"
            size="sm"
            className="!min-h-0 !p-2"
            style={{ color: isDark ? accent : colors.secondary }}
            disabled={disabled}
          >
            <Package size={20} />
          </Button>
          {!isRecording ? (
            <Button
              onClick={onStartRecording}
              variant="text"
              size="sm"
              className="!min-h-0 !p-2"
              style={{ color: accent }}
              disabled={disabled}
            >
              <Mic size={20} />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onStopRecording}
              variant="text"
              size="sm"
              className="!min-h-0 !p-2"
              style={{ color: colors.error }}
            >
              <Square size={20} />
            </Button>
          )}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 p-2 rounded resize-none"
          style={{
            minHeight: '40px',
            maxHeight: '120px',
            fontSize: '16px',
            backgroundColor: isDark ? 'var(--chat-drawer-bg)' : colors.surface,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: border,
            color: text,
          }}
          rows={1}
        />
        <Button
          onClick={onSend}
          variant="text"
          size="sm"
          className="!min-h-0 !p-2"
          style={{ color: accent }}
          disabled={disabled || (!value.trim() && !selectedImage)}
        >
          <Send size={20} />
        </Button>
      </div>
    </div>
  )
}
