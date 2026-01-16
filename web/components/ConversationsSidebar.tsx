'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { AudioRecorder } from '@/lib/audio-recorder'
import { MessageCircle, X, Users, Reply, Send, ImageIcon, Mic, Square, Package, Loader2 } from 'lucide-react'
import { showError, showSuccess } from '@/components/SweetAlert'

interface Message {
  id: string
  place_id: string
  sender_id: string
  content?: string
  image_url?: string
  audio_url?: string
  product_id?: string
  reply_to?: string
  is_read: boolean
  created_at: string
  sender?: {
    id: string
    full_name?: string
    email?: string
    avatar_url?: string
  }
  product?: any
  replied_message?: Message
}

interface Conversation {
  senderId: string
  sender?: {
    id: string
    full_name?: string
    email?: string
    avatar_url?: string
  }
  lastMessage?: Message
  unreadCount: number
  messageCount: number
  placeId: string
  placeName?: string
}

export default function ConversationsSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [userPlaces, setUserPlaces] = useState<any[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioRecorder, setAudioRecorder] = useState<any>(null)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set())
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user && userPlaces.length > 0) {
      loadAllMessages()
    }
  }, [user, userPlaces])

  useEffect(() => {
    if (selectedPlaceId) {
      loadProducts(selectedPlaceId)
    }
  }, [selectedPlaceId])

  // Scroll to bottom when conversation changes or messages update
  useEffect(() => {
    if (selectedConversation && selectedPlaceId) {
      const conversationMessages = messages.filter(
        (msg) => msg.place_id === selectedPlaceId && msg.sender_id === selectedConversation
      )
      if (conversationMessages.length > 0) {
        setTimeout(() => {
          const messagesContainer = document.querySelector('[style*="height: 400px"]') as HTMLElement
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight
          }
        }, 200)
      }
    }
  }, [messages, selectedConversation, selectedPlaceId])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return
    }

    setUser(user)

    // Load user places
    const { data: placesData } = await supabase
      .from('places')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setUserPlaces(placesData || [])
  }

  const loadAllMessages = async () => {
    if (!user || userPlaces.length === 0) return

    try {
      const placeIds = userPlaces.map(p => p.id)
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:user_profiles(*), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .in('place_id', placeIds)
        .order('created_at', { ascending: true })

      // Load replied messages
      if (data) {
        const replyIds = data.filter(m => m.reply_to).map(m => m.reply_to).filter(Boolean)
        if (replyIds.length > 0) {
          const { data: repliedMessages } = await supabase
            .from('messages')
            .select('*, sender:user_profiles(*), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
            .in('id', replyIds)
          
          if (repliedMessages) {
            const repliedMap = new Map(repliedMessages.map(m => [m.id, m]))
            data.forEach(msg => {
              if (msg.reply_to && repliedMap.has(msg.reply_to)) {
                msg.replied_message = repliedMap.get(msg.reply_to)
              }
            })
          }
        }
      }

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const loadProducts = async (placeId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, images:product_images(*), videos:product_videos(*), variants:product_variants(*)')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading products:', error)
        return
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  // Group messages by place and sender (conversations)
  const getConversations = (): Conversation[] => {
    if (!user || messages.length === 0) return []
    
    const conversationsMap = new Map<string, Conversation>()

    messages.forEach((msg) => {
      if (msg.sender_id === user.id) return // Skip own messages
      
      const key = `${msg.place_id}_${msg.sender_id}`
      
      if (!conversationsMap.has(key)) {
        const place = userPlaces.find(p => p.id === msg.place_id)
        conversationsMap.set(key, {
          senderId: msg.sender_id,
          sender: msg.sender,
          lastMessage: msg,
          unreadCount: msg.is_read ? 0 : 1,
          messageCount: 1,
          placeId: msg.place_id,
          placeName: place?.name_ar,
        })
      } else {
        const conv = conversationsMap.get(key)!
        conv.messageCount++
        if (!msg.is_read) conv.unreadCount++
        if (new Date(msg.created_at) > new Date(conv.lastMessage?.created_at || 0)) {
          conv.lastMessage = msg
        }
      }
    })

    return Array.from(conversationsMap.values()).sort((a, b) => {
      const timeA = new Date(a.lastMessage?.created_at || 0).getTime()
      const timeB = new Date(b.lastMessage?.created_at || 0).getTime()
      return timeB - timeA
    })
  }

  // Get messages for selected conversation
  const getConversationMessages = (): Message[] => {
    if (!selectedConversation || !selectedPlaceId || !user) {
      console.log('📋 [GET MESSAGES] No conversation selected:', { selectedConversation, selectedPlaceId, user })
      return []
    }
    
    // Get all messages in this conversation (from both current user and the selected conversation partner)
    const filtered = messages.filter(
      (msg) => 
        msg.place_id === selectedPlaceId && 
        (msg.sender_id === selectedConversation || msg.sender_id === user.id)
    )
    
    // Sort by created_at to show in chronological order
    const sorted = filtered.sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    
    console.log('📋 [GET MESSAGES] Filtered messages:', {
      totalMessages: messages.length,
      filteredCount: sorted.length,
      placeId: selectedPlaceId,
      conversationPartnerId: selectedConversation,
      currentUserId: user.id,
      messages: sorted.map(m => ({ 
        id: m.id, 
        content: m.content, 
        sender_id: m.sender_id,
        created_at: m.created_at 
      }))
    })
    
    return sorted
  }

  const selectConversation = (senderId: string, placeId: string) => {
    setSelectedConversation(senderId)
    setSelectedPlaceId(placeId)
    setIsOpen(true)
    
    // Mark messages as read
    markAsRead(senderId, placeId)
  }

  const markAsRead = async (senderId: string, placeId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('place_id', placeId)
        .eq('sender_id', senderId)
        .eq('is_read', false)

      if (!error) {
        // Reload messages
        loadAllMessages()
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!user || !selectedConversation || !selectedPlaceId) {
      showError('يرجى اختيار محادثة أولاً')
      return
    }

    if (!newMessage.trim() && !selectedImage && !selectedProduct) {
      showError('يرجى كتابة رسالة أو اختيار صورة أو منتج')
      return
    }

    // Store message content before clearing
    const messageContent = newMessage.trim()
    const messageImage = selectedImage
    const messageProduct = selectedProduct
    const messageReplyTo = replyingTo

    // Clear inputs immediately for better UX
    setNewMessage('')
    setSelectedImage(null)
    setSelectedProduct(null)
    setReplyingTo(null)

    try {
      let imageUrl = null
      if (messageImage) {
        try {
          const formData = new FormData()
          formData.append('image', messageImage)
          const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData,
          })
          const data = await response.json()
          if (data.success && data.url) {
            imageUrl = data.url
          } else {
            showError('حدث خطأ في رفع الصورة')
            setNewMessage(messageContent)
            setSelectedImage(messageImage)
            setSelectedProduct(messageProduct)
            setReplyingTo(messageReplyTo)
            return
          }
        } catch (error) {
          console.error('Error uploading image:', error)
          showError('حدث خطأ في رفع الصورة')
          setNewMessage(messageContent)
          setSelectedImage(messageImage)
          setSelectedProduct(messageProduct)
          setReplyingTo(messageReplyTo)
          return
        }
      }

      const messageData: any = {
        place_id: selectedPlaceId,
        sender_id: user.id,
        content: messageContent || null,
        image_url: imageUrl || null,
        product_id: messageProduct?.id || null,
        reply_to: messageReplyTo?.id || null,
        is_read: false,
      }

      console.log('📤 [SEND MESSAGE] Sending message:', messageData)
      
      const { data: newMessageData, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select('*, sender:user_profiles(*), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .single()

      if (error) {
        console.error('❌ [SEND MESSAGE] Error sending message:', error)
        showError(`حدث خطأ في إرسال الرسالة: ${error.message}`)
        // Restore inputs on error
        setNewMessage(messageContent)
        setSelectedImage(messageImage)
        setSelectedProduct(messageProduct)
        setReplyingTo(messageReplyTo)
        return
      }

      console.log('✅ [SEND MESSAGE] Message sent successfully:', newMessageData)

      // Add the new message to state immediately for instant UI update
      if (newMessageData) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some(msg => msg.id === newMessageData.id)
          if (exists) return prev
          return [...prev, newMessageData]
        })
      }

      // Reload all messages to get the new one with all relations
      await loadAllMessages()
      
      // Scroll to bottom of messages after sending
      setTimeout(() => {
        const messagesContainer = document.querySelector('[style*="height: 400px"]') as HTMLElement
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
      }, 300)

    } catch (error: any) {
      console.error('Error in sendMessage:', error)
      showError('حدث خطأ غير متوقع في إرسال الرسالة')
      // Restore inputs on error
      setNewMessage(messageContent)
      setSelectedImage(messageImage)
      setSelectedProduct(messageProduct)
      setReplyingTo(messageReplyTo)
    }
  }

  // Audio recording functions
  const startRecording = async () => {
    if (!selectedConversation || !selectedPlaceId || !user) {
      showError('يرجى اختيار محادثة أولاً')
      return
    }

    try {
      const recorder = new AudioRecorder()
      await recorder.startRecording()
      setAudioRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      const timer = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
      setRecordingTimer(timer)
    } catch (error: any) {
      console.error('فشل في بدء التسجيل:', error)
      showError(error.message || 'فشل في بدء التسجيل. تأكد من السماح بالوصول إلى الميكروفون.')
      setIsRecording(false)
      setRecordingTime(0)
    }
  }

  const stopRecording = async () => {
    if (!audioRecorder) return

    try {
      if (recordingTimer) {
        clearInterval(recordingTimer)
        setRecordingTimer(null)
      }

      const audioBlob = await audioRecorder.stopRecording()
      setIsRecording(false)
      const finalTime = recordingTime
      setRecordingTime(0)

      // Upload audio
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.opus')

      const response = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success && data.url) {
        // Send message with audio
        await sendMessageWithAudio(data.url)
      } else {
        throw new Error(data.error || 'فشل في رفع الصوت')
      }
    } catch (error: any) {
      console.error('حدث خطأ في تسجيل الصوت:', error)
      showError(error.message || 'حدث خطأ في تسجيل الصوت')
      setIsRecording(false)
      setRecordingTime(0)
    } finally {
      setAudioRecorder(null)
    }
  }

  const sendMessageWithAudio = async (audioUrl: string) => {
    if (!selectedConversation || !selectedPlaceId || !user) {
      return
    }

    try {
      const messageData: any = {
        place_id: selectedPlaceId,
        sender_id: user.id,
        content: null,
        audio_url: audioUrl,
        product_id: null,
        reply_to: replyingTo?.id || null,
        is_read: false,
      }

      console.log('📤 [SEND AUDIO MESSAGE] Sending audio message:', messageData)

      const { data: newMessageData, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select('*, sender:user_profiles(*), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .single()

      if (error) {
        console.error('❌ [SEND AUDIO MESSAGE] Error sending audio message:', error)
        showError(`حدث خطأ في إرسال الرسالة الصوتية: ${error.message}`)
        return
      }

      console.log('✅ [SEND AUDIO MESSAGE] Audio message sent successfully:', newMessageData)

      // Add the new message to state immediately
      if (newMessageData) {
        setMessages((prev) => {
          const exists = prev.some(msg => msg.id === newMessageData.id)
          if (exists) return prev
          return [...prev, newMessageData]
        })
      }

      // Reload all messages
      await loadAllMessages()

      // Clear reply if exists
      setReplyingTo(null)

      // Scroll to bottom
      setTimeout(() => {
        const messagesContainer = document.querySelector('[style*="height: 400px"]') as HTMLElement
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
      }, 300)
    } catch (error: any) {
      console.error('Error in sendMessageWithAudio:', error)
      showError('حدث خطأ غير متوقع في إرسال الرسالة الصوتية')
    }
  }

  const cancelRecording = () => {
    if (audioRecorder) {
      audioRecorder.cancelRecording()
      setAudioRecorder(null)
    }
    if (recordingTimer) {
      clearInterval(recordingTimer)
      setRecordingTimer(null)
    }
    setIsRecording(false)
    setRecordingTime(0)
  }

  const conversations = getConversations()
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)

  // Don't show sidebar if user has no places
  if (!user || userPlaces.length === 0) {
    return null
  }

  return (
    <>
      {/* Desktop Sidebar - Fixed on right side */}
      <div className="hidden lg:flex fixed top-0 right-0 h-screen w-96 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 z-40 flex-col">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-slate-900 p-4 border-b dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <MessageCircle size={20} />
              المحادثات
              {totalUnread > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {conversations.map((conversation) => (
                <button
                  key={`${conversation.placeId}_${conversation.senderId}`}
                  onClick={() => selectConversation(conversation.senderId, conversation.placeId)}
                  className={`w-full p-3 text-right hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                    selectedConversation === conversation.senderId && selectedPlaceId === conversation.placeId
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {conversation.sender?.avatar_url ? (
                      <div className="relative flex-shrink-0">
                        <img
                          src={conversation.sender.avatar_url}
                          alt={conversation.sender.full_name || conversation.sender.email || ''}
                          className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-slate-600 object-cover shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              const fallback = document.createElement('div')
                              fallback.className = 'w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-base font-bold shadow-sm border-2 border-gray-200 dark:border-slate-600'
                              fallback.textContent = (conversation.sender?.full_name?.[0] || conversation.sender?.email?.[0] || 'U').toUpperCase()
                              parent.appendChild(fallback)
                            }
                          }}
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                      </div>
                    ) : (
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-base font-bold shadow-sm border-2 border-gray-200 dark:border-slate-600">
                          {(conversation.sender?.full_name?.[0] || conversation.sender?.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900 dark:text-slate-100 truncate text-sm">
                          {conversation.sender?.full_name || conversation.sender?.email || 'مستخدم'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      {conversation.placeName && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 truncate mb-1">
                          {conversation.placeName}
                        </p>
                      )}
                      {conversation.lastMessage && (
                        <p className="text-xs text-gray-700 dark:text-slate-300 truncate">
                          {conversation.lastMessage.content || 'صورة'}
                        </p>
                      )}
                      {conversation.lastMessage && (
                        <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                          {new Date(conversation.lastMessage.created_at).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-700 dark:text-slate-400">
              <MessageCircle size={48} className="mx-auto mb-4 text-gray-600 dark:text-slate-500" />
              <p>لا توجد محادثات بعد</p>
            </div>
          )}
        </div>

        {/* Conversation View - Bottom of sidebar */}
        {selectedConversation && selectedPlaceId && (
          <div className="border-t dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col" style={{ height: '550px', minHeight: '550px' }}>
            {/* Conversation Header */}
            <div className="bg-gray-50 dark:bg-slate-900 p-3 border-b dark:border-slate-700 flex-shrink-0">
              {(() => {
                const conversation = conversations.find(
                  (c) => c.senderId === selectedConversation && c.placeId === selectedPlaceId
                )
                return (
                  <div className="flex items-center gap-2">
                    {conversation?.sender?.avatar_url ? (
                      <div className="relative flex-shrink-0">
                        <img
                          src={conversation.sender.avatar_url}
                          alt={conversation.sender.full_name || conversation.sender.email || ''}
                          className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-slate-600 object-cover shadow-sm"
                        />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                      </div>
                    ) : (
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-gray-200 dark:border-slate-600">
                          {(conversation?.sender?.full_name?.[0] || conversation?.sender?.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate">
                        {conversation?.sender?.full_name || conversation?.sender?.email || 'مستخدم'}
                      </p>
                      {conversation?.placeName && (
                        <p className="text-[10px] text-gray-700 dark:text-slate-400">
                          {conversation.placeName}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedConversation(null)
                        setSelectedPlaceId(null)
                      }}
                      className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )
              })()}
            </div>

            {/* Messages */}
            <div className="overflow-y-auto p-2 bg-gray-50 dark:bg-slate-900/50" style={{ height: '400px', flexShrink: 1 }}>
              {(() => {
                const msgs = getConversationMessages()
                return msgs.length > 0 ? (
                <div className="space-y-2">
                  {msgs.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-2 ${
                        message.sender_id === user.id ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {/* Avatar */}
                      {message.sender?.avatar_url ? (
                        <div className="relative flex-shrink-0">
                          <img
                            src={message.sender.avatar_url}
                            alt={message.sender.full_name || message.sender.email || ''}
                            className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-slate-600 object-cover shadow-sm"
                          />
                        </div>
                      ) : (
                        <div className="relative flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-gray-200 dark:border-slate-600">
                            {message.sender?.full_name?.[0]?.toUpperCase() || message.sender?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                        </div>
                      )}
                      
                      {/* Message Content */}
                      <div className="flex-1">
                        {message.reply_to && message.replied_message && (
                          <div className={`mb-1 p-1.5 rounded text-xs border-r-2 ${
                            message.sender_id === user.id 
                              ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400' 
                              : 'bg-gray-100 dark:bg-slate-700 border-gray-400'
                          }`}>
                            <p className={`font-semibold mb-0.5 ${
                              message.sender_id === user.id 
                                ? 'text-blue-900 dark:text-blue-200' 
                                : 'text-gray-900 dark:text-slate-100'
                            }`}>
                              رد على: {message.replied_message.sender?.full_name || message.replied_message.sender?.email || 'مستخدم'}
                            </p>
                            <p className={`line-clamp-1 ${
                              message.sender_id === user.id 
                                ? 'text-blue-800 dark:text-blue-300' 
                                : 'text-gray-800 dark:text-slate-300'
                            }`}>
                              {message.replied_message.content || 'صورة'}
                            </p>
                          </div>
                        )}
                        <div
                          className={`p-1.5 rounded-lg text-sm ${
                            message.sender_id === user.id
                              ? 'bg-blue-500 text-white max-w-[200px]'
                              : 'bg-white dark:bg-slate-800 border dark:border-slate-700 max-w-[200px]'
                          }`}
                        >
                          {message.content && (
                            <p className={message.sender_id === user.id ? 'text-white' : 'text-gray-900 dark:text-slate-100'}>
                              {message.content}
                            </p>
                          )}
                          {message.image_url && (
                            <img
                              src={message.image_url}
                              alt="Message"
                              className="mt-1 rounded max-w-full cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          )}
                          {message.audio_url && (
                            <audio
                              controls
                              className="w-full max-w-xs mt-1"
                              style={{ maxHeight: '40px' }}
                            >
                              <source src={message.audio_url} type="audio/opus" />
                              <source src={message.audio_url} type="audio/webm" />
                              متصفحك لا يدعم تشغيل الصوت
                            </audio>
                          )}
                          {message.product && (
                            <div className={`mt-1 border-2 rounded p-2 ${
                              message.sender_id === user.id
                                ? 'border-purple-300 bg-purple-50'
                                : 'border-purple-300 bg-purple-50'
                            }`}>
                              {message.product.images && message.product.images.length > 0 && (
                                <img
                                  src={message.product.images[0].image_url}
                                  alt={message.product.name_ar}
                                  className="h-12 w-12 object-cover rounded"
                                />
                              )}
                              <p className="text-xs font-semibold mt-1 text-gray-900">
                                {message.product.name_ar}
                              </p>
                            </div>
                          )}
                          <p className={`text-[10px] mt-1 ${message.sender_id === user.id ? 'opacity-70' : 'text-gray-500 dark:text-slate-400'}`}>
                            {new Date(message.created_at).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-700 dark:text-slate-400 text-sm">
                  لا توجد رسائل (المجموع الكلي: {messages.length}, المحادثة: {selectedConversation}, المكان: {selectedPlaceId})
                </p>
              )
              })()}
            </div>

            {/* Message Input */}
            <div className="flex flex-col gap-2 p-3 border-t dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
              {replyingTo && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border-r-4 border-blue-500 p-2 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-0.5">
                        رد على: {replyingTo.sender?.full_name || replyingTo.sender?.email || 'مستخدم'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-slate-400 line-clamp-1">
                        {replyingTo.content || 'صورة'}
                      </p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 ml-2"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
              {isRecording ? (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-700 dark:text-red-400 font-semibold text-sm">
                      جاري التسجيل... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <Square size={14} />
                    <span>إيقاف وإرسال</span>
                  </button>
                  <button
                    onClick={cancelRecording}
                    className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
              <div className="flex flex-wrap gap-1.5">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={replyingTo ? "اكتب ردك..." : "اكتب رسالتك..."}
                  className="flex-1 min-w-[120px] px-2 py-1.5 text-sm border-2 border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <label className="cursor-pointer px-2 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors flex-shrink-0">
                  <ImageIcon size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                  />
                </label>
                {products.length > 0 && (
                  <button
                    onClick={() => setShowProductPicker(!showProductPicker)}
                    className="px-2 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center flex-shrink-0"
                    title="مشاركة منتج"
                  >
                    <Package size={16} />
                  </button>
                )}
                {newMessage.trim() || selectedImage || selectedProduct ? (
                  <button
                    onClick={sendMessage}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center flex-shrink-0 text-sm"
                  >
                    <Send size={16} />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center flex-shrink-0 text-sm"
                    title="تسجيل صوتي"
                  >
                    <Mic size={16} />
                  </button>
                )}
              </div>
              )}
              {selectedProduct && (
                <div className="border-2 border-purple-300 rounded-lg p-2 bg-purple-50">
                  <div className="flex items-center gap-2">
                    {selectedProduct.images && selectedProduct.images.length > 0 && (
                      <img
                        src={selectedProduct.images[0].image_url}
                        alt={selectedProduct.name_ar}
                        className="h-12 w-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-900">{selectedProduct.name_ar}</p>
                      {selectedProduct.price && (
                        <p className="text-xs text-blue-600">{selectedProduct.price} {selectedProduct.currency}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
              {selectedImage && (
                <div className="relative inline-block">
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Selected"
                    className="h-16 w-16 object-cover rounded border-2 border-gray-200"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <span className="text-xs">×</span>
                  </button>
                </div>
              )}
              {showProductPicker && products.length > 0 && (
                <div className="border-2 border-purple-300 rounded-lg p-2 bg-white dark:bg-slate-700 max-h-32 overflow-y-auto">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product)
                        setShowProductPicker(false)
                      }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-slate-600 rounded text-right"
                    >
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name_ar}
                          className="h-10 w-10 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-slate-100 truncate">
                          {product.name_ar}
                        </p>
                        {product.price && (
                          <p className="text-xs text-blue-600">{product.price} {product.currency}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile - Floating button */}
      <div className="lg:hidden fixed bottom-4 left-4 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center relative"
        >
          <MessageCircle size={24} />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      </div>
    </>
  )
}
