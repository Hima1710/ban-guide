import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { AudioRecorder } from '@/lib/audio-recorder'
import { showError, showSuccess, showLoading, closeLoading } from '@/components/SweetAlert'
import { uploadImageFile } from '@/lib/api/upload'
import { createLogger } from '@/lib/logger'
import type { 
  ConversationMessage, 
  Conversation, 
  MessageProduct, 
  PlaceEmployee, 
  MessageUserProfile,
  Place 
} from '@/types'
import type { UserProfile } from '@/lib/types'

const logger = createLogger('ConversationsManager')

interface UseConversationsManagerOptions {
  userId: string | null
  userPlaces: Place[]
}

export function useConversationsManager({ userId, userPlaces }: UseConversationsManagerOptions) {
  // ==================== STATE ====================
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [replyingTo, setReplyingTo] = useState<ConversationMessage | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioRecorder, setAudioRecorder] = useState<AudioRecorder | null>(null)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set())
  const [selectedProduct, setSelectedProduct] = useState<MessageProduct | null>(null)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [products, setProducts] = useState<MessageProduct[]>([])
  const [currentEmployee, setCurrentEmployee] = useState<PlaceEmployee | null>(null)
  const [placeEmployees, setPlaceEmployees] = useState<Map<string, PlaceEmployee[]>>(new Map())
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState<{ id: string, name_ar?: string } | null>(null)
  const [selectedSenderInfo, setSelectedSenderInfo] = useState<MessageUserProfile | null>(null)

  const subscriptionRef = useRef<any>(null)

  // ==================== DATA LOADING ====================
  
  const loadPlaceEmployees = useCallback(async () => {
    if (!userId || userPlaces.length === 0) return

    try {
      const placeIds = userPlaces.map(p => p.id)
      const { data: empRows, error } = await supabase
        .from('place_employees')
        .select('*')
        .in('place_id', placeIds)
        .eq('is_active', true)
      const employeesData = empRows as PlaceEmployee[] | null

      if (error) {
        console.error('Error loading place employees:', error)
        return
      }

      if (employeesData && employeesData.length > 0) {
        const userIds = employeesData.map(e => e.user_id)
        const { data: profileRows } = await supabase
          .from('user_profiles')
          .select('*')
          .in('id', userIds)
        const userProfiles = profileRows as UserProfile[] | null

        const profilesMap = new Map<string, UserProfile>()
        if (userProfiles) {
          userProfiles.forEach(profile => {
            profilesMap.set(profile.id, profile)
          })
        }

        employeesData.forEach(employee => {
          employee.user = profilesMap.get(employee.user_id)
        })
      }

      const employeesMap = new Map<string, PlaceEmployee[]>()
      if (employeesData) {
        employeesData.forEach(employee => {
          const placeId = employee.place_id
          if (!employeesMap.has(placeId)) {
            employeesMap.set(placeId, [])
          }
          employeesMap.get(placeId)!.push(employee)
        })
      }

      setPlaceEmployees(employeesMap)
    } catch (error) {
      console.error('Error loading place employees:', error)
    }
  }, [userId, userPlaces])

  const checkEmployeeForPlace = useCallback(async (placeId: string) => {
    if (!userId) return null

    const { data: employeeData, error } = await supabase
      .from('place_employees')
      .select('*')
      .eq('user_id', userId)
      .eq('place_id', placeId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error checking employee status:', error)
      setCurrentEmployee(null)
      return null
    }

    if (employeeData) {
      setCurrentEmployee(employeeData)
      return employeeData
    }

    setCurrentEmployee(null)
    return null
  }, [userId])

  const loadAllMessages = useCallback(async () => {
    if (process.env.NODE_ENV === 'development') {
      if (!userId) {
        console.log('[Conversations] تخطي تحميل الرسائل: لا يوجد مستخدم مسجّل')
        return
      }
      if (!isSupabaseConfigured()) {
        console.log('[Conversations] تخطي تحميل الرسائل: Supabase غير مضبوط (تحقق من .env.local)')
        return
      }
      console.log('[Conversations] جاري تحميل الرسائل من الداتابيز...')
    } else {
      if (!userId || !isSupabaseConfigured()) return
    }

    try {
      const placeIds = userPlaces.map(p => p.id)
      let allMessages: ConversationMessage[] = []

      if (placeIds.length > 0) {
        const { data: ownerRows, error: ownerError } = await supabase
          .from('messages')
          .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
          .in('place_id', placeIds)
          .order('created_at', { ascending: true })
        const ownerMessages = ownerRows as ConversationMessage[] | null

        if (ownerError) {
          console.error('❌ [LOAD MESSAGES] Error loading owner messages:', ownerError)
        } else {
          if (ownerMessages) allMessages = [...allMessages, ...ownerMessages]
        }
      }
      
      const { data: clientRows, error: clientError } = await supabase
        .from('messages')
        .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: true })
      const clientMessages = clientRows as ConversationMessage[] | null

      if (clientError) {
        console.error('❌ [LOAD MESSAGES] Error loading client messages:', clientError)
      } else {
        if (clientMessages) {
          const existingIds = new Set(allMessages.map(m => m.id))
          const newMessages = clientMessages.filter(m => !existingIds.has(m.id))
          allMessages = [...allMessages, ...newMessages]
        }
      }
      
      const { data: sentRows, error: sentError } = await supabase
        .from('messages')
        .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .eq('sender_id', userId)
        .order('created_at', { ascending: true })
      const sentMessages = sentRows as ConversationMessage[] | null

      if (sentError) {
        console.error('❌ [LOAD MESSAGES] Error loading sent messages:', sentError)
      } else {
        if (sentMessages) {
          const existingIds = new Set(allMessages.map(m => m.id))
          const newMessages = sentMessages.filter(m => !existingIds.has(m.id))
          allMessages = [...allMessages, ...newMessages]
        }
      }
      
      const data = allMessages

      if (data && data.length > 0) {
        const replyIds = data.filter(m => m.reply_to).map(m => m.reply_to).filter(Boolean) as string[]
        if (replyIds.length > 0) {
          const { data: repliedRows } = await supabase
            .from('messages')
            .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
            .in('id', replyIds)
          const repliedMessages = repliedRows as ConversationMessage[] | null

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

      setMessages(data || [])
      if (process.env.NODE_ENV === 'development') {
        const count = (data || []).length
        console.log(count > 0
          ? `[Conversations] تم تحميل ${count} رسالة من الداتابيز ✓`
          : '[Conversations] لا توجد رسائل في الداتابيز (الاتصال يعمل) ✓')
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      if (process.env.NODE_ENV === 'development') {
        console.error('[Conversations] فشل تحميل الرسائل:', error)
      }
    }
  }, [userId, userPlaces])

  const loadProducts = useCallback(async (placeId: string) => {
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
  }, [])

  // ==================== CONVERSATIONS ====================

  const getConversations = useCallback((): Conversation[] => {
    if (!userId || messages.length === 0) {
      return []
    }
    
    const conversationsMap = new Map<string, Conversation>()
    const messagesByPlace = new Map<string, ConversationMessage[]>()
    
    messages.forEach(msg => {
      if (!messagesByPlace.has(msg.place_id)) {
        messagesByPlace.set(msg.place_id, [])
      }
      messagesByPlace.get(msg.place_id)!.push(msg)
    })

    messagesByPlace.forEach((placeMessages, placeId) => {
      const place = userPlaces.find(p => p.id === placeId)
      const placeName = place?.name_ar || placeMessages[0]?.place?.name_ar || placeId
      const isOwner = !!place

      const conversationPartnersMap = new Map<string, ConversationMessage[]>()
      
      placeMessages.forEach(msg => {
        let partnerId: string
        if (isOwner) {
          partnerId = msg.sender_id === userId ? (msg.recipient_id || msg.sender_id) : msg.sender_id
        } else {
          partnerId = msg.sender_id === userId ? (msg.recipient_id || msg.sender_id) : msg.sender_id
        }

        if (!conversationPartnersMap.has(partnerId)) {
          conversationPartnersMap.set(partnerId, [])
        }
        conversationPartnersMap.get(partnerId)!.push(msg)
      })

      conversationPartnersMap.forEach((partnerMessages, partnerId) => {
        const conversationKey = `${partnerId}-${placeId}`
        const lastMessage = partnerMessages[partnerMessages.length - 1]
        const unreadCount = partnerMessages.filter(m => 
          !m.is_read && m.sender_id !== userId
        ).length

        const partnerInfo = partnerMessages.find(m => m.sender_id === partnerId)?.sender
        
        conversationsMap.set(conversationKey, {
          senderId: partnerId,
          placeId: placeId,
          placeName: placeName,
          lastMessage: lastMessage.content || (lastMessage.image_url ? 'صورة' : (lastMessage.audio_url ? 'رسالة صوتية' : 'رسالة')),
          lastMessageTime: lastMessage.created_at,
          unreadCount,
          partnerName: partnerInfo?.full_name || partnerInfo?.email || 'مستخدم',
          partnerAvatar: partnerInfo?.avatar_url
        })
      })
    })

    return Array.from(conversationsMap.values()).sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    )
  }, [userId, messages, userPlaces])

  const getConversationMessages = useCallback(() => {
    if (!selectedConversation || !selectedPlaceId) return []
    
    const conversationMessages = messages.filter(msg => {
      const isInPlace = msg.place_id === selectedPlaceId
      const isBetweenUsers = (msg.sender_id === selectedConversation || msg.recipient_id === selectedConversation)
      return isInPlace && isBetweenUsers
    })

    return conversationMessages
  }, [messages, selectedConversation, selectedPlaceId])

  // ==================== MESSAGE ACTIONS ====================

  const selectConversation = useCallback(async (senderId: string | null, placeId: string | null) => {
    
    setSelectedConversation(senderId)
    setSelectedPlaceId(placeId)
    
    // Only check employee status if placeId is provided
    if (placeId) {
      await checkEmployeeForPlace(placeId)
    } else {
      setCurrentEmployee(null)
    }
    
    const conversationMessages = messages.filter(msg => 
      msg.place_id === placeId && 
      (msg.sender_id === senderId || msg.recipient_id === senderId)
    )
    
    const unreadMessages = conversationMessages.filter(m => 
      !m.is_read && m.sender_id === senderId && m.recipient_id === userId
    )
    
    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map(m => m.id)
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true } as never)
        .in('id', unreadIds)
      
      if (error) {
        console.error('❌ [SELECT CONVERSATION] Error marking messages as read:', error)
      } else {
        setMessages(prev => prev.map(m => 
          unreadIds.includes(m.id) ? { ...m, is_read: true } : m
        ))
      }
    }
  }, [userId, messages, checkEmployeeForPlace])

  const sendMessage = useCallback(async () => {
    if (!userId || !selectedConversation || !selectedPlaceId) {
      showError('يجب اختيار محادثة أولاً')
      return
    }

    if (!newMessage.trim() && !selectedImage && !selectedProduct) {
      showError('يجب كتابة رسالة أو اختيار صورة')
      return
    }

    const tempId = `temp-${Date.now()}`
    setSendingMessages(prev => new Set(prev).add(tempId))

    try {
      let imageUrl: string | null = null
      if (selectedImage) {
        showLoading('جاري رفع الصورة...')
        try {
          imageUrl = await uploadImageFile(selectedImage)
        } catch (uploadErr: any) {
          closeLoading()
          showError(uploadErr?.message || 'فشل رفع الصورة')
          return
        }
        closeLoading()
      }

      const messageData: any = {
        sender_id: userId,
        recipient_id: selectedConversation,
        place_id: selectedPlaceId,
        content: newMessage.trim() || null,
        image_url: imageUrl,
        reply_to: replyingTo?.id || null,
        product_id: selectedProduct?.id || null,
        employee_id: currentEmployee?.id || null,
        is_read: false
      }


      const { data: insertResult, error } = await supabase
        .from('messages')
        .insert(messageData as never)
        .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .single()
      const data = insertResult as ConversationMessage | null

      if (error) {
        console.error('❌ [SEND MESSAGE] Error:', error)
        throw error
      }


      if (replyingTo && data) {
        data.replied_message = replyingTo
      }

      setMessages(prev => [...prev, data!])
      setNewMessage('')
      setSelectedImage(null)
      setReplyingTo(null)
      setSelectedProduct(null)
      setShowProductPicker(false)
    } catch (error: any) {
      console.error('Error sending message:', error)
      showError(error.message || 'فشل إرسال الرسالة')
    } finally {
      setSendingMessages(prev => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
    }
  }, [userId, selectedConversation, selectedPlaceId, newMessage, selectedImage, selectedProduct, replyingTo, currentEmployee])

  // ==================== AUDIO RECORDING ====================

  const startRecording = useCallback(async () => {
    try {
      const recorder = new AudioRecorder()
      await recorder.startRecording()
      setAudioRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)

      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      setRecordingTimer(timer)
    } catch (error: any) {
      showError(error.message || 'فشل بدء التسجيل')
    }
  }, [])

  const stopRecording = useCallback(async () => {
    if (!audioRecorder || !userId || !selectedConversation || !selectedPlaceId) return

    try {
      if (recordingTimer) {
        clearInterval(recordingTimer)
        setRecordingTimer(null)
      }

      const audioBlob = await audioRecorder.stopRecording()
      setIsRecording(false)
      setRecordingTime(0)

      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const uploadResponse = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('فشل رفع الملف الصوتي')
      }

      const uploadData = await uploadResponse.json()
      const audioUrl = uploadData.url

      const messageData: any = {
        sender_id: userId,
        recipient_id: selectedConversation,
        place_id: selectedPlaceId,
        audio_url: audioUrl,
        reply_to: replyingTo?.id || null,
        employee_id: currentEmployee?.id || null,
        is_read: false
      }

      const { data: insertResult, error } = await supabase
        .from('messages')
        .insert(messageData as never)
        .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .single()
      const data = insertResult as ConversationMessage | null

      if (error) throw error

      if (replyingTo && data) {
        data.replied_message = replyingTo
      }

      setMessages(prev => [...prev, data!])
      setReplyingTo(null)
    } catch (error: any) {
      showError(error.message || 'فشل إرسال الرسالة الصوتية')
    }
  }, [audioRecorder, userId, selectedConversation, selectedPlaceId, recordingTimer, replyingTo, currentEmployee])

  // ==================== REAL-TIME SUBSCRIPTIONS ====================
  // يتطلب تفعيل Realtime لجدول messages في Supabase: Database → Replication → جدول messages

  useEffect(() => {
    if (!userId) return

    // Cleanup previous subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current)
    }

    const channel = supabase
      .channel('messages-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `sender_id=eq.${userId}`
        },
        (payload) => {
          handleRealtimeChange(payload)
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        (payload) => {
          handleRealtimeChange(payload)
        }
      )

    // Subscribe to place messages if user owns places
    if (userPlaces.length > 0) {
      userPlaces.forEach(place => {
        channel.on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `place_id=eq.${place.id}`
          },
          (payload) => {
            handleRealtimeChange(payload)
          }
        )
      })
    }

    channel.subscribe((status) => {
    })

    subscriptionRef.current = channel

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [userId, userPlaces])

  const handleRealtimeChange = useCallback(async (payload: any) => {
    if (payload.eventType === 'INSERT') {
      const newMessageId = payload.new.id

      const { data: fullRow, error } = await supabase
        .from('messages')
        .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
        .eq('id', newMessageId)
        .single()
      const fullMessage = fullRow as ConversationMessage | null

      if (error) {
        console.error('Error fetching full message:', error)
        return
      }
      if (!fullMessage) return

      if (fullMessage.reply_to) {
        const { data: repliedRow } = await supabase
          .from('messages')
          .select('*, sender:user_profiles(*), place:places(id, name_ar), employee:place_employees(id, place_id, user_id), product:products(*, images:product_images(*), videos:product_videos(*), variants:product_variants(*))')
          .eq('id', fullMessage.reply_to)
          .single()
        const repliedMessage = repliedRow as ConversationMessage | null

        if (repliedMessage) {
          fullMessage.replied_message = repliedMessage
        }
      }

      setMessages(prev => {
        if (prev.find(m => m.id === fullMessage.id)) {
          return prev
        }
        return [...prev, fullMessage]
      })
    } else if (payload.eventType === 'UPDATE') {
      const next = payload.new as Record<string, unknown>
      setMessages(prev => prev.map(m => {
        if (m.id !== next.id) return m
        // دمج الحقول القياسية فقط حتى لا نطمس العلاقات (sender, place)
        return {
          ...m,
          is_read: next.is_read !== undefined ? (next.is_read as boolean) : m.is_read,
          content: (next.content as string) ?? m.content,
          image_url: (next.image_url as string | null) ?? m.image_url,
          audio_url: (next.audio_url as string | null) ?? m.audio_url,
        }
      }))
    } else if (payload.eventType === 'DELETE') {
      setMessages(prev => prev.filter(m => m.id !== payload.old.id))
    }
  }, [])

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (userId) {
      loadAllMessages()
      if (userPlaces.length > 0) loadPlaceEmployees()
    }
  }, [userId, userPlaces, loadPlaceEmployees, loadAllMessages])

  useEffect(() => {
    if (selectedPlaceId) {
      loadProducts(selectedPlaceId)
    }
  }, [selectedPlaceId, loadProducts])

  // openConversation URL param is handled by the place page + ConversationContext (open drawer, no redirect)

  // Auto-scroll to bottom when conversation changes
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

  // ==================== RETURN ====================

  return {
    // State
    messages,
    selectedConversation,
    selectedPlaceId,
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
    currentEmployee,
    placeEmployees,
    selectedPlaceInfo,
    selectedSenderInfo,
    
    // Actions
    selectConversation,
    sendMessage,
    startRecording,
    stopRecording,
    getConversations,
    getConversationMessages,
    loadProducts
  }
}
