# إعداد Vercel للمشروع

## إعدادات مهمة في Vercel Dashboard:

### 1. Root Directory
- اذهب إلى **Project Settings** → **General**
- في قسم **Root Directory**، اضبط القيمة على: `web`
- أو اتركها فارغة إذا كان `vercel.json` موجوداً في الجذر

### 2. Build Settings
- **Framework Preset**: Next.js (سيتم اكتشافه تلقائياً)
- **Build Command**: `npm run build` (سيتم تنفيذه من مجلد `web`)
- **Output Directory**: `.next` (افتراضي لـ Next.js)
- **Install Command**: `npm install` (سيتم تنفيذه من مجلد `web`)

### 3. Environment Variables
يجب إضافة جميع المتغيرات التالية من ملف `banenv`:

#### Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Google OAuth:
- `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`

#### ImgBB APIs:
- `IMGBB_API_1`
- `IMGBB_API_2`
- `IMGBB_API_3`
- `IMGBB_API_4`
- `IMGBB_API_5`

#### YouTube (إذا كان مطلوباً):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

### 4. بعد التحديثات:
1. اذهب إلى **Deployments**
2. اضغط على **Redeploy** للـ deployment الأخير
3. أو انتظر حتى يتم rebuild تلقائياً بعد push

## ملاحظات:
- ملف `vercel.json` موجود في الجذر الرئيسي ويحدد `rootDirectory: "web"`
- تأكد من أن جميع Environment Variables موجودة قبل الـ deployment
- تحقق من Build Logs في حالة وجود أخطاء
