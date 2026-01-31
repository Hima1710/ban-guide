'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button, TitleSmall } from '@/components/m3'
import type { PlaceStory } from '@/lib/types'

const STORY_DURATION_MS = 7000

interface StoryViewerProps {
  placeName: string | null
  placeLogo: string | null
  stories: PlaceStory[]
  onClose: () => void
}

export default function StoryViewer({ placeName, placeLogo, stories, onClose }: StoryViewerProps) {
  const { colors } = useTheme()
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef<number>(Date.now())
  const current = stories[index] ?? null

  const goNext = useCallback(() => {
    if (index < stories.length - 1) {
      setIndex((i) => i + 1)
      setProgress(0)
      startTimeRef.current = Date.now()
    } else onClose()
  }, [index, stories.length, onClose])

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1)
      setProgress(0)
      startTimeRef.current = Date.now()
    } else onClose()
  }, [index, onClose])

  useEffect(() => {
    if (!current) return
    const t = setTimeout(goNext, STORY_DURATION_MS)
    return () => clearTimeout(t)
  }, [current?.id, goNext])

  useEffect(() => {
    startTimeRef.current = Date.now()
    setProgress(0)
  }, [index])

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const p = Math.min(100, (elapsed / STORY_DURATION_MS) * 100)
      setProgress(p)
    }, 50)
    return () => clearInterval(interval)
  }, [index])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (stories.length === 0) {
    onClose()
    return null
  }

  const barBg = 'rgba(255,255,255,0.3)'
  const headerBg = 'rgba(0,0,0,0.5)'

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col"
      style={{ backgroundColor: colors.surface }}
    >
      {/* شريط التقدم — يتقدّم مع الوقت (7 ثوانٍ للحالة الواحدة) */}
      <div
        className="flex gap-1 p-2 px-4 safe-area-top"
        style={{ backgroundColor: headerBg }}
      >
        {stories.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full overflow-hidden"
            style={{ backgroundColor: barBg }}
          >
            <div
              className="h-full rounded-full transition-none"
              style={{
                width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                backgroundColor: colors.primary,
              }}
            />
          </div>
        ))}
      </div>

      {/* هيدر: اسم المكان + إغلاق — خلفية داكنة وواضحة فوق المحتوى */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ backgroundColor: headerBg, color: '#fff' }}
      >
        <div className="flex items-center gap-2">
          {placeLogo ? (
            <img
              src={placeLogo}
              alt=""
              className="w-8 h-8 rounded-full object-cover border-2"
              style={{ borderColor: colors.primary }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
            >
              {placeName?.[0] ?? '?'}
            </div>
          )}
          <TitleSmall as="span" style={{ color: '#fff' }}>
            {placeName ?? 'مكان'}
          </TitleSmall>
        </div>
        <Button
          variant="text"
          size="sm"
          onClick={onClose}
          className="!min-h-0 !p-2 w-9 h-9 shrink-0 rounded-full"
          style={{ color: '#fff' }}
          aria-label="إغلاق"
        >
          <X size={20} />
        </Button>
      </div>

      {/* المحتوى: صورة أو فيديو */}
      <div
        className="flex-1 flex items-center justify-center min-h-0 relative"
        style={{ backgroundColor: colors.background }}
      >
        {current?.media_type === 'image' && (
          <img
            src={current.media_url}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        )}
        {current?.media_type === 'video' && (
          <video
            src={current.media_url}
            className="max-w-full max-h-full object-contain"
            autoPlay
            playsInline
            muted
            onEnded={goNext}
          />
        )}

        {/* نقر يمين/يسار للمتابعة/السابق (في RTL: اليمين = السابق، اليسار = التالي) */}
        <button
          type="button"
          className="absolute inset-y-0 start-0 w-1/3 cursor-pointer"
          onClick={goPrev}
          aria-label="الحالة السابقة"
        />
        <button
          type="button"
          className="absolute inset-y-0 end-0 w-1/3 cursor-pointer"
          onClick={goNext}
          aria-label="الحالة التالية"
        />
      </div>
    </div>
  )
}
