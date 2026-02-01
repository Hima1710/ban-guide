'use client'

import { useRef, useState, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/m3'
import { Upload, Video, X, Square } from 'lucide-react'

export interface VideoPickerProps {
  /** يُستدعى عند اختيار فيديو (من الجهاز أو تسجيل) — الملف يُرفع من الأب */
  onVideoSelected: (file: File) => void
  /** تعطيل الأزرار */
  disabled?: boolean
  /** تسمية اختيارية */
  label?: string
}

/**
 * مكون موحد لاختيار الفيديو: رفع من الجهاز أو تصوير فيديو.
 * يستخدم useTheme() و Button من النظام الموحد.
 */
export default function VideoPicker({
  onVideoSelected,
  disabled = false,
  label = 'فيديو',
}: VideoPickerProps) {
  const { colors } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [recordingOpen, setRecordingOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (!file.type.startsWith('video/')) {
        alert('الرجاء اختيار ملف فيديو صحيح')
        return
      }
      onVideoSelected(file)
      e.target.value = ''
    },
    [onVideoSelected]
  )

  const startRecordingUI = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      })
      setStream(mediaStream)
      setRecordingOpen(true)
      setRecordedChunks([])
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = mediaStream
      }, 100)
    } catch (err) {
      console.error('Camera/mic error:', err)
      if (err instanceof Error && err.name === 'NotAllowedError') {
        alert('يجب السماح بالكاميرا والميكروفون لتصوير فيديو')
      } else {
        alert('تعذر فتح الكاميرا أو الميكروفون')
      }
    }
  }, [])

  const stopRecordingUI = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop())
    setStream(null)
    setRecordingOpen(false)
    setRecording(false)
    setRecordedChunks([])
    mediaRecorderRef.current = null
  }, [stream])

  const startRecording = useCallback(() => {
    if (!stream) return
    const recorder = new MediaRecorder(stream)
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    recorder.onstop = () => {
      setRecordedChunks(chunks)
    }
    recorder.start(1000)
    mediaRecorderRef.current = recorder
    setRecording(true)
  }, [stream])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state !== 'recording') return
    recorder.stop()
    setRecording(false)
  }, [])

  const confirmRecordedVideo = useCallback(() => {
    if (recordedChunks.length === 0) return
    const blob = new Blob(recordedChunks, { type: 'video/webm' })
    const file = new File([blob], `video-${Date.now()}.webm`, {
      type: 'video/webm',
    })
    onVideoSelected(file)
    stopRecordingUI()
  }, [recordedChunks, onVideoSelected, stopRecordingUI])

  return (
    <div>
      <label
        className="block text-sm font-medium mb-2"
        style={{ color: colors.onSurface }}
      >
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outlined"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="inline-flex items-center gap-2"
        >
          <Upload size={18} />
          رفع من الجهاز
        </Button>
        <Button
          type="button"
          variant="outlined"
          size="sm"
          onClick={startRecordingUI}
          disabled={disabled}
          className="inline-flex items-center gap-2"
        >
          <Video size={18} />
          تصوير فيديو
        </Button>
      </div>

      {/* شاشة التصوير */}
      {recordingOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
          style={{ backgroundColor: colors.surface }}
        >
          <div className="flex justify-between items-center w-full max-w-md mb-4">
            <span style={{ color: colors.onSurface }}>
              {recording ? 'جاري التسجيل...' : 'تصوير فيديو'}
            </span>
            <Button
              type="button"
              variant="text"
              size="sm"
              onClick={stopRecordingUI}
              className="!min-h-0 !p-2"
            >
              <X size={24} />
            </Button>
          </div>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={recording}
            className="w-full max-w-md rounded-lg border"
            style={{ borderColor: colors.outline }}
          />
          <div className="flex gap-4 mt-4">
            {!recording && recordedChunks.length === 0 && (
              <>
                <Button type="button" variant="outlined" onClick={stopRecordingUI}>
                  إلغاء
                </Button>
                <Button type="button" variant="filled" onClick={startRecording}>
                  بدء التسجيل
                </Button>
              </>
            )}
            {recording && (
              <Button
                type="button"
                variant="danger"
                onClick={stopRecording}
                className="inline-flex items-center gap-2"
              >
                <Square size={18} />
                إيقاف
              </Button>
            )}
            {!recording && recordedChunks.length > 0 && (
              <>
                <Button type="button" variant="outlined" onClick={startRecordingUI}>
                  إعادة
                </Button>
                <Button type="button" variant="filled" onClick={confirmRecordedVideo}>
                  استخدام الفيديو
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
