# Environment Variables المطلوبة لـ Vercel

## قائمة المتغيرات التي يجب إضافتها في Vercel Dashboard:

### 1. Supabase Variables (مطلوبة)
```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```
**ملاحظة:** يمكنك العثور على هذه القيم في ملف `banenv` المحلي.

### 2. Google OAuth (مطلوبة)
```
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```
**ملاحظة:** يمكنك العثور على هذه القيمة في ملف `banenv` المحلي.

### 3. ImgBB APIs (مطلوبة لرفع الصور)
```
IMGBB_API_1=YOUR_IMGBB_API_1
IMGBB_API_2=YOUR_IMGBB_API_2
IMGBB_API_3=YOUR_IMGBB_API_3
IMGBB_API_4=YOUR_IMGBB_API_4
IMGBB_API_5=YOUR_IMGBB_API_5
```
**ملاحظة:** يمكنك العثور على هذه القيم في ملف `banenv` المحلي.

### 4. YouTube API (اختيارية - إذا كنت تستخدم رفع الفيديوهات)
```
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://banpro.vercel.app/api/youtube/callback
```
**ملاحظة:** يمكنك العثور على هذه القيم في ملف `banenv` المحلي.

### 5. Site URL (اختيارية)
```
NEXT_PUBLIC_SITE_URL=https://banpro.vercel.app
```

## ملاحظات مهمة:

1. **NEXT_PUBLIC_**: المتغيرات التي تبدأ بـ `NEXT_PUBLIC_` متاحة في المتصفح (client-side)
2. **بدون NEXT_PUBLIC_**: المتغيرات بدون `NEXT_PUBLIC_` متاحة فقط في server-side
3. **Environment**: اختر "All Environments" أو "Production" حسب الحاجة
4. **بعد الإضافة**: سيتم deployment تلقائياً بعد إضافة المتغيرات

## خطوات الإضافة في Vercel:

1. اذهب إلى: **Settings** → **Environment Variables**
2. اضغط على **Add New**
3. أدخل **Name** و **Value**
4. اختر **Environment** (Production, Preview, Development)
5. اضغط **Save**
6. سيتم deployment تلقائياً
