'use client'

import { useEffect, useRef } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useConversationContext } from '@/contexts/ConversationContext'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'
import { useTheme } from '@/contexts/ThemeContext'
import { BodySmall, Button, LabelMedium } from '@/components/m3'
import { VirtualList } from '@/components/common'
import type { ConversationMessage } from '@/types'

/**
 * محادثة مضمنة — تعرض الرسائل وحقل الإدخال عند اختيار محادثة في صفحة المحادثات.
 * النظام الموحد: استخدام ConversationContext و ChatInput و MessageItem.
 */
export default function MessagesInlineChat() {
  const { user } = useAuthContext()
  const { colors } = useTheme()
  const {
    selectedConversation,
    selectedPlaceId,
    getConversationMessages,
    newMessage,
    setNewMessage,
    sendMessage,
    setSelectedImage,
    setReplyingTo,
    replyingTo,
    startRecording,
    stopRecording,
    isRecording,
    recordingTime,
    sendingMessages,
    showProductPicker,
    setShowProductPicker,
    selectedImage,
    products,
    selectedProduct,
    setSelectedProduct,
  } = useConversationContext()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const productPickerRef = useRef<HTMLDivElement>(null)
  const messages = getConversationMessages()

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  if (!user) return null
  if (!selectedConversation || !selectedPlaceId) {
    return (
      <div
        className="flex flex-col items-center justify-center flex-1 min-h-[280px] rounded-2xl border"
        style={{
          backgroundColor: colors.surfaceContainer,
          borderColor: colors.outline,
        }}
      >
        <BodySmall color="onSurfaceVariant">اختر محادثة لعرضها</BodySmall>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col flex-1 min-h-0 rounded-2xl border overflow-hidden"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.outline,
      }}
    >
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 min-h-[200px]"
        style={{ backgroundColor: colors.surface }}
      >
        {messages.length > 0 ? (
          <>
            <VirtualList<ConversationMessage>
              items={messages}
              scrollElementRef={messagesContainerRef}
              estimateSize={88}
              getItemKey={(msg) => msg.id}
              renderItem={(msg) => (
                <div style={{ paddingBottom: 'var(--element-gap)' }}>
                  <MessageItem
                    message={msg}
                    isOwn={msg.sender_id === user.id}
                    onReply={(m) => setReplyingTo(m)}
                    showSender
                    variant="premium"
                  />
                </div>
              )}
            />
            <div ref={messagesEndRef} aria-hidden />
          </>
        ) : (
          <div className="text-center py-8">
            <BodySmall color="onSurfaceVariant">لا توجد رسائل بعد. ابدأ المحادثة.</BodySmall>
          </div>
        )}
      </div>
      <div style={{ borderColor: colors.outline }} className="border-t shrink-0">
        <ChatInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={sendMessage}
          onImageSelect={setSelectedImage}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onProductSelect={() => setShowProductPicker(!showProductPicker)}
          selectedImage={selectedImage}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          isRecording={isRecording}
          recordingTime={recordingTime}
          disabled={sendingMessages.size > 0}
          placeholder={replyingTo ? 'اكتب ردك...' : 'اكتب رسالتك...'}
          variant="default"
        />
      </div>
      {showProductPicker && products.length > 0 && (
        <div
          ref={productPickerRef}
          className="shrink-0 p-3 border-t max-h-40 overflow-y-auto"
          style={{ borderColor: colors.outline, backgroundColor: colors.surfaceContainer }}
        >
          <LabelMedium as="p" color="onSurface" className="mb-2">
            اختر منتج:
          </LabelMedium>
          <VirtualList<(typeof products)[0]>
            items={products}
            scrollElementRef={productPickerRef}
            estimateSize={64}
            getItemKey={(p) => p.id}
            renderItem={(product) => (
              <div style={{ paddingBottom: 'var(--element-gap)' }}>
                <div
                  onClick={() => {
                    setSelectedProduct(product)
                    setShowProductPicker(false)
                  }}
                  className="p-2 rounded-lg cursor-pointer border"
                  style={{
                    borderColor: selectedProduct?.id === product.id ? colors.primary : colors.outline,
                    backgroundColor: selectedProduct?.id === product.id ? colors.surfaceContainer : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0].image_url}
                        alt=""
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <LabelMedium as="p" color="onSurface" className="truncate">
                        {product.name_ar ?? product.name_en}
                      </LabelMedium>
                      <BodySmall color="onSurfaceVariant">
                        {product.price != null ? `${product.price} ${product.currency ?? 'IQD'}` : '—'}
                      </BodySmall>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      )}
      {selectedProduct && (
        <div
          className="p-2 border-t flex items-center justify-between gap-2 shrink-0"
          style={{ borderColor: colors.outline, backgroundColor: colors.surfaceContainer }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedProduct.images?.[0] && (
              <img
                src={selectedProduct.images[0].image_url}
                alt=""
                className="w-8 h-8 object-cover rounded"
              />
            )}
            <BodySmall color="onSurface" className="truncate">
              {selectedProduct.name_ar ?? selectedProduct.name_en}
            </BodySmall>
          </div>
          <Button
            type="button"
            variant="text"
            size="sm"
            onClick={() => setSelectedProduct(null)}
            className="!min-h-0 text-xs shrink-0"
          >
            إزالة
          </Button>
        </div>
      )}
    </div>
  )
}
