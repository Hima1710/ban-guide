'use client'

import { useState } from 'react'
import { showError, showSuccess, showLoading, closeLoading } from './SweetAlert'
import { Upload, X } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { BodySmall, LabelMedium } from '@/components/m3'
import { Input } from '@/components/common'

interface YouTubeUploadProps {
  onVideoUploaded: (videoUrl: string) => void
  maxVideos?: number
  currentVideos?: number
  allowReplace?: boolean // السماح باستبدال الفيديو الموجود
}

export default function YouTubeUpload({
  onVideoUploaded,
  maxVideos = 1,
  currentVideos = 0,
  allowReplace = false,
}: YouTubeUploadProps) {
  const { colors } = useTheme()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // Default privacy status: unlisted (غير مدرج)
  const privacyStatus: 'unlisted' = 'unlisted'

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 2GB for YouTube)
      if (file.size > 2 * 1024 * 1024 * 1024) {
        showError('حجم الفيديو كبير جداً. الحد الأقصى هو 2GB')
        return
      }

      // Check file type
      if (!file.type.startsWith('video/')) {
        showError('الرجاء اختيار ملف فيديو صحيح')
        return
      }

      setSelectedFile(file)
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      showError('الرجاء اختيار فيديو وإدخال عنوان')
      return
    }

    // السماح بالرفع إذا كان في وضع الاستبدال (التعديل)
    if (!allowReplace && currentVideos >= maxVideos) {
      showError(`تم الوصول للحد الأقصى من الفيديوهات (${maxVideos})`)
      return
    }

    try {
      setUploading(true)
      showLoading('جاري رفع الفيديو إلى YouTube...')

      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('title', title)
      formData.append('description', description)
      formData.append('tags', tags)
      formData.append('privacyStatus', 'unlisted') // Default: unlisted (غير مدرج)

      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'فشل رفع الفيديو')
      }

      if (data.videoUrl) {
        closeLoading()
        showSuccess('تم رفع الفيديو بنجاح إلى YouTube')
        onVideoUploaded(data.videoUrl)
        // Reset form
        setSelectedFile(null)
        setTitle('')
        setDescription('')
        setTags('')
      } else {
        throw new Error('لم يتم إرجاع رابط الفيديو من YouTube')
      }
    } catch (error: any) {
      closeLoading()
      const errorMessage = error.message || 'حدث خطأ في رفع الفيديو. تأكد من ربط حساب YouTube في لوحة الإدارة.'
      showError(errorMessage)
      console.error('YouTube upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="p-4 border rounded-2xl"
        style={{ background: colors.infoContainer, borderColor: colors.primary }}
      >
        <BodySmall style={{ color: colors.primary }}>
          <strong>ملاحظة:</strong> جميع الفيديوهات تُرفع على حساب YouTube الخاص بالموقع. لا حاجة لربط حساب YouTube شخصي.
        </BodySmall>
      </div>

      <div>
        <LabelMedium style={{ color: colors.onSurface }} className="block mb-2">اختر فيديو للرفع *</LabelMedium>
        <div
          className="border-2 border-dashed rounded-2xl p-6 text-center transition-colors"
          style={{ borderColor: colors.outline }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.primary }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.outline }}
        >
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="video-upload"
            disabled={uploading}
          />
          <label
            htmlFor="video-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload size={32} style={{ color: colors.onSurfaceVariant }} />
            <BodySmall color="onSurfaceVariant" className="text-sm">
              {selectedFile ? selectedFile.name : 'انقر لاختيار فيديو'}
            </BodySmall>
            <BodySmall color="onSurfaceVariant" className="text-xs">الحد الأقصى: 2GB</BodySmall>
          </label>
        </div>
        {selectedFile && (
          <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: colors.onSurfaceVariant }}>
            <span>الحجم: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="p-2 rounded-full hover:opacity-80 transition-opacity"
              style={{ color: colors.error }}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <div>
        <LabelMedium style={{ color: colors.onSurface }} className="block mb-2">عنوان الفيديو *</LabelMedium>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="أدخل عنوان الفيديو"
          className="w-full"
          maxLength={100}
        />
        <BodySmall color="onSurfaceVariant" className="mt-1">{title.length}/100</BodySmall>
      </div>

      <div>
        <LabelMedium style={{ color: colors.onSurface }} className="block mb-2">وصف الفيديو (اختياري)</LabelMedium>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="أدخل وصف الفيديو"
          rows={4}
          className="w-full px-4 py-2.5 rounded-2xl border-2 transition-colors focus:outline-none"
          style={{ backgroundColor: colors.surface, borderColor: colors.outline, color: colors.onSurface }}
          onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary }}
          onBlur={(e) => { e.currentTarget.style.borderColor = colors.outline }}
          maxLength={5000}
        />
        <BodySmall color="onSurfaceVariant" className="mt-1">{description.length}/5000</BodySmall>
      </div>

      <div>
        <LabelMedium style={{ color: colors.onSurface }} className="block mb-2">العلامات (Tags) - مفصولة بفواصل</LabelMedium>
        <Input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="مثال: منتج، تسوق، عرض"
          className="w-full"
        />
      </div>

      <button
        type="button"
        onClick={handleUpload}
        disabled={!selectedFile || !title.trim() || uploading || (!allowReplace && currentVideos >= maxVideos)}
        className="w-full px-4 py-3 rounded-xl disabled:cursor-not-allowed transition-opacity font-semibold"
        style={{
          background: !selectedFile || !title.trim() || uploading || (!allowReplace && currentVideos >= maxVideos)
            ? colors.onSurfaceVariant
            : colors.primary,
          color: colors.onPrimary,
        }}
      >
        {uploading ? 'جاري الرفع...' : allowReplace && currentVideos > 0 ? 'استبدال الفيديو' : 'رفع الفيديو إلى YouTube'}
      </button>

      {!allowReplace && currentVideos >= maxVideos && (
        <BodySmall color="error" className="text-sm text-center block">
          تم الوصول للحد الأقصى من الفيديوهات ({maxVideos})
        </BodySmall>
      )}
    </div>
  )
}
