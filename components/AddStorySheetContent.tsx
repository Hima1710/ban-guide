'use client'

import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { addStory } from '@/lib/api/stories'
import { useUploadImage } from '@/hooks/useUploadImage'
import { showError, showSuccess, showLoading, closeLoading } from '@/components/SweetAlert'
import { Button, BodySmall } from '@/components/m3'
import YouTubeUpload from '@/components/YouTubeUpload'
import { Upload } from 'lucide-react'

interface AddStorySheetContentProps {
  placeId: string
  onSuccess: () => void
  onCancel: () => void
}

/**
 * محتوى شيت إضافة الحالة – M3، يستخدم دوال الرفع الموحدة (useUploadImage، YouTube).
 * يُستدعى من AddStoryContext داخل BottomSheet.
 */
export default function AddStorySheetContent({ placeId, onSuccess, onCancel }: AddStorySheetContentProps) {
  const { colors } = useTheme()
  const { uploadImage, isUploading: uploadingImage } = useUploadImage()
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    showLoading('جاري رفع الحالة...')
    try {
      const url = await uploadImage(file)
      if (!url) {
        showError('فشل رفع الصورة')
        closeLoading()
        return
      }
      const added = await addStory({ place_id: placeId, media_url: url, media_type: 'image' })
      if (added) {
        showSuccess('تم إضافة الحالة')
        closeLoading()
        onSuccess()
      } else {
        showError('فشل حفظ الحالة')
        closeLoading()
      }
    } catch (err: any) {
      showError(err?.message || 'فشل رفع الحالة')
      closeLoading()
    }
  }

  const handleVideoUploaded = async (videoUrl: string) => {
    showLoading('جاري إضافة الحالة...')
    try {
      const added = await addStory({ place_id: placeId, media_url: videoUrl, media_type: 'video' })
      if (added) {
        showSuccess('تم إضافة الحالة')
        closeLoading()
        onSuccess()
      } else {
        showError('فشل حفظ الحالة')
        closeLoading()
      }
    } catch (err: any) {
      showError(err?.message || 'فشل إضافة الحالة')
      closeLoading()
    }
  }

  return (
    <div className="space-y-4">
      <BodySmall color="onSurfaceVariant">
        الحالات تظهر للمتابعين 24 ساعة. صورة أو فيديو (يوتيوب).
      </BodySmall>

      <div className="flex gap-2">
        <Button
          variant={mediaType === 'image' ? 'filled' : 'outlined'}
          size="md"
          onClick={() => setMediaType('image')}
        >
          صورة
        </Button>
        <Button
          variant={mediaType === 'video' ? 'filled' : 'outlined'}
          size="md"
          onClick={() => setMediaType('video')}
        >
          فيديو (يوتيوب)
        </Button>
      </div>

      {mediaType === 'image' ? (
        <label
          className="flex flex-col items-center justify-center min-h-[140px] border-2 border-dashed rounded-xl cursor-pointer transition-colors"
          style={{ borderColor: colors.outline }}
        >
          <Upload size={36} className="mb-2" style={{ color: colors.onSurfaceVariant }} />
          <BodySmall color="onSurfaceVariant">
            {uploadingImage ? 'جاري الرفع...' : 'اختر صورة'}
          </BodySmall>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            disabled={uploadingImage}
          />
        </label>
      ) : (
        <YouTubeUpload
          onVideoUploaded={handleVideoUploaded}
          maxVideos={1}
          currentVideos={0}
          allowReplace={true}
        />
      )}

      <Button variant="outlined" size="md" onClick={onCancel} className="w-full">
        إلغاء
      </Button>
    </div>
  )
}
