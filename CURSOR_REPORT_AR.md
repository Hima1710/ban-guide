# 📊 تقرير كيرسور - الحالة الحالية للمشروع
**تاريخ التقرير:** 29 يناير 2026  
**اسم المشروع:** BANV1 - دليلك للأماكن والخدمات  
**الإطار:** Next.js 16 + TypeScript + Supabase

---

## 📁 هيكل الملفات الأساسية

### 1. ملفات التكوين الرئيسية
```
BANV1/
├── package.json              # التبعيات والمكتبات
├── tsconfig.json             # إعدادات TypeScript
├── next.config.ts            # إعدادات Next.js
├── postcss.config.mjs        # إعدادات PostCSS
├── eslint.config.mjs         # إعدادات ESLint
└── .gitignore                # ملفات Git المتجاهلة
```

### 2. مجلد التطبيق (app/)
```
app/
├── layout.tsx                # التخطيط الرئيسي
├── page.tsx                  # الصفحة الرئيسية
├── globals.css               # الأنماط العامة
│
├── auth/                     # صفحات المصادقة
│   ├── login/page.tsx        # تسجيل الدخول
│   ├── page.tsx              # صفحة المصادقة
│   └── callback/route.ts     # معالجة OAuth callback
│
├── dashboard/                # لوحة التحكم
│   ├── layout.tsx             # تخطيط لوحة التحكم
│   ├── page.tsx              # الصفحة الرئيسية للوحة
│   ├── packages/page.tsx      # الباقات
│   ├── affiliate/page.tsx    # لوحة المسوق
│   ├── places/               # إدارة الأماكن
│   │   ├── page.tsx          # قائمة الأماكن
│   │   ├── new/page.tsx      # إضافة مكان جديد
│   │   └── [id]/             # صفحة مكان محدد
│   │       ├── page.tsx      # تفاصيل المكان
│   │       ├── employees/page.tsx
│   │       ├── posts/page.tsx
│   │       └── products/new/page.tsx
│   └── privacy/              # صفحات الخصوصية
│
├── admin/                    # لوحة الإدارة
│   ├── layout.tsx             # تخطيط لوحة الإدارة
│   ├── page.tsx              # الصفحة الرئيسية للإدارة
│   ├── packages/page.tsx      # إدارة الباقات
│   ├── subscriptions/page.tsx # إدارة الاشتراكات
│   ├── affiliates/page.tsx   # إدارة المسوقين
│   ├── discount-codes/page.tsx # إدارة أكواد الخصم
│   ├── settings/page.tsx     # الإعدادات
│   ├── users/page.tsx        # إدارة المستخدمين
│   └── youtube/page.tsx      # إدارة YouTube
│
├── places/                   # صفحات الأماكن العامة
│   ├── page.tsx              # قائمة الأماكن
│   └── [id]/page.tsx         # صفحة مكان عام
│
├── messages/                 # نظام الرسائل
│   └── page.tsx              # صفحة الرسائل
│
└── api/                      # API Routes
    ├── upload-image/route.ts  # رفع الصور
    ├── upload-audio/route.ts # رفع الصوت
    ├── geocoding/reverse/route.ts # Geocoding
    └── youtube/               # YouTube APIs
        ├── auth/route.ts
        ├── callback/route.ts
        └── upload/route.ts
```

### 3. المكونات (components/)
```
components/
├── common/                   # مكونات مشتركة
│   ├── Button.tsx            # زر موحد
│   ├── Input.tsx             # حقل إدخال موحد
│   ├── Card.tsx              # كارت موحد
│   ├── Modal.tsx             # نافذة منبثقة
│   ├── LoadingSpinner.tsx    # مؤشر التحميل
│   └── index.ts              # تصديرات المكونات
│
├── m3/                       # Material Design 3
│   ├── AppShell.tsx          # هيكل التطبيق
│   ├── Sidebar.tsx           # الشريط الجانبي
│   ├── BottomNavigation.tsx  # التنقل السفلي
│   ├── Carousel.tsx          # عرض شرائحي
│   ├── Typography.tsx        # النصوص
│   └── index.ts              # تصديرات M3
│
├── PlaceCard.tsx             # كارت المكان
├── FeaturedPlaces.tsx        # الأماكن المميزة
├── MapComponent.tsx          # خريطة Google Maps
├── MapPicker.tsx             # اختيار الموقع
├── ChatInput.tsx             # إدخال الرسائل
├── ConversationsSidebar.tsx # شريط المحادثات
├── MessageItem.tsx           # عنصر الرسالة
├── NavBar.tsx                # شريط التنقل
├── NotificationBell.tsx      # جرس الإشعارات
├── YouTubeUpload.tsx         # رفع YouTube
├── ErrorBoundary.tsx         # معالجة الأخطاء
├── Breadcrumbs.tsx           # مسار التنقل
├── SweetAlert.tsx            # إشعارات SweetAlert
└── VersionBadge.tsx          # شارة الإصدار
```

### 4. المكتبات والمساعدين (lib/)
```
lib/
├── supabase.ts               # عميل Supabase
├── types.ts                  # أنواع البيانات الأساسية
├── logger.ts                 # نظام السجلات
├── toast.ts                  # إشعارات Toast
├── imgbb.ts                  # رفع الصور إلى ImgBB
├── youtube.ts                # معالجة YouTube
├── youtube-upload.ts         # رفع YouTube
├── geocoding.ts              # Geocoding
├── audio-recorder.ts         # تسجيل الصوت
├── catbox.ts                 # Catbox API
├── webview-detection.ts      # اكتشاف WebView
├── action-handler.ts         # معالج الإجراءات
│
├── api/                      # دوال API
│   ├── places.ts             # API الأماكن
│   ├── products.ts           # API المنتجات
│   ├── visits.ts             # API الزيارات
│   ├── notifications.ts     # API الإشعارات
│   └── shared/               # مساعدات مشتركة
│       ├── auth.ts           # المصادقة
│       ├── cors.ts           # CORS
│       ├── errors.ts         # معالجة الأخطاء
│       └── index.ts          # تصديرات
│
└── types/
    └── database.ts           # أنواع قاعدة البيانات الكاملة
```

### 5. الـ Hooks المخصصة (hooks/)
```
hooks/
├── useAuth.ts                # Hook المصادقة
├── usePlaces.ts              # Hook الأماكن
├── useProducts.ts            # Hook المنتجات
├── useMessages.ts            # Hook الرسائل
├── useNotifications.ts      # Hook الإشعارات
├── useAffiliate.ts           # Hook المسوق
├── useAffiliateManager.ts   # Hook إدارة المسوقين
├── useAdminManager.ts        # Hook إدارة الأدمن
├── useConversationsManager.ts # Hook المحادثات
└── index.ts                  # تصديرات الـ Hooks
```

### 6. السياقات (contexts/)
```
contexts/
├── AuthContext.tsx           # سياق المصادقة
├── ThemeContext.tsx          # سياق الثيم
└── index.ts                  # تصديرات السياقات
```

### 7. الأنواع (types/)
```
types/
├── components.ts             # أنواع المكونات
├── schemas.ts                # مخططات Zod
└── index.ts                  # تصديرات الأنواع
```

### 8. المساعدات (utils/)
```
utils/
├── helpers.ts                # دوال مساعدة
└── index.ts                  # تصديرات المساعدات
```

### 9. ملفات الهجرة (supabase_migrations/)
```
supabase_migrations/
├── complete_schema_migration.sql      # الهجرة الكاملة
├── add_affiliates_rls.sql            # RLS للمسوقين
├── add_audio_url_to_messages.sql    # إضافة الصوت للرسائل
├── add_discount_codes_table.sql      # جدول أكواد الخصم
├── add_employee_id_to_messages.sql    # معرف الموظف للرسائل
├── add_employee_requests.sql         # طلبات الموظفين
├── add_place_employees.sql           # موظفو الأماكن
├── add_place_logo.sql                # شعار المكان
├── add_posts_table.sql               # جدول المنشورات
├── add_product_id_to_messages.sql    # معرف المنتج للرسائل
├── add_receipt_to_subscriptions.sql  # إيصال الاشتراك
├── add_recipient_id_to_messages.sql  # مستقبل الرسالة
├── add_reply_to_messages.sql         # الرد على الرسائل
├── add_youtube_tokens.sql            # رموز YouTube
├── complete_employee_posts_system.sql # نظام الموظفين والمنشورات
├── create_test_affiliate.sql         # مسوق تجريبي
├── delete_all_data.sql               # حذف جميع البيانات
├── delete_all_places.sql             # حذف جميع الأماكن
└── delete_non_admin_users.sql        # حذف المستخدمين غير الأدمن
```

---

## 🗄️ هيكل قاعدة البيانات (Supabase)

### الجداول الأساسية

#### 1. **auth.users** (Supabase Auth)
- جدول المستخدمين الأساسي من Supabase
- يحتوي على: id, email, created_at, etc.

#### 2. **user_profiles**
```sql
- id (UUID, PK, FK → auth.users)
- phone_number (VARCHAR)
- full_name (TEXT)
- is_admin (BOOLEAN)
- phone_verified_at (TIMESTAMP) -- جديد
- last_login_at (TIMESTAMP) -- جديد
- notification_preferences (JSONB) -- جديد
- created_at, updated_at
```

#### 3. **packages** (الباقات)
```sql
- id (UUID, PK)
- name_ar, name_en (TEXT)
- price (DECIMAL)
- duration_days (INTEGER)
- max_places (INTEGER)
- max_products_per_place (INTEGER)
- max_images_per_product (INTEGER)
- max_videos_per_product (INTEGER)
- max_videos_per_place (INTEGER)
- priority (INTEGER)
- card_style (VARCHAR)
- is_featured (BOOLEAN) -- جديد
- sort_order (INTEGER) -- جديد
- icon (TEXT) -- جديد
- created_at, updated_at
```

#### 4. **subscriptions** (الاشتراكات)
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- package_id (UUID, FK → packages)
- status (VARCHAR) -- active, expired, cancelled
- start_date, end_date (TIMESTAMP)
- receipt_id (TEXT) -- جديد
- auto_renew (BOOLEAN) -- جديد
- payment_method (VARCHAR) -- جديد
- cancelled_at (TIMESTAMP) -- جديد
- cancel_reason (TEXT) -- جديد
- created_at, updated_at
```

#### 5. **places** (الأماكن)
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- name_ar, name_en (TEXT)
- description_ar, description_en (TEXT)
- address (TEXT)
- latitude, longitude (DECIMAL)
- phone (VARCHAR)
- email (VARCHAR)
- website (TEXT)
- logo_url (TEXT) -- جديد
- youtube_video_url (TEXT)
- place_type (VARCHAR)
- is_active (BOOLEAN)
- featured_until (TIMESTAMP) -- جديد
- view_count (INTEGER) -- جديد
- rating_count (INTEGER) -- جديد
- average_rating (DECIMAL) -- جديد
- verification_status (VARCHAR) -- جديد: pending/verified/rejected
- verification_notes (TEXT) -- جديد
- created_at, updated_at
```

#### 6. **products** (المنتجات)
```sql
- id (UUID, PK)
- place_id (UUID, FK → places)
- name_ar, name_en (TEXT)
- description_ar, description_en (TEXT)
- price (DECIMAL)
- image_urls (TEXT[])
- video_urls (TEXT[])
- is_active (BOOLEAN)
- category_id (UUID, FK → product_categories) -- جديد
- created_at, updated_at
```

#### 7. **messages** (الرسائل)
```sql
- id (UUID, PK)
- place_id (UUID, FK → places)
- sender_id (UUID, FK → auth.users)
- recipient_id (UUID, FK → auth.users) -- جديد
- employee_id (UUID, FK → auth.users) -- جديد
- product_id (UUID, FK → products) -- جديد
- content (TEXT)
- image_url (TEXT)
- audio_url (TEXT) -- جديد
- reply_to (UUID, FK → messages) -- جديد
- is_read (BOOLEAN)
- created_at
```

#### 8. **affiliates** (المسوقون)
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- code (VARCHAR, UNIQUE)
- discount_percentage (DECIMAL)
- is_active (BOOLEAN)
- created_at, updated_at
```

#### 9. **affiliate_transactions** (معاملات المسوقين) -- جديد
```sql
- id (UUID, PK)
- affiliate_id (UUID, FK → affiliates)
- transaction_type (VARCHAR) -- earning, withdrawal, adjustment, bonus
- amount (DECIMAL)
- description_ar, description_en (TEXT)
- reference_type (VARCHAR) -- subscription, referral, etc.
- reference_id (UUID)
- status (VARCHAR) -- pending, completed, failed, cancelled
- created_at, updated_at
```

#### 10. **notifications** (الإشعارات) -- جديد
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- title_ar, title_en (TEXT)
- message_ar, message_en (TEXT)
- type (VARCHAR) -- message, subscription, employee_request, post, product, system, promotion, payment
- is_read (BOOLEAN)
- link (TEXT)
- icon (TEXT)
- priority (VARCHAR) -- low, normal, high, urgent
- expires_at (TIMESTAMP)
- read_at (TIMESTAMP)
- created_at
```

#### 11. **package_features** (ميزات الباقات) -- جديد
```sql
- id (UUID, PK)
- package_id (UUID, FK → packages)
- feature_key (VARCHAR) -- featured_listings, youtube_upload, etc.
- feature_name_ar, feature_name_en (TEXT)
- feature_value (TEXT) -- '5 listings', 'Unlimited', etc.
- is_included (BOOLEAN)
- icon (TEXT)
- sort_order (INTEGER)
- created_at, updated_at
- UNIQUE(package_id, feature_key)
```

#### 12. **place_views** (مشاهدات الأماكن - تحليلات) -- جديد
```sql
- id (UUID, PK)
- place_id (UUID, FK → places)
- user_id (UUID, FK → auth.users) -- nullable
- ip_address (INET)
- user_agent (TEXT)
- referrer (TEXT)
- viewed_at (TIMESTAMP)
```

#### 13. **product_categories** (فئات المنتجات) -- جديد
```sql
- id (UUID, PK)
- name_ar, name_en (TEXT)
- description_ar, description_en (TEXT)
- icon (TEXT)
- color (TEXT) -- Hex color
- is_active (BOOLEAN)
- sort_order (INTEGER)
- created_at, updated_at
```

#### 14. **employee_requests** (طلبات الموظفين)
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- place_id (UUID, FK → places)
- phone (VARCHAR)
- status (VARCHAR) -- pending, accepted, rejected
- permissions (VARCHAR) -- basic, messages_posts, full
- created_at, updated_at
- UNIQUE(user_id, place_id)
```

#### 15. **place_employees** (موظفو الأماكن)
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- place_id (UUID, FK → places)
- permissions (VARCHAR) -- basic, messages_posts, full
- is_active (BOOLEAN)
- created_at, updated_at
```

#### 16. **posts** (المنشورات)
```sql
- id (UUID, PK)
- place_id (UUID, FK → places)
- created_by (UUID, FK → auth.users)
- content (TEXT)
- image_url (TEXT)
- video_url (TEXT)
- post_type (VARCHAR) -- text, image, video
- is_active (BOOLEAN)
- created_at, updated_at
```

#### 17. **discount_codes** (أكواد الخصم)
```sql
- id (UUID, PK)
- code (VARCHAR, UNIQUE)
- discount_percentage (DECIMAL)
- start_date, end_date (TIMESTAMP)
- is_active (BOOLEAN)
- max_uses (INTEGER) -- NULL = unlimited
- used_count (INTEGER)
- created_by (UUID, FK → auth.users)
- description_ar, description_en (TEXT)
- created_at, updated_at
```

#### 18. **youtube_tokens** (رموز YouTube)
```sql
- id (UUID, PK)
- user_id (UUID, FK → auth.users)
- access_token (TEXT)
- refresh_token (TEXT)
- expires_at (TIMESTAMP)
- created_at, updated_at
```

---

## 🔧 الدوال المساعدة (Database Functions)

### 1. **increment_place_view_count()**
- تلقائياً يزيد عداد المشاهدات عند إضافة سجل في `place_views`
- Trigger: `trigger_increment_place_view_count`

### 2. **get_affiliate_balance(p_affiliate_id UUID)**
- يحسب رصيد المسوق من المعاملات
- يُرجع: DECIMAL(10,2)

### 3. **send_notification(...)**
- إرسال إشعار للمستخدم
- Parameters: user_id, title_ar, message_ar, type, link, etc.
- يُرجع: UUID (notification_id)

### 4. **increment_discount_code_usage(code_id UUID)**
- زيادة عداد استخدام كود الخصم

---

## 📦 التبعيات الرئيسية (package.json)

### الإنتاج (dependencies)
- **next**: 16.0.10
- **react**: 19.2.1
- **react-dom**: 19.2.1
- **@supabase/supabase-js**: ^2.39.0
- **@supabase/auth-helpers-nextjs**: ^0.8.7
- **tailwindcss**: ^4
- **zod**: ^4.3.5
- **leaflet**: ^1.9.4 (الخرائط)
- **react-leaflet**: ^5.0.0
- **googleapis**: ^168.0.0 (YouTube API)
- **axios**: ^1.6.5
- **date-fns**: ^3.0.6
- **lucide-react**: ^0.400.0 (الأيقونات)
- **react-hot-toast**: ^2.4.1
- **sweetalert2**: ^11.10.5
- **sharp**: ^0.33.2 (معالجة الصور)

### التطوير (devDependencies)
- **typescript**: ^5
- **eslint**: ^9
- **@types/node**: ^20
- **@types/react**: ^19
- **@types/react-dom**: ^19
- **@types/leaflet**: ^1.9.8

---

## 🎨 الميزات الرئيسية

### ✅ نظام الباقات والاشتراكات
- باقات قابلة للتخصيص
- تحديد الحدود لكل باقة
- تتبع الاشتراكات النشطة

### ✅ نظام الأماكن والمنتجات
- إدارة الأماكن مع الخرائط
- إدارة المنتجات مع الصور والفيديوهات
- نظام الفئات للمنتجات

### ✅ نظام الرسائل
- رسائل نصية وصورية وصوتية
- نظام الردود
- دعم الموظفين في الرد

### ✅ نظام الموظفين
- طلبات التوظيف
- مستويات الصلاحيات
- إدارة المنشورات

### ✅ نظام التسويق بالعمولة
- أكواد خصم مخصصة
- تتبع المعاملات
- حساب الأرباح

### ✅ نظام الإشعارات
- إشعارات متعددة الأنواع
- أولويات مختلفة
- روابط مباشرة

### ✅ التحليلات
- تتبع مشاهدات الأماكن
- إحصائيات الزيارات
- عداد المشاهدات

### ✅ التكامل مع YouTube
- رفع الفيديوهات
- تخزين الرموز
- إدارة المحتوى

---

## 🔐 Row Level Security (RLS)

جميع الجداول لديها RLS مفعّل مع سياسات:
- المستخدمون يمكنهم عرض/تعديل بياناتهم فقط
- أصحاب الأماكن يمكنهم إدارة أماكنهم
- الموظفون لديهم صلاحيات محدودة حسب المستوى
- الأدمن لديه صلاحيات كاملة

---

## 📊 الإحصائيات

- **عدد الصفحات**: ~30+ صفحة
- **عدد المكونات**: ~25+ مكون
- **عدد الـ Hooks**: 9 hooks مخصصة
- **عدد الجداول**: 18 جدول
- **عدد ملفات الهجرة**: 19 ملف هجرة
- **عدد API Routes**: 6+ routes

---

## 🚀 حالة المشروع

### ✅ مكتمل
- هيكل قاعدة البيانات الكامل
- نظام المصادقة
- لوحة التحكم الأساسية
- لوحة الإدارة
- نظام الرسائل
- نظام الموظفين
- نظام المسوقين
- نظام الإشعارات
- التكامل مع YouTube
- نظام أكواد الخصم

### 🔄 قيد التطوير
- تحسينات واجهة المستخدم
- تحسينات الأداء
- إضافة ميزات جديدة

---

**تم إنشاء التقرير:** 29 يناير 2026  
**آخر تحديث:** 29 يناير 2026
