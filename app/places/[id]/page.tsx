'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Place, Product, Message } from '@/lib/types'
import { incrementPlaceView } from '@/lib/api/places'
import { useAuthContext, usePlace, useProducts, useMessages } from '@/hooks'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { extractYouTubeId, getYouTubeEmbedUrl } from '@/lib/youtube'
import { MapPin, Phone, MessageCircle, Image as ImageIcon, X, Package, UserPlus, CheckCircle, Plus, Trash2, Video, Upload } from 'lucide-react'
import { showError, showSuccess, showLoading, closeLoading } from '@/components/SweetAlert'
import { LoadingSpinner, Input } from '@/components/common'
import { AudioRecorder } from '@/lib/audio-recorder'
import { TitleLarge, TitleMedium, BodyMedium, BodySmall, LabelMedium, LabelLarge, Button } from '@/components/m3'

// Component that uses useSearchParams - must be wrapped in Suspense
function ProductIdHandler({ children }: { children: (productId: string | null) => React.ReactNode }) {
  const searchParams = useSearchParams()
  const productId = searchParams.get('product')
  
  return <>{children(productId)}</>
}

function PlacePageContent({ productId }: { productId: string | null }) {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const placeId = params.id as string

  // Use custom hooks
  const { user } = useAuthContext()
  const { colors } = useTheme()
  const { place, loading: placeLoading } = usePlace(placeId)
  const { products } = useProducts({ placeId, autoLoad: !!placeId })
  const { 
    messages, 
    markAsRead,
    refresh: refreshMessages
  } = useMessages({ placeId, autoLoad: !!placeId })

  const [newMessage, setNewMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioRecorder, setAudioRecorder] = useState<any>(null)
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null)
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set())
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [showEmployeeRequestModal, setShowEmployeeRequestModal] = useState(false)
  const [employeePhone, setEmployeePhone] = useState('')
  const [isEmployee, setIsEmployee] = useState(false)
  const [employeePermissions, setEmployeePermissions] = useState<'basic' | 'messages_posts' | 'full' | null>(null)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'products'>('posts')
  const [posts, setPosts] = useState<any[]>([])
  const [showAddPostModal, setShowAddPostModal] = useState(false)
  const [postData, setPostData] = useState({
    content: '',
    post_type: 'text' as 'text' | 'image' | 'video',
    image_url: '',
    video_url: '',
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoTitle, setVideoTitle] = useState('')
  const [videoUploadMethod, setVideoUploadMethod] = useState<'link' | 'upload'>('link')

  useEffect(() => {
    if (place) {
      incrementPlaceView(placeId).catch(console.error)
      loadPosts()
    }
    // Set loading to false when place loading completes (whether successful or not)
    if (!placeLoading) {
      setLoading(false)
    }
  }, [place, placeId, placeLoading])

  useEffect(() => {
    // Check if user is employee or has pending request
    if (user && place) {
      checkEmployeeStatus()
    }
  }, [user, place])


  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('place_id', placeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading posts:', error)
        return
      }

      setPosts(data || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  const checkEmployeeStatus = async () => {
    if (!user || !place) return

    try {
      // Check if user is an employee
      const { data: empRow, error: employeeError } = await supabase
        .from('place_employees')
        .select('*')
        .eq('user_id', user.id)
        .eq('place_id', place.id)
        .eq('is_active', true)
        .maybeSingle()
      const employeeData = empRow as { permissions?: 'basic' | 'messages_posts' | 'full' } | null

      if (employeeError) {
        console.error('Error checking employee status:', employeeError)
      }

      if (employeeData) {
        setIsEmployee(true)
        setEmployeePermissions(employeeData.permissions || 'basic')
        setHasPendingRequest(false)
        return
      }

      setIsEmployee(false)
      setEmployeePermissions(null)

      // Check if user has a pending request
      const { data: requestData, error: requestError } = await supabase
        .from('employee_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('place_id', place.id)
        .eq('status', 'pending')
        .maybeSingle()

      if (requestError) {
        console.error('Error checking pending request:', requestError)
      }

      if (requestData) {
        setHasPendingRequest(true)
      } else {
        setHasPendingRequest(false)
      }
    } catch (error) {
      console.error('Error checking employee status:', error)
    }
  }

  const handleEmployeeRequest = async () => {
    if (!user || !place || !employeePhone.trim()) {
      showError('يرجى إدخال رقم الهاتف')
      return
    }

    try {
      const reqRow = {
        user_id: user.id,
        place_id: place.id,
        phone: employeePhone.trim(),
        status: 'pending',
        permissions: 'basic' as const,
      }
      const { error } = await supabase
        .from('employee_requests')
        .insert(reqRow as never)

      if (error) {
        console.error('Error creating employee request:', error)
        showError('حدث خطأ في إرسال الطلب. حاول مرة أخرى')
        return
      }

      showSuccess('تم إرسال طلبك بنجاح! سيتم مراجعته قريباً')
      setShowEmployeeRequestModal(false)
      setEmployeePhone('')
      setHasPendingRequest(true)
      
      // Refresh employee status
      await checkEmployeeStatus()
    } catch (error) {
      console.error('Error handling employee request:', error)
      showError('حدث خطأ في إرسال الطلب')
    }
  }

  // Messages are automatically loaded by useMessages hook
  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversation && messages.length > 0 && user) {
      const uniqueSenders = Array.from(
        new Set(
          messages
            .filter((msg) => msg.sender_id !== user.id)
            .map((msg) => msg.sender_id)
        )
      )
      if (uniqueSenders.length > 0) {
        setSelectedConversation(uniqueSenders[0])
      }
    }
  }, [messages, user, selectedConversation])

  // Group messages by sender (conversations)
  const getConversations = () => {
    if (!user) return []
    
    // Get unique sender IDs (excluding current user)
    const uniqueSenders = Array.from(
      new Set(
        messages
          .filter((msg) => msg.sender_id !== user.id)
          .map((msg) => msg.sender_id)
      )
    )

    return uniqueSenders.map((senderId) => {
      const senderMessages = messages.filter((msg) => msg.sender_id === senderId)
      const lastMessage = senderMessages[senderMessages.length - 1]
      const unreadCount = senderMessages.filter((msg) => !msg.is_read && msg.sender_id !== user.id).length
      
      return {
        senderId,
        sender: lastMessage?.sender,
        lastMessage,
        unreadCount,
        messageCount: senderMessages.length,
      }
    }).sort((a, b) => {
      // Sort by last message time (newest first)
      const timeA = new Date(a.lastMessage?.created_at || 0).getTime()
      const timeB = new Date(b.lastMessage?.created_at || 0).getTime()
      return timeB - timeA
    })
  }

  // Get messages for selected conversation (owner view)
  const getConversationMessages = () => {
    if (!selectedConversation || !user) return []
    // Show messages from the selected sender and replies from the owner
    return messages.filter((msg) => 
      msg.sender_id === selectedConversation || 
      (msg.sender_id === user.id && messages.some(m => m.sender_id === selectedConversation))
    )
  }

  // Mark messages as read using hook function
  const markConversationAsRead = async (senderId: string) => {
    if (!user) return
    
    // Mark all unread messages from this sender
    const unreadMessages = messages.filter(
      msg => msg.sender_id === senderId && !msg.is_read && msg.sender_id !== user.id
    )
    
    for (const msg of unreadMessages) {
      await markAsRead(msg.id)
    }
  }

  useEffect(() => {
    if (selectedConversation && user) {
      markConversationAsRead(selectedConversation)
    }
  }, [selectedConversation, user])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRecorder) {
        audioRecorder.cancelRecording()
      }
      if (recordingTimer) {
        clearInterval(recordingTimer)
      }
    }
  }, [audioRecorder, recordingTimer])

  const startRecording = async () => {
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
      setRecordingTime(0)

      // Upload audio
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.opus')

      const response = await fetch('/api/upload-audio', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success) {
        // Send message with audio
        await sendMessageWithAudio(data.url)
      } else {
        throw new Error(data.error || 'فشل في رفع الصوت')
      }
    } catch (error: any) {
      console.error('حدث خطأ في تسجيل الصوت:', error)
      setIsRecording(false)
      setRecordingTime(0)
    } finally {
      setAudioRecorder(null)
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

  const sendMessageWithAudio = async (audioUrl: string) => {
    if (!user) return

    // Save values before clearing
    const messageContent = newMessage.trim()
    const messageReplyTo = replyingTo

    // Create temporary message ID
    const tempId = `temp-${Date.now()}`
    const tempMessage: any = {
      id: tempId,
      sender_id: user.id,
      place_id: placeId,
      content: messageContent || null,
      audio_url: audioUrl,
      reply_to: messageReplyTo?.id || null,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        full_name: user.user_metadata?.full_name || null,
        email: user.email || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      },
      replied_message: messageReplyTo || null,
    }

    // Add temporary message ID to sending set
    setSendingMessages((prev) => new Set(prev).add(tempId))
    setNewMessage('')
    setReplyingTo(null)

    try {
      // Determine recipient_id
      let recipientId = null
      if (selectedConversation) {
        recipientId = selectedConversation
      } else if (messageReplyTo) {
        recipientId = messageReplyTo.sender_id
      } else if (place && place.user_id === user.id) {
        recipientId = null
      } else {
        recipientId = place?.user_id || null
      }

      const messageData: any = {
        sender_id: user.id,
        place_id: placeId,
        recipient_id: recipientId,
        content: messageContent || null,
        audio_url: audioUrl,
        reply_to: messageReplyTo?.id || null,
      }

      const { data: msgData, error } = await supabase
        .from('messages')
        .insert(messageData as never)
        .select('*, sender:user_profiles(*)')
        .single()
      const newMessageData = msgData as (Message & { replied_message?: Message }) | null

      if (error) {
        console.error('Error sending message:', error)
        // Remove temporary message on error
        
        setSendingMessages((prev) => {
          const newSet = new Set(prev)
          newSet.delete(tempId)
          return newSet
        })
        return
      }

      // Load replied message if exists
      if (newMessageData && messageReplyTo) {
        newMessageData.replied_message = messageReplyTo
      }

      // Replace temporary message with real one
      
      setSendingMessages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
      
      // Reload messages to ensure we have the latest data
      await refreshMessages()
    } catch (error: any) {
      console.error('Error sending message:', error)
      // Remove temporary message on error
      
      setSendingMessages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
    }
  }

  const sendMessage = async () => {
    if (!user) return

    if (!newMessage.trim() && !selectedImage && !selectedProduct) return

    // Create temporary message ID
    const tempId = `temp-${Date.now()}`
    const messageContent = newMessage.trim()
    const messageImage = selectedImage
    const messageReplyTo = replyingTo
    const messageProduct = selectedProduct

    // Create temporary message
    const tempMessage: any = {
      id: tempId,
      sender_id: user.id,
      place_id: placeId,
      content: messageContent || null,
      image_url: messageImage ? URL.createObjectURL(messageImage) : null,
      product_id: messageProduct?.id || null,
      reply_to: messageReplyTo?.id || null,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: {
        id: user.id,
        full_name: user.user_metadata?.full_name || null,
        email: user.email || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      },
      replied_message: messageReplyTo || null,
      product: messageProduct || null,
    }

    // Add temporary message with loading state
    setSendingMessages((prev) => new Set(prev).add(tempId))
    setNewMessage('')
    setSelectedImage(null)
    setSelectedProduct(null)
    setReplyingTo(null)

    try {
      let imageUrl = null
      if (messageImage) {
        // Upload image to ImgBB
        const formData = new FormData()
        formData.append('image', messageImage)
        
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        })
        
        const data = await response.json()
        if (data.success) {
          imageUrl = data.url
        }
      }

      // Determine recipient_id
      // If there's a selected conversation, recipient is the conversation partner
      // Otherwise, if user is owner, recipient should be the last sender they're replying to
      let recipientId = null
      if (selectedConversation) {
        recipientId = selectedConversation
      } else if (messageReplyTo) {
        // If replying to a message, recipient is the sender of that message
        recipientId = messageReplyTo.sender_id
      } else if (place && place.user_id === user.id) {
        // If owner sending a message without conversation selected, we can't determine recipient
        // This case shouldn't happen as owner should use sidebar for messaging
        recipientId = null
      } else {
        // Client sending to owner - recipient is the place owner
        recipientId = place?.user_id || null
      }

      const messageData: any = {
        sender_id: user.id,
        place_id: placeId,
        recipient_id: recipientId,
        content: messageContent || null,
        reply_to: messageReplyTo?.id || null,
      }
      
      if (imageUrl) {
        messageData.image_url = imageUrl
      }

      if (messageProduct) {
        messageData.product_id = messageProduct.id
      }

      const { data: msgData2, error } = await supabase
        .from('messages')
        .insert(messageData as never)
        .select('*, sender:user_profiles(*)')
        .single()
      const newMessageData = msgData2 as (Message & { replied_message?: Message }) | null

      if (error) {
        console.error('Error sending message:', error)
        // Remove temporary message on error
        
        setSendingMessages((prev) => {
          const newSet = new Set(prev)
          newSet.delete(tempId)
          return newSet
        })
        return
      }

      // Load replied message if exists
      if (newMessageData && messageReplyTo) {
        newMessageData.replied_message = messageReplyTo
      }

      // Load product if exists
      if (newMessageData && messageProduct) {
        newMessageData.product = messageProduct
      } else if (newMessageData && newMessageData.product_id) {
        // Load product from database if not already loaded
        const { data: productData } = await supabase
          .from('products')
          .select('*, images:product_images(*), videos:product_videos(*), variants:product_variants(*)')
          .eq('id', newMessageData.product_id)
          .single()
        
        if (productData) {
          newMessageData.product = productData
        }
      }

      // Replace temporary message with real one
      
      setSendingMessages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
      
      // Reload messages to ensure we have the latest data
      await refreshMessages()
    } catch (error: any) {
      console.error('Error sending message:', error)
      // Remove temporary message on error
      
      setSendingMessages((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tempId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: colors.primary }}></div>
        <p className="mt-4" style={{ color: colors.onSurfaceVariant }}>جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <BodyMedium color="onSurfaceVariant">المكان غير موجود</BodyMedium>
      </div>
    )
  }

  const videoId = place.video_url ? extractYouTubeId(place.video_url) : null
  
  // Check if current user is the place owner
  const isOwner = user && place && user.id === place.user_id
  
  // Check if user can manage posts (owner or employee with messages_posts/full permissions)
  const canManagePosts = isOwner || (isEmployee && (employeePermissions === 'messages_posts' || employeePermissions === 'full'))
  
  // Check if user can manage products (owner or employee with full permissions)
  const canManageProducts = isOwner || (isEmployee && employeePermissions === 'full')
  
  // Delete post
  const handleDeletePost = async (postId: string) => {
    if (!canManagePosts) return
    
    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) return
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
      
      if (error) {
        console.error('Error deleting post:', error)
        showError('حدث خطأ في حذف المنشور')
        return
      }
      
      showSuccess('تم حذف المنشور بنجاح')
      loadPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      showError('حدث خطأ في حذف المنشور')
    }
  }
  
  // Handle image upload for post
  const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showError('الرجاء اختيار ملف صورة صحيح')
      return
    }

    if (file.size > 32 * 1024 * 1024) {
      showError('حجم الصورة كبير جداً. الحد الأقصى هو 32MB')
      return
    }

    setUploadingImage(true)
    showLoading('جاري رفع الصورة...')

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'حدث خطأ في رفع الصورة')
      }

      setPostData({ ...postData, image_url: result.url, post_type: 'image' })
      closeLoading()
      showSuccess('تم رفع الصورة بنجاح')
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في رفع الصورة')
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle video file select
  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      showError('الرجاء اختيار ملف فيديو صحيح')
      return
    }

    if (file.size > 2 * 1024 * 1024 * 1024) {
      showError('حجم الفيديو كبير جداً. الحد الأقصى هو 2GB')
      return
    }

    setSelectedVideoFile(file)
    if (!videoTitle) {
      setVideoTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  // Handle video upload to YouTube
  const handleVideoUpload = async () => {
    if (!selectedVideoFile || !videoTitle.trim()) {
      showError('الرجاء اختيار فيديو وإدخال عنوان')
      return
    }

    setUploadingVideo(true)
    showLoading('جاري رفع الفيديو إلى YouTube...')

    try {
      const formData = new FormData()
      formData.append('video', selectedVideoFile)
      formData.append('title', videoTitle)
      formData.append('description', postData.content || '')
      formData.append('tags', '')
      formData.append('privacyStatus', 'unlisted')

      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل رفع الفيديو')
      }

      if (data.videoUrl) {
        setPostData({ ...postData, video_url: data.videoUrl, post_type: 'video' })
        setSelectedVideoFile(null)
        setVideoTitle('')
        setVideoUploadMethod('link')
        closeLoading()
        showSuccess('تم رفع الفيديو بنجاح إلى YouTube')
      } else {
        throw new Error('لم يتم إرجاع رابط الفيديو من YouTube')
      }
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في رفع الفيديو. تأكد من ربط حساب YouTube في لوحة الإدارة.')
      console.error('YouTube upload error:', error)
    } finally {
      setUploadingVideo(false)
    }
  }

  // Handle save post
  const handleSavePost = async () => {
    if (!user || !place) return

    if (!postData.content.trim()) {
      showError('الرجاء إدخال محتوى المنشور')
      return
    }

    if (postData.post_type === 'image' && !postData.image_url) {
      showError('الرجاء رفع صورة')
      return
    }

    if (postData.post_type === 'video' && !postData.video_url) {
      if (videoUploadMethod === 'upload') {
        showError('الرجاء رفع الفيديو أولاً')
      } else {
        showError('الرجاء إدخال رابط الفيديو')
      }
      return
    }

      showLoading('جاري إضافة المنشور...')

    try {
      const postPayload: any = {
        place_id: placeId,
        created_by: user.id,
        content: postData.content.trim(),
        post_type: postData.post_type,
        is_active: true,
      }

      if (postData.post_type === 'image') {
        postPayload.image_url = postData.image_url
        postPayload.video_url = null
      } else if (postData.post_type === 'video') {
        postPayload.video_url = postData.video_url
        postPayload.image_url = null
      } else {
        postPayload.image_url = null
        postPayload.video_url = null
      }

      const { error } = await supabase
        .from('posts')
        .insert(postPayload)

      if (error) throw error

      showSuccess('تم إضافة المنشور بنجاح')
      closeLoading()
      setShowAddPostModal(false)
      setPostData({ content: '', post_type: 'text', image_url: '', video_url: '' })
      setSelectedVideoFile(null)
      setVideoTitle('')
      setVideoUploadMethod('link')
      loadPosts()
    } catch (error: any) {
      closeLoading()
      showError(error.message || 'حدث خطأ في إضافة المنشور')
    }
  }

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!canManageProducts) return
    
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
      
      if (error) {
        console.error('Error deleting product:', error)
        showError('حدث خطأ في حذف المنتج')
        return
      }
      
      showSuccess('تم حذف المنتج بنجاح')
      router.refresh()
    } catch (error) {
      console.error('Error deleting product:', error)
      showError('حدث خطأ في حذف المنتج')
    }
  }
  
  // Get messages for client view (only messages between client and place)
  const getClientMessages = () => {
    if (!user || isOwner) return []
    return messages.filter((msg) => msg.sender_id === user.id || msg.sender_id === place.user_id)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Place Header */}
        <div
          className="shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 rounded-2xl"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
        >
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
            {place.logo_url ? (
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <img
                  src={place.logo_url}
                  alt={place.name_ar}
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-cover rounded-lg border-2"
                  style={{ borderColor: colors.outline }}
                  onError={(e) => {
                    // Hide broken image and show placeholder
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent && !parent.querySelector('.logo-placeholder')) {
                      const placeholder = document.createElement('div')
                      placeholder.className = 'logo-placeholder w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-lg border-2 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold'
                      placeholder.style.background = `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`
                      placeholder.style.borderColor = colors.outline
                      placeholder.style.color = colors.onPrimary
                      placeholder.textContent = place.name_ar?.[0]?.toUpperCase() || 'M'
                      parent.appendChild(placeholder)
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div 
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-lg border-2 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold"
                  style={{
                    background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`,
                    borderColor: colors.outline,
                    color: colors.onPrimary,
                  }}
                >
                  {place.name_ar?.[0]?.toUpperCase() || 'M'}
                </div>
              </div>
            )}
            <div className="flex-1 text-center md:text-right">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4" style={{ color: colors.onSurfaceVariant }}>{place.name_ar}</h1>
              <p className="text-sm sm:text-base mb-3 sm:mb-4" style={{ color: colors.onSurfaceVariant }}>{place.description_ar}</p>
              
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm justify-center md:justify-start">
                <a
                  href={`tel:${place.phone_1}`}
                  className="flex items-center justify-center md:justify-start gap-2 transition-colors cursor-pointer hover:opacity-70"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  <Phone size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>{place.phone_1}</span>
                </a>
                {place.phone_2 && (
                  <a
                    href={`tel:${place.phone_2}`}
                    className="flex items-center justify-center md:justify-start gap-2 transition-colors cursor-pointer hover:opacity-70"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    <Phone size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span>{place.phone_2}</span>
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center md:justify-start gap-2 transition-colors cursor-pointer hover:opacity-70"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  <MapPin size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{place.address || 'العنوان غير متاح'}</span>
                </a>
              </div>
              
              {/* Employee Request and Message Buttons - Only for logged-in clients */}
              {user && !isOwner && (
                <div className="mt-4 flex justify-center md:justify-start gap-2 flex-wrap">
                  {!isEmployee && (
                    hasPendingRequest ? (
                      <div
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                      style={{ background: colors.warningContainer, color: colors.warning, borderColor: colors.outline }}
                    >
                        <CheckCircle size={18} />
                        <span className="text-sm font-medium">طلبك قيد المراجعة</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowEmployeeRequestModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors text-sm font-medium"
                        style={{ background: colors.primary, color: colors.onPrimary }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        <UserPlus size={18} />
                        <span>انضمام كموظف</span>
                      </button>
                    )
                  )}
                  <button
                    onClick={() => {
                      // Add openConversation query parameter to current URL without navigating away
                      const params = new URLSearchParams(searchParams.toString())
                      params.set('openConversation', placeId)
                      router.push(`/places/${placeId}?${params.toString()}`)
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors text-sm font-medium"
                    style={{ background: colors.secondary, color: colors.onSecondary }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <MessageCircle size={18} />
                    <span>إرسال رسالة</span>
                  </button>
                </div>
              )}

              {/* Video - Small inline video */}
              {videoId && (
                <div className="mt-4">
                  <TitleMedium style={{ color: colors.onSurface }} className="mb-2">فيديو المكان</TitleMedium>
                  <div className="aspect-video rounded-lg overflow-hidden max-w-sm mx-auto md:mx-0">
                    <iframe
                      src={getYouTubeEmbedUrl(videoId)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Employee Request Modal */}
        {showEmployeeRequestModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: colors.overlay }}>
            <div
              className="shadow-xl rounded-3xl max-w-md w-full p-6"
              style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <TitleLarge style={{ color: colors.onSurface }}>طلب انضمام كموظف</TitleLarge>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmployeeRequestModal(false)
                    setEmployeePhone('')
                  }}
                  className="transition-colors hover:opacity-70 p-2 rounded-full"
                  style={{ color: colors.onSurfaceVariant }}
                  aria-label="إغلاق"
                >
                  <X size={24} />
                </button>
              </div>
              <BodyMedium color="onSurfaceVariant" className="mb-4">
                أدخل رقم هاتفك لإرسال طلب الانضمام كموظف في {place.name_ar}
              </BodyMedium>
              <div className="mb-4">
                <LabelMedium style={{ color: colors.onSurface }} className="block mb-2">رقم الهاتف</LabelMedium>
                <Input
                  type="tel"
                  value={employeePhone}
                  onChange={(e) => setEmployeePhone(e.target.value)}
                  placeholder="مثال: 01234567890"
                  className="w-full"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="filled"  fullWidth onClick={handleEmployeeRequest}>
                  إرسال الطلب
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowEmployeeRequestModal(false)
                    setEmployeePhone('')
                  }}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Posts and Products Tabs */}
        <div
          className="shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 rounded-3xl"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
        >
          {/* Tabs */}
          <div
            className="flex flex-wrap justify-between items-center gap-3 mb-4 border-b"
            style={{ borderColor: colors.outline }}
          >
            <div className="flex gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className="px-3 sm:px-4 py-2.5 transition-colors border-b-2 rounded-t min-w-0"
                style={{
                  color: activeTab === 'posts' ? colors.primary : colors.onSurfaceVariant,
                  borderBottomColor: activeTab === 'posts' ? colors.primary : 'transparent',
                  marginBottom: '-1px',
                }}
                onMouseEnter={(e) => { if (activeTab !== 'posts') e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <LabelLarge as="span" style={{ color: 'inherit' }}>المنشورات ({posts.length})</LabelLarge>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className="px-3 sm:px-4 py-2.5 transition-colors border-b-2 rounded-t min-w-0"
                style={{
                  color: activeTab === 'products' ? colors.primary : colors.onSurfaceVariant,
                  borderBottomColor: activeTab === 'products' ? colors.primary : 'transparent',
                  marginBottom: '-1px',
                }}
                onMouseEnter={(e) => { if (activeTab !== 'products') e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <LabelLarge as="span" style={{ color: 'inherit' }}>المنتجات ({products.length})</LabelLarge>
              </button>
            </div>
            
            {/* Add Buttons */}
            {canManagePosts && activeTab === 'posts' && (
              <Button
                variant="filled"
                size="sm"
                onClick={() => setShowAddPostModal(true)}
                className="flex items-center gap-2 shrink-0"
              >
                <Plus size={16} />
                إضافة منشور
              </Button>
            )}
            {canManageProducts && activeTab === 'products' && (
              <Button
                variant="filled"
                size="sm"
                onClick={() => router.push(`/dashboard/places/${placeId}/products/new`)}
                className="flex items-center gap-2 shrink-0"
                style={{ backgroundColor: colors.secondary, color: colors.onSecondary }}
              >
                <Plus size={16} />
                إضافة منتج
              </Button>
            )}
          </div>

          {/* Posts Tab Content */}
          {activeTab === 'posts' && (
            <div>
              {posts.length === 0 ? (
                <BodyMedium color="onSurfaceVariant" className="text-center py-8">
                  لا توجد منشورات حالياً
                </BodyMedium>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="border rounded-2xl p-3 sm:p-4 relative transition-colors"
                      style={{ borderColor: colors.outline }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {/* Delete Button */}
                      {canManagePosts && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="absolute top-2 left-2 p-1.5 rounded-lg transition-all hover:scale-110"
                          style={{
                            backgroundColor: colors.error,
                            color: colors.onPrimary,
                          }}
                          title="حذف المنشور"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      
                      {/* Post Content */}
                      <BodySmall style={{ color: colors.onSurface }} className="mb-3 whitespace-pre-wrap">
                        {post.content}
                      </BodySmall>

                      {/* Post Image */}
                      {post.post_type === 'image' && post.image_url && (
                        <div className="mb-3">
                          <img
                            src={post.image_url}
                            alt="منشور"
                            className="w-full max-w-xl mx-auto rounded-lg"
                          />
                        </div>
                      )}

                      {/* Post Video */}
                      {post.post_type === 'video' && post.video_url && (
                        <div className="mb-3">
                          <div className="aspect-video rounded-lg overflow-hidden max-w-xl mx-auto">
                            {extractYouTubeId(post.video_url) ? (
                              <iframe
                                src={getYouTubeEmbedUrl(extractYouTubeId(post.video_url)!)}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={post.video_url}
                                controls
                                className="w-full h-full"
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Post Date */}
                      <BodySmall color="onSurfaceVariant" className="mt-2">
                        {new Date(post.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </BodySmall>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Products Tab Content */}
          {activeTab === 'products' && (
            <div>
              {products.length === 0 ? (
                <BodyMedium color="onSurfaceVariant" className="text-center py-8">
                  لا توجد منتجات حالياً
                </BodyMedium>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="border rounded-2xl p-4 transition-all relative"
                      style={{
                        borderColor: colors.outline,
                        ...(productId === product.id ? { boxShadow: `0 0 0 2px ${colors.primary}` } : {}),
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.surfaceContainer }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {/* Delete Button */}
                      {canManageProducts && (
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="absolute top-2 left-2 p-2 rounded-lg transition-all hover:scale-110 z-10"
                          style={{
                            backgroundColor: colors.error,
                            color: colors.onPrimary,
                          }}
                          title="حذف المنتج"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name_ar}
                          className="w-full h-40 sm:h-48 object-cover rounded-lg mb-2 sm:mb-3"
                        />
                      )}
                      <TitleMedium style={{ color: colors.onSurface }} className="mb-1.5 sm:mb-2">
                        {product.name_ar}
                      </TitleMedium>
                      <BodySmall color="onSurfaceVariant" className="mb-2 line-clamp-2">{product.description_ar}</BodySmall>
                      {product.price && (
                        <BodyMedium style={{ color: colors.primary }} className="font-semibold">
                          {product.price} {product.currency}
                        </BodyMedium>
                      )}
                      {product.variants && product.variants.length > 0 && (
                        <div className="mt-2">
                          <BodySmall color="onSurfaceVariant" className="mb-1">المتغيرات المتاحة:</BodySmall>
                          <div className="flex flex-wrap gap-2">
                            {product.variants.map((variant) => (
                              <span
                                key={variant.id}
                                className="px-2 py-1 rounded text-xs"
                                style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurface }}
                              >
                                {variant.variant_name_ar}: {variant.variant_value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Add Post Modal */}
      {showAddPostModal && canManagePosts && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: colors.overlay }}>
          <div
            className="shadow-xl rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: colors.surface, border: `1px solid ${colors.outline}` }}
          >
            <div
              className="sticky top-0 p-4 flex items-center justify-between border-b"
              style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
            >
              <TitleLarge style={{ color: colors.onSurface }}>إضافة منشور جديد</TitleLarge>
              <button
                type="button"
                onClick={() => {
                  setShowAddPostModal(false)
                  setPostData({ content: '', post_type: 'text', image_url: '', video_url: '' })
                  setSelectedVideoFile(null)
                  setVideoTitle('')
                  setVideoUploadMethod('link')
                }}
                className="transition-colors hover:opacity-70 p-2 rounded-full"
                style={{ color: colors.onSurfaceVariant }}
                aria-label="إغلاق"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Post Type Selection */}
              <div>
                <LabelMedium style={{ color: colors.onSurfaceVariant }} className="block mb-2">نوع المنشور</LabelMedium>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPostData({ ...postData, post_type: 'text', image_url: '', video_url: '' })}
                    className="px-4 py-2 rounded-xl transition-colors"
                    style={
                      postData.post_type === 'text'
                        ? { background: colors.primary, color: colors.onPrimary }
                        : { background: colors.surfaceContainer, color: colors.onSurface }
                    }
                  >
                    نص
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostData({ ...postData, post_type: 'image', video_url: '' })}
                    className="px-4 py-2 rounded-xl transition-colors"
                    style={
                      postData.post_type === 'image'
                        ? { background: colors.primary, color: colors.onPrimary }
                        : { background: colors.surfaceContainer, color: colors.onSurface }
                    }
                  >
                    صورة
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostData({ ...postData, post_type: 'video', image_url: '' })}
                    className="px-4 py-2 rounded-xl transition-colors"
                    style={
                      postData.post_type === 'video'
                        ? { background: colors.primary, color: colors.onPrimary }
                        : { background: colors.surfaceContainer, color: colors.onSurface }
                    }
                  >
                    فيديو
                  </button>
                </div>
              </div>

              {/* Content */}
              <div>
                <LabelMedium style={{ color: colors.onSurfaceVariant }} className="block mb-2">المحتوى</LabelMedium>
                <textarea
                  value={postData.content}
                  onChange={(e) => setPostData({ ...postData, content: e.target.value })}
                  placeholder="اكتب محتوى المنشور هنا..."
                  rows={6}
                  className="w-full px-4 py-2 rounded-2xl border-2 transition-colors focus:outline-none"
                  style={{ backgroundColor: colors.surface, borderColor: colors.outline, color: colors.onSurface }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
                />
              </div>

              {/* Image Upload */}
              {postData.post_type === 'image' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                    الصورة
                  </label>
                  {postData.image_url ? (
                    <div className="relative inline-block">
                      <img
                        src={postData.image_url}
                        alt="Preview"
                        className="max-w-full h-64 object-contain rounded-lg border"
                        style={{ borderColor: colors.outline }}
                      />
                      <button
                        onClick={() => setPostData({ ...postData, image_url: '' })}
                        className="absolute top-2 right-2 rounded-full p-1 transition-all hover:scale-110"
                        style={{
                          backgroundColor: colors.error,
                          color: colors.onPrimary,
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:opacity-90"
                      style={{ borderColor: colors.outline, backgroundColor: colors.surfaceContainer }}
                    >
                      <ImageIcon className="w-8 h-8 mb-2" style={{ color: colors.onSurfaceVariant }} />
                      <BodySmall color="onSurfaceVariant" className="text-sm">
                        {uploadingImage ? 'جاري الرفع...' : 'انقر لرفع صورة'}
                      </BodySmall>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePostImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Video Upload/Link */}
              {postData.post_type === 'video' && (
                <div className="space-y-4">
                  {/* Video Method Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                      طريقة إضافة الفيديو
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setVideoUploadMethod('link')
                          setSelectedVideoFile(null)
                          setVideoTitle('')
                        }}
                        className="px-4 py-2 rounded-lg transition-colors"
                        style={videoUploadMethod === 'link' ? { background: colors.primary, color: colors.onPrimary } : { background: colors.surfaceContainer, color: colors.onSurface }}
                      >
                        رابط YouTube
                      </button>
                      <button
                        onClick={() => {
                          setVideoUploadMethod('upload')
                          setPostData({ ...postData, video_url: '' })
                        }}
                        className="px-4 py-2 rounded-lg transition-colors"
                        style={videoUploadMethod === 'upload' ? { background: colors.primary, color: colors.onPrimary } : { background: colors.surfaceContainer, color: colors.onSurface }}
                      >
                        رفع من الجهاز
                      </button>
                    </div>
                  </div>

                  {/* Video Link Method */}
                  {videoUploadMethod === 'link' && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                        رابط الفيديو (YouTube)
                      </label>
                      <input
                        type="text"
                        value={postData.video_url}
                        onChange={(e) => setPostData({ ...postData, video_url: e.target.value })}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full px-4 py-2 rounded-2xl border-2 transition-colors focus:outline-none"
                  style={{ backgroundColor: colors.surface, borderColor: colors.outline, color: colors.onSurface }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
                      />
                    </div>
                  )}

                  {/* Video Upload Method */}
                  {videoUploadMethod === 'upload' && (
                    <div className="space-y-4">
                      {/* File Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                          اختر فيديو للرفع *
                        </label>
                        {selectedVideoFile ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: colors.surfaceContainer }}>
                              <Video size={20} style={{ color: colors.onSurfaceVariant }} />
                              <div className="flex-1">
                                <BodySmall style={{ color: colors.onSurface }} className="font-medium">
                                  {selectedVideoFile!.name}
                                </BodySmall>
                                <BodySmall color="onSurfaceVariant" className="text-xs">
                                  الحجم: {(selectedVideoFile!.size / (1024 * 1024)).toFixed(2)} MB
                                </BodySmall>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedVideoFile(null)
                                  setVideoTitle('')
                                }}
                                className="transition-colors hover:opacity-70"
                                style={{ color: colors.error }}
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <button
                              onClick={handleVideoUpload}
                              disabled={uploadingVideo || !videoTitle.trim()}
                              className="w-full px-4 py-2 rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
                              style={{ background: (uploadingVideo || !videoTitle.trim()) ? colors.onSurfaceVariant : colors.secondary, color: (uploadingVideo || !videoTitle.trim()) ? colors.onSurface : colors.onSecondary }}
                              onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '0.9')}
                              onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '1')}
                            >
                              {uploadingVideo ? 'جاري الرفع...' : 'رفع الفيديو إلى YouTube'}
                            </button>
                          </div>
                        ) : (
                          <label
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:opacity-90"
                          style={{ borderColor: colors.outline, backgroundColor: colors.surfaceContainer }}
                        >
                            <Upload className="w-8 h-8 mb-2" style={{ color: colors.onSurfaceVariant }} />
                            <BodySmall color="onSurfaceVariant" className="text-sm">
                              انقر لاختيار فيديو
                            </BodySmall>
                            <BodySmall color="onSurfaceVariant" className="text-xs mt-1">
                              الحد الأقصى: 2GB
                            </BodySmall>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={handleVideoFileSelect}
                              className="hidden"
                              disabled={uploadingVideo}
                            />
                          </label>
                        )}
                      </div>

                      {/* Video Title */}
                      {selectedVideoFile && (
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.onSurfaceVariant }}>
                            عنوان الفيديو *
                          </label>
                          <input
                            type="text"
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            placeholder="أدخل عنوان الفيديو"
                            className="w-full px-4 py-2 rounded-2xl border-2 transition-colors focus:outline-none"
                  style={{ backgroundColor: colors.surface, borderColor: colors.outline, color: colors.onSurface }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
                            maxLength={100}
                          />
                          <BodySmall color="onSurfaceVariant" className="mt-1">
                            {videoTitle.length}/100
                          </BodySmall>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSavePost}
                  disabled={uploadingImage || uploadingVideo || !postData.content.trim() || (postData.post_type === 'video' && videoUploadMethod === 'upload' && !postData.video_url)}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
                  style={{ background: (uploadingImage || uploadingVideo || !postData.content.trim() || (postData.post_type === 'video' && videoUploadMethod === 'upload' && !postData.video_url)) ? colors.onSurfaceVariant : colors.primary, color: colors.onPrimary }}
                  onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.opacity = '1')}
                >
                  {uploadingVideo ? 'جاري الرفع...' : 'إضافة المنشور'}
                </button>
                <button
                  onClick={() => {
                    setShowAddPostModal(false)
                    setPostData({ content: '', post_type: 'text', image_url: '', video_url: '' })
                    setSelectedVideoFile(null)
                    setVideoTitle('')
                    setVideoUploadMethod('link')
                  }}
                  className="px-4 py-2 rounded-xl transition-colors"
                  style={{ backgroundColor: colors.surfaceContainer, color: colors.onSurface }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Enlargement Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: colors.overlay }}
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-12 right-0 hover:opacity-70 transition-opacity"
              style={{ color: colors.onPrimary }}
              aria-label="إغلاق"
            >
              <X size={32} />
            </button>
            <img
              src={enlargedImage}
              alt="Enlarged"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Product Picker Bottom Sheet */}
      {showProductPicker && isOwner && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: colors.overlay }}
            onClick={() => setShowProductPicker(false)}
          />
          {/* Bottom Sheet */}
          <div
          className="fixed bottom-0 left-0 right-0 rounded-t-2xl shadow-2xl z-50 max-h-[80vh] flex flex-col animate-slide-up"
          style={{ backgroundColor: colors.surface, borderTop: `1px solid ${colors.outline}` }}
        >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 rounded-full" style={{ background: colors.outline }} />
            </div>
            
            {/* Header */}
            <div className="px-4 pb-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold" style={{ color: colors.onSurfaceVariant }}>اختر منتج للمشاركة</h3>
                <button
                  onClick={() => setShowProductPicker(false)}
                  className="p-2 rounded-full transition-colors hover:opacity-80"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {products.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product)
                        setShowProductPicker(false)
                      }}
                      className="p-3 border-2 rounded-xl text-right transition-all hover:opacity-90"
                      style={{
                        borderColor: selectedProduct?.id === product.id ? colors.primary : colors.outline,
                        backgroundColor: selectedProduct?.id === product.id ? `rgba(${colors.primaryRgb}, 0.1)` : 'transparent',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = selectedProduct?.id === product.id ? `rgba(${colors.primaryRgb}, 0.15)` : colors.surfaceContainer }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selectedProduct?.id === product.id ? `rgba(${colors.primaryRgb}, 0.1)` : 'transparent' }}
                    >
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0].image_url}
                          alt={product.name_ar}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      )}
                      <p className="text-sm font-semibold truncate mb-1" style={{ color: colors.onSurfaceVariant }}>
                        {product.name_ar}
                      </p>
                      {product.price && (
                        <p className="text-xs font-bold" style={{ color: colors.primary }}>
                          {product.price} {product.currency}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package size={48} className="mx-auto mb-4" style={{ color: colors.onSurfaceVariant }} />
                  <BodyMedium color="onSurfaceVariant">لا توجد منتجات متاحة</BodyMedium>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function PlacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="جاري التحميل..." />
      </div>
    }>
      <ProductIdHandler>
        {(productId) => <PlacePageContent productId={productId} />}
      </ProductIdHandler>
    </Suspense>
  )
}
