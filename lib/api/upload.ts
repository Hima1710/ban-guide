/**
 * API رفع الملفات الموحد – بدون Supabase Storage
 * الصور: /api/upload-image (ImgBB)
 * الفيديو: /api/youtube/upload (يوتيوب)
 * يستخدم في: الحالات، المنشورات، الشعارات، المنتجات، الإيصالات، إلخ.
 */

/** رفع صورة واحدة عبر /api/upload-image وإرجاع الرابط */
export async function uploadImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('الرجاء اختيار ملف صورة صحيح')
  }
  const formData = new FormData()
  formData.append('image', file)
  const response = await fetch('/api/upload-image', { method: 'POST', body: formData })
  const data = await response.json()
  if (!response.ok || !data.url) {
    throw new Error(data.error || 'فشل رفع الصورة')
  }
  return data.url
}
