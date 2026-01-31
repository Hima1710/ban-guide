/**
 * Hook رفع الصور الموحد – يستخدم /api/upload-image في كل النظام
 * بدون Supabase Storage.
 */

import { useState, useCallback } from 'react'
import { uploadImageFile } from '@/lib/api/upload'

export function useUploadImage() {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true)
    setError(null)
    try {
      const url = await uploadImageFile(file)
      return url
    } catch (e: any) {
      setError(e?.message || 'فشل رفع الصورة')
      return null
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { uploadImage, isUploading, error }
}
