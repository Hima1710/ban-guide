'use client'

import { Send, ImageIcon, Mic, Square, Package, X } from 'lucide-react'
import { ChatInputProps } from '@/types'
import { useTheme } from '@/contexts/ThemeContext'

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
}: ChatInputProps) {
  const { colors } = useTheme()
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
    <div className="border-t p-3" style={{ backgroundColor: colors.surface, borderColor: colors.outline }}>
      {replyingTo && (
        <div
          className="mb-2 p-2 rounded border-r-2 flex items-start justify-between gap-2"
          style={{
            background: `rgba(${colors.primaryRgb}, 0.1)`,
            borderColor: colors.primary,
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs mb-0.5" style={{ color: colors.onSurfaceVariant }}>
              الرد على: {replyingTo.sender?.full_name || 'مستخدم'}
            </p>
            {replyingTo.content && (
              <p className="text-sm truncate" style={{ color: colors.onSurface }}>{replyingTo.content}</p>
            )}
            {replyingTo.image_url && !replyingTo.content && (
              <p className="text-sm italic" style={{ color: colors.onSurfaceVariant }}>صورة</p>
            )}
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded transition-colors hover:opacity-70"
            style={{ color: colors.onSurfaceVariant }}
          >
            <X size={14} />
          </button>
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
          <span className="text-sm" style={{ color: colors.onSurface }}>{formatRecordingTime(recordingTime)}</span>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Action buttons (left side) */}
        <div className="flex gap-1">
          {/* Image button */}
          <label
            className="p-2 rounded transition-colors cursor-pointer hover:opacity-70"
            style={{ color: colors.primary }}
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

          {/* Product picker button */}
          <button
            onClick={onProductSelect}
            className="p-2 rounded transition-colors hover:opacity-70"
            style={{ color: colors.secondary }}
            disabled={disabled}
          >
            <Package size={20} />
          </button>

          {/* Audio button */}
          {!isRecording ? (
            <button
              onClick={onStartRecording}
              className="p-2 rounded transition-colors hover:opacity-70"
              style={{ color: colors.primary }}
              disabled={disabled}
            >
              <Mic size={20} />
            </button>
          ) : (
            <button
              onClick={onStopRecording}
              className="p-2 rounded transition-colors hover:opacity-70"
              style={{ color: colors.error }}
            >
              <Square size={20} />
            </button>
          )}
        </div>

        {/* Text input */}
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
            backgroundColor: colors.surface,
            border: `1px solid ${colors.outline}`,
            color: colors.onSurface,
          }}
          rows={1}
        />

        {/* Send button */}
        <button
          onClick={onSend}
          disabled={disabled || (!value.trim() && !selectedImage)}
          className="p-2 rounded transition-colors disabled:opacity-50"
          style={{ color: colors.primary }}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}
