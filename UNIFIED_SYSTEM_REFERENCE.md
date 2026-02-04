# مرجع النظام الموحد (Unified System Reference)

هذا الملف مرجع واحد لكل ما يخص **النظام الموحد** في المشروع: الداتابيز، الاستايل، الألوان، الدوال، والواجهة. أي تعديل جديد يُفترض أن يتبع هذه الاتفاقيات.

---

## 1. قاعدة البيانات (Supabase)

| البند | القاعدة |
|--------|---------|
| التسمية | جداول وأعمدة ودوال: `snake_case`؛ معاملات الدوال: بادئة `p_` |
| الجداول | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`؛ `created_at`/`updated_at`؛ RLS على كل جدول؛ فهارس على FK والحقول الشائعة؛ `COMMENT ON TABLE/COLUMN` |
| الدوال (RPC) | `SECURITY DEFINER SET search_path = public`؛ معاملات `p_*`؛ قيم `type` مطابقة لـ `notifications.type`؛ `COMMENT ON FUNCTION` |
| الـ Migrations | هيدر في أول الملف (Migration / Purpose / Safe)؛ أقسام مرقّمة؛ لا hardcode لـ UUIDs في migrations الداتا |

**المرجع الكامل:** `supabase_migrations/README.md`

---

## 2. الألوان والثيم

| البند | القاعدة |
|--------|---------|
| مصدر الألوان | `useTheme()` من `contexts/ThemeContext.tsx` → `colors.*` (primary, surface, onSurface, outline, error, warning, …) |
| في الـ CSS | متغيرات `app/globals.css`: `--color-primary`, `--color-on-primary`, `--color-surface`, `--shadow-sm`, `--shadow-md`, … |
| **Chameleon** | سطح يتكيّف مع الثيم/الخلفية: `--surface-chameleon` (شفاف)، `--surface-chameleon-glass` (زجاج + blur). صنفان: `.surface-chameleon` و `.surface-chameleon-glass` — للهيدر العائم، الكروت فوق المحتوى، إلخ. |
| ممنوع | ألوان hex/rgba ثابتة للبراند أو الدلالات (مثل `#D4AF37` أو `rgba(0,0,0,0.5)` في المكونات)—استخدم الثيم أو المتغيرات |

---

## 3. الواجهة والمكونات (M3)

| البند | القاعدة |
|--------|---------|
| الأزرار | مكوّن `Button` من `@/components/m3` (مُصدَّر من `common/Button`): `variant="filled"|"outlined"|"text"`, `size="sm"|"md"|"lg"` |
| النصوص | مكوّنات Typography من `@/components/m3`: `TitleLarge`, `TitleMedium`, `BodyMedium`, `BodySmall`, `LabelMedium`, `LabelSmall`، إلخ. مع `color` من الثيم عند الحاجة |
| التخطيط والتنقل | SmartTopBar, BottomNavigation, Sidebar, AppShell من `@/components/m3` |
| Bottom Sheet (M3) | مكوّن `BottomSheet` من `@/components/m3`؛ يُفتح من الأسفل مع خلفية overlay ومقبض سحب |
| إضافة حالة (شيت) | `useAddStorySheet()` من `@/contexts/AddStoryContext` → `openAddStorySheet(placeId, placeName?)` لفتح شيت إضافة الحالة من أي صفحة دون الانتقال |
| الظلال | `var(--shadow-sm)`, `var(--shadow-md)`, أو كلاسات من `globals.css` (مثل `shadow-elev-*`)—لا `boxShadow` بـ rgba ثابت |
| **Chameleon (سطح متكيّف)** | للهيدر العائم أو الكروت فوق المحتوى: أضف الصنف `surface-chameleon` (شفاف) أو `surface-chameleon-glass` (زجاج + `backdrop-filter`). الألوان تُحدَّث تلقائياً مع الثيم الفاتح/الداكن. |
| **تاب الفيديوهات (الرئيسية)** | تاب «الفيديوهات» يعرض كل الفيديوهات (منشورات، منتجات، أماكن، ستوريز) بتدفق متتالي (Shorts-style). المكوّن: `VideoShortsFeed` من `@/components/common`؛ الهوك: `useUnifiedVideoFeed` من `@/hooks/useUnifiedVideoFeed`؛ الـ API: `getUnifiedVideos` من `@/lib/api/videos`. شريط التفاعل: لايك (مع العدد) + تعليق (يفتح Bottom Sheet مع العدد) باستخدام `useEntityCounts` و `openCommentsSheetForEntity` من `CommentsContext`. |
| **تعليقات حسب الـ entity** | `CommentsContext` يدعم `openCommentsSheetForEntity(entityId, entityType, placeId?)` لفتح شيت التعليقات لأي entity (post/product/place). استخدمه في تاب الفيديوهات أو أي واجهة تحتاج تعليقات على منتج/مكان. |
| **المحادثة الجانبية (Drawer + Sidebar)** | تظهر **فقط في صفحة المكان** (`/places/[id]`) عند الضغط على «إرسال رسالة». في AppShell يُعرض `ConversationsSidebar` و `ConversationDrawer` فقط عندما `pathname.startsWith('/places/')` ويكون المسار مكاناً واحداً. في غير صفحة المكان لا يظهر زر المحادثات العائم ولا الدرج. |
| **صفحة المحادثات (/messages)** | فلتر حسب الدور: **أماكني** (مالك)، **أماكن أعمل فيها** (موظف)، **أماكن أتابعها** (متابع). الهوك: `usePlacesForMessages` من `@/hooks/usePlacesForMessages`؛ الـ API: `getEmployedPlaces`, `getFollowedPlaces`, `getPlaceEmployees`, `getPlaceFollowers` من `@/lib/api/messagesPlaces`. عند اختيار مكان: عرض الموظفين (للمالك/الموظف)، العملاء (من كلم المكان)، المتابعين. المحادثة تُعرض inline بمكوّن `MessagesInlineChat` من `@/components/MessagesInlineChat` باستخدام `ConversationContext` و `selectConversation`. |
| **قوائم افتراضية (VirtualList)** | للقوائم الطويلة أو العناصر الثقيلة (فيديوهات، كروت، صور): استخدم مكوّن `VirtualList` من `@/components/common` مع `@tanstack/react-virtual`. الخصائص: `items`, `renderItem`, `getItemKey`, `estimateSize`, `scrollElementRef` (مرجع الحاوية ذات `overflow-y: auto`)، واختياريًا `overscan`. لا تكتب منطق virtualization يدويًا في الصفحات — استخدم هذا المكوّن فقط. **حاوية التمرير:** استخدم `useScrollContainer()` من `@/contexts/ScrollContainerContext` لمرجع عنصر التمرير الرئيسي (main في AppShell). **الاستخدامات:** (1) `VideoShortsFeed` — شبكة فيديوهات (صفوف × 2)، (2) `FeedPanel` في الصفحة الرئيسية — منشورات (قائمة) ومنتجات (صفوف × 3)، (3) صفحة الأماكن — قائمة أماكن، (4) صفحة تفاصيل المكان — تاب المنشورات (قائمة) وتاب المنتجات (صفوف × 3)، (5) صفحة المحادثات — قائمة المحادثات وشبكة الأماكن (صفوف × 2)، (6) داخل المحادثة (`MessagesInlineChat`) — قائمة الرسائل وقائمة اختيار المنتج (حاوية تمرير محلية)، (7) التعليقات (`Comments`) — قائمة التعليقات (تعليق + ردود) بحاوية تمرير محلية (`maxHeight`). المسافات من `globals.css`: `gap-element`, `rounded-section`, `p-main`, `paddingBottom: var(--element-gap)` للصفوف. التفاصيل: `docs/VIRTUALIZATION_STRATEGY.md`. |

**المراجع:** `UNIFIED_UI_SYSTEM.md`, `GLOBAL_UI_UNIFICATION.md`, `M3_IMPLEMENTATION_GUIDE.md`

---

## 4. حالات التحميل (Loading States) – نظام موحد

| الحالة | الاستخدام | المكوّن |
|--------|-----------|---------|
| **تحميل صفحة كاملة** (قبل ظهور المحتوى) | عندما لا يُعرض أي محتوى حتى ينتهي جلب المستخدم/البيانات | `PageSkeleton` من `@/components/common`: `variant="default"|"dashboard"|"list"|"form"` حسب شكل الصفحة — يعرض هيكل سكيلتون موحد حتى يرد السيرفر |
| **تحميل قائمة/شبكة** (بديل للمحتوى) | عندما تريد إظهار هيكل المشهد (كروت، أو صور مصغرة، أو أسطر) حتى يرد السيرفر | `BanSkeleton` من `@/components/common`: `variant="card"` للكروت، `variant="avatar"` للصور الدائرية (مثل الستوريز)، `variant="text"` للأسطر |
| **تحميل داخلي** (زر أو منطقة صغيرة) | أثناء إرسال نموذج أو رفع ملف | `LoadingSpinner size="sm"` أو نص "جاري الرفع..." مع تعطيل الزر |

**القاعدة:** لا استخدام لـ "جاري التحميل" مع سبينر في المحتوى الرئيسي—استخدم `PageSkeleton` أو `BanSkeleton` حسب الجدول. للتحميل الداخلي (أزرار، رفع) استخدم `LoadingSpinner`. الـ shimmer مُعرَّف في `app/globals.css` (`.skeleton-shimmer`).

---

## 5. الدوال والـ API

| البند | القاعدة |
|--------|---------|
| استدعاء الـ RPC | من التطبيق استخدم دوال `lib/api/` (مثل `notifyPlaceFollowers`, `sendNotification`)؛ أسماء المعاملات تطابق الداتابيز (`p_place_id`, `p_title_ar`, …) |
| الفيديوهات الموحدة | `getUnifiedVideos(offset, limit)` من `@/lib/api/videos` — تجمع فيديوهات المنشورات (post_type=video)، منتجات (product_videos)، أماكن (video_url)، ستوريز (media_type=video) وترتّبها حسب التاريخ. النوع: `UnifiedVideoItem` (id, videoUrl, source, entityId, entityType, placeId, title, created_at). |
| أماكن المحادثات | `getEmployedPlaces(userId)`, `getFollowedPlaces(userId)` من `@/lib/api/messagesPlaces` — أماكن المستخدم كموظف أو كمتابع. `getPlaceEmployees(placeId)`, `getPlaceFollowers(placeId)` — موظفو ومتابعو مكان معيّن (لصفحة المحادثات). الهوك الموحد: `usePlacesForMessages()` من `@/hooks/usePlacesForMessages` يعيد `ownedPlaces`, `employedPlaces`, `followedPlaces`, `placesWithRole`, `loading`, `refresh`. |
| الأنواع | أنواع الإشعارات وغيرها في `lib/types/database.ts` (مثل `NotificationType`) مطابقة لـ CHECK في الجداول |
| دوال الداتابيز | تسمية `snake_case`؛ معاملات بـ `p_`؛ قيم الـ type من نفس مجموعة `notifications.type` |

---

## 6. ملخص سريع للمراجعة

- **الداتابيز:** README في `supabase_migrations/` + RLS + COMMENT + `SET search_path` للدوال.
- **الألوان:** `useTheme()` و `colors.*` ومتغيرات `globals.css` فقط؛ لا ألوان ثابتة للبراند/الدلالات.
- **الواجهة:** مكونات M3 (Button, Typography, …) وظلال من متغيرات CSS؛ قوائم طويلة/ثقيلة → `VirtualList` من `@/components/common`.
- **التحميل:** صفحة كاملة → `LoadingSpinner`؛ قوائم/شبكات → `BanSkeleton` (card/avatar/text).
- **الدوال:** استخدام `lib/api/` وتطابق المعاملات والأنواع مع الداتابيز و TypeScript.

---

## 7. كيف تشير لمشكلة (زر، ألوان) عشان نعدّلها للنظام الموحد

لو لاحظت **زر في مكان غلط** أو **ألوان متداخلة/مش متوافقة** مع النظام الموحد، ممكن تشير لي بأي طريقة من دي وأعدّلها:

### الطريقة 1: ذكر المسار + وصف الموقع (الأفضل)
- اكتب مسار الملف ووصف مكان المشكلة، مثلاً:
  - *"في `app/dashboard/places/[id]/page.tsx` في الهيدر فيه زر حفظ بلون ثابت"*
  - *"في صفحة تسجيل الدخول `app/auth/login/page.tsx` الخلفية مش من الثيم"*

### الطريقة 2: استخدام @ على الملف
- في المحادثة اكتب **@** واختر الملف اللي فيه المشكلة (مثلاً `@app/auth/login/page.tsx`).
- وقل مثلاً: *"الزر الأحمر هنا عدّله لمكوّن Button من M3"* أو *"هنا في ألوان ثابتة عدّلها للثيم"*.

### الطريقة 3: وصف الصفحة + العنصر
- اذكر **الصفحة** و**العنصر** بدون مسار، مثلاً:
  - *"صفحة تفاصيل المكان، الزر اللي جنب 'إرسال رسالة'"*
  - *"صفحة لوحة التحكم، الهيدر لونه مختلف عن باقي التطبيق"*
- أنا أبحث في الكود وأحدد الملف والسطر وأعدّل.

### الطريقة 4: لصق نص الزر أو التسمية
- لو المشكلة في زر أو تسمية معيّنة، انسخ نصها واكتبه، مثلاً:
  - *"زر 'حفظ التغييرات' في صفحة تعديل المكان لونه ثابت"*
- أبحث عن النص في المشروع وأصلح الزر/الألوان.

### الطريقة 5: لقطة شاشة (إن وُجدت)
- لو رفعت **صورة** للشاشة ووصفت فيها مكان الزر أو اللون المشكلة، أقدر أربط الوصف بالملف المناسب وأعدّل.

---

**بعد ما تشير:** أعدّل العنصر لاستخدام مكوّنات M3 (مثل `Button` من `@/components/m3`) وألوان من `useTheme()` أو متغيرات `globals.css` حسب النظام الموحد.
