'use client'

import { useRef, useState, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/m3'
import { Upload, Camera, X } from 'lucide-react'

export interface ImagePickerProps {
  /** يُستدعى عند اختيار صور (من الجهاز أو من الكاميرا) */
  onImagesSelected: (files: File[]) => void
  /** الحد الأقصى لعدد الصور (للعرض فقط؛ التحقق من الطول يتم في الأب) */
  maxFiles?: number
  /** عدد الصور الحالية (للعرض مثل 2/5) */
  currentCount?: number
  /** تعطيل الأزرار عند الوصول للحد */
  disabled?: boolean
  /** تسمية اختيارية */
  label?: string
}

/**
 * مكون موحد لاختيار الصور: رفع من الجهاز أو التقاط بالكاميرا.
 * يستخدم useTheme() و Button من النظام الموحد.
 */
export default function ImagePicker({
  onImagesSelected,
  maxFiles = 5,
  currentCount = 0,
  disabled = false,
  label = 'الصور',
}: ImagePickerProps) {
  const { colors } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files?.length) return
      const list = Array.from(files)
      onImagesSelected(list)
      e.target.value = ''
    },
    [onImagesSelected]
  )

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      setStream(mediaStream)
      setCameraOpen(true)
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = mediaStream
      }, 100)
    } catch (err) {
      console.error('Camera error:', err)
      if (err instanceof Error && err.name === 'NotAllowedError') {
        alert('يجب السماح بالوصول إلى الكاميرا لالتقاط صورة')
      } else {
        alert('تعذر فتح الكاميرا')
      }
    }
  }, [])

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    setCameraOpen(false)
  }, [stream])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video || !stream) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })
        onImagesSelected([file])
        stopCamera()
      },
      'image/jpeg',
      0.9
    )
  }, [stream, onImagesSelected, stopCamera])

  const atLimit = disabled || (maxFiles > 0 && currentCount >= maxFiles)

  return (
    <div>
      <label
        className="block text-sm font-medium mb-2"
        style={{ color: colors.onSurface }}
      >
        {label} ({currentCount}/{maxFiles})
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outlined"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={atLimit}
          className="inline-flex items-center gap-2"
        >
          <Upload size={18} />
          رفع من الجهاز
        </Button>
        <Button
          type="button"
          variant="outlined"
          size="sm"
          onClick={startCamera}
          disabled={atLimit}
          className="inline-flex items-center gap-2"
        >
          <Camera size={18} />
          التقاط صورة
        </Button>
      </div>

      {/* كاميرا: معاينة + التقاط */}
      {cameraOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <div className="flex justify-between items-center w-full max-w-md mb-4">
            <span style={{ color: colors.onSurface }}>التقاط صورة</span>
            <Button
              type="button"
              variant="text"
              size="sm"
              onClick={stopCamera}
              className="!min-h-0 !p-2"
            >
              <X size={24} />
            </Button>
          </div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-w-md rounded-lg border"
            style={{ borderColor: colors.outline }}
          />
          <div className="flex gap-4 mt-4">
            <Button type="button" variant="outlined" onClick={stopCamera}>
              إلغاء
            </Button>
            <Button type="button" variant="filled" onClick={capturePhoto}>
              التقاط
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
