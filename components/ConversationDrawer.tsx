'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useConversationContext } from '@/contexts/ConversationContext'
import { useAuthContext } from '@/contexts/AuthContext'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'
import { X, Users, Package } from 'lucide-react'
import { Button } from '@/components/m3'

const DRAWER_WIDTH = 'min(100vw, 420px)'

export default function ConversationDrawer() {
  const { user } = useAuthContext()
  const {
    isDrawerOpen,
    closeConversation,
    selectedConversation,
    selectedPlaceId,
    getConversations,
    getConversationMessages,
    newMessage,
    setNewMessage,
    selectedImage,
    setSelectedImage,
    replyingTo,
    setReplyingTo,
    isRecording,
    recordingTime,
    sendingMessages,
    selectedProduct,
    setSelectedProduct,
    showProductPicker,
    setShowProductPicker,
    products,
    sendMessage,
    startRecording,
    stopRecording,
    currentEmployee,
    selectedPlaceInfo,
    selectedSenderInfo,
    userPlaces,
  } = useConversationContext()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const conversations = getConversations()
  const selectedConv = conversations.find(
    (c) => c.senderId === selectedConversation && c.placeId === selectedPlaceId
  )
  const conversationMessages = getConversationMessages()

  useEffect(() => {
    if (conversationMessages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversationMessages.length])

  if (!user) return null

  const show = isDrawerOpen && !!selectedConversation && !!selectedPlaceId
  const partnerName =
    selectedConv?.partnerName ??
    selectedSenderInfo?.full_name ??
    selectedSenderInfo?.email ??
    'مستخدم'
  const placeName = selectedConv?.placeName ?? selectedPlaceInfo?.name_ar ?? 'مكان'
  const partnerAvatar = selectedConv?.partnerAvatar ?? selectedSenderInfo?.avatar_url
  const isOwner = userPlaces.some((p: { id: string }) => p.id === selectedPlaceId)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[75] transition-opacity duration-300"
        style={{
          backgroundColor: show ? 'var(--overlay-bg)' : 'transparent',
          pointerEvents: show ? 'auto' : 'none',
        }}
        onClick={closeConversation}
        aria-hidden
      />

      {/* Drawer panel – data-chat-drawer لتجاوز الألوان الافتراضية للأزرار */}
      <div
        data-chat-drawer
        className="fixed top-0 h-full z-[80] flex flex-col shadow-elev-5 transition-transform duration-300 ease-out"
        style={{
          right: 0,
          width: DRAWER_WIDTH,
          backgroundColor: 'var(--chat-drawer-bg)',
          transform: show ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 p-4 border-b shrink-0"
          style={{
            borderColor: 'var(--chat-drawer-surface)',
            backgroundColor: 'var(--chat-drawer-surface)',
          }}
        >
          <Button
            onClick={closeConversation}
            variant="text"
            size="sm"
            className="!min-h-0 !p-2"
            style={{ color: 'var(--chat-on-bubble-received)' }}
            aria-label="إغلاق"
          >
            <X size={22} />
          </Button>
          {partnerAvatar ? (
            <img
              src={partnerAvatar}
              alt={partnerName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style={{
                background: 'var(--chat-bubble-sent)',
                color: 'var(--chat-on-bubble-sent)',
              }}
            >
              {partnerName[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p
              className="font-semibold truncate"
              style={{ color: 'var(--chat-on-bubble-received)' }}
            >
              {partnerName}
            </p>
            <p
              className="text-sm truncate"
              style={{ color: 'var(--chat-on-bubble-received)', opacity: 0.8 }}
            >
              {placeName}
            </p>
          </div>
          {isOwner && selectedPlaceId && (
            <div className="flex gap-1">
              <Link
                href={`/dashboard/places/${selectedPlaceId}/employees`}
                className="p-2 rounded-full transition-opacity hover:opacity-80"
                style={{ color: 'var(--chat-on-bubble-received)' }}
                title="الموظفون"
              >
                <Users size={18} />
              </Link>
              <Link
                href={`/dashboard/places/${selectedPlaceId}/products/new`}
                className="p-2 rounded-full transition-opacity hover:opacity-80"
                style={{ color: 'var(--chat-on-bubble-received)' }}
                title="المنتجات"
              >
                <Package size={18} />
              </Link>
            </div>
          )}
        </div>

        {currentEmployee && (
          <div
            className="px-4 py-2 text-xs shrink-0"
            style={{
              backgroundColor: 'rgba(212, 175, 55, 0.12)',
              color: 'var(--chat-on-bubble-received)',
            }}
          >
            أنت موظف في هذا المكان
          </div>
        )}

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 min-h-0"
          style={{ backgroundColor: 'var(--chat-drawer-bg)' }}
        >
          {conversationMessages.length > 0 ? (
            <div>
              {conversationMessages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === user.id}
                  onReply={(msg) => setReplyingTo(msg)}
                  showSender
                  variant="premium"
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <p
              className="text-center text-sm py-8"
              style={{ color: 'var(--chat-on-bubble-received)', opacity: 0.7 }}
            >
              لا توجد رسائل بعد. ابدأ المحادثة.
            </p>
          )}
        </div>

        {/* Input area – dark surface to match drawer */}
        <div
          className="shrink-0 border-t"
          style={{
            borderColor: 'var(--chat-drawer-surface)',
            backgroundColor: 'var(--chat-drawer-surface)',
          }}
        >
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
            variant="dark"
          />
        </div>

        {/* Product picker */}
        {showProductPicker && products.length > 0 && (
          <div
            className="shrink-0 p-3 border-t max-h-48 overflow-y-auto"
            style={{
              borderColor: 'var(--chat-drawer-surface)',
              backgroundColor: 'var(--chat-drawer-bg)',
            }}
          >
            <p
              className="text-sm font-semibold mb-2"
              style={{ color: 'var(--chat-on-bubble-received)' }}
            >
              اختر منتج:
            </p>
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product)
                    setShowProductPicker(false)
                  }}
                  className="p-2 rounded-lg cursor-pointer border transition-all"
                  style={{
                    borderColor:
                      selectedProduct?.id === product.id
                        ? 'var(--chat-bubble-sent)'
                        : 'var(--chat-drawer-surface)',
                    backgroundColor:
                      selectedProduct?.id === product.id
                        ? 'var(--chat-drawer-btn-hover-bg)'
                        : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2">
                    {product.images && product.images.length > 0 && (
                      <img
                        src={product.images[0].image_url}
                        alt={product.name_ar ?? ''}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--chat-on-bubble-received)' }}
                      >
                        {product.name_ar ?? product.name_en}
                      </p>
                      <p
                        className="text-xs"
                        style={{
                          color: 'var(--chat-on-bubble-received)',
                          opacity: 0.8,
                        }}
                      >
                        {product.price
                          ? `${product.price} ${product.currency ?? 'IQD'}`
                          : 'السعر غير محدد'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedProduct && (
          <div
            className="p-2 border-t flex items-center justify-between gap-2"
            style={{
              backgroundColor: 'var(--chat-drawer-btn-hover-bg)',
              borderColor: 'var(--chat-drawer-surface)',
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <img
                  src={selectedProduct.images[0].image_url}
                  alt={selectedProduct.name_ar ?? ''}
                  className="w-8 h-8 object-cover rounded"
                />
              )}
              <p
                className="text-xs truncate"
                style={{ color: 'var(--chat-on-bubble-sent)' }}
              >
                {selectedProduct.name_ar ?? selectedProduct.name_en}
              </p>
            </div>
            <Button
              onClick={() => setSelectedProduct(null)}
              variant="text"
              size="sm"
              className="text-xs !min-h-0 !p-1 shrink-0"
              style={{ color: 'var(--chat-bubble-sent)' }}
            >
              إزالة
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
