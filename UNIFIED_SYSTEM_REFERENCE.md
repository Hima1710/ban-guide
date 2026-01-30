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
| ممنوع | ألوان hex/rgba ثابتة للبراند أو الدلالات (مثل `#D4AF37` أو `rgba(0,0,0,0.5)` في المكونات)—استخدم الثيم أو المتغيرات |

---

## 3. الواجهة والمكونات (M3)

| البند | القاعدة |
|--------|---------|
| الأزرار | مكوّن `Button` من `@/components/m3` (مُصدَّر من `common/Button`): `variant="filled"|"outlined"|"text"`, `size="sm"|"md"|"lg"` |
| النصوص | مكوّنات Typography من `@/components/m3`: `TitleLarge`, `TitleMedium`, `BodyMedium`, `BodySmall`, `LabelMedium`, `LabelSmall`، إلخ. مع `color` من الثيم عند الحاجة |
| التخطيط والتنقل | SmartTopBar, BottomNavigation, Sidebar, AppShell من `@/components/m3` |
| الظلال | `var(--shadow-sm)`, `var(--shadow-md)`, أو كلاسات من `globals.css` (مثل `shadow-elev-*`)—لا `boxShadow` بـ rgba ثابت |

**المراجع:** `UNIFIED_UI_SYSTEM.md`, `GLOBAL_UI_UNIFICATION.md`, `M3_IMPLEMENTATION_GUIDE.md`

---

## 4. الدوال والـ API

| البند | القاعدة |
|--------|---------|
| استدعاء الـ RPC | من التطبيق استخدم دوال `lib/api/` (مثل `notifyPlaceFollowers`, `sendNotification`)؛ أسماء المعاملات تطابق الداتابيز (`p_place_id`, `p_title_ar`, …) |
| الأنواع | أنواع الإشعارات وغيرها في `lib/types/database.ts` (مثل `NotificationType`) مطابقة لـ CHECK في الجداول |
| دوال الداتابيز | تسمية `snake_case`؛ معاملات بـ `p_`؛ قيم الـ type من نفس مجموعة `notifications.type` |

---

## 5. ملخص سريع للمراجعة

- **الداتابيز:** README في `supabase_migrations/` + RLS + COMMENT + `SET search_path` للدوال.
- **الألوان:** `useTheme()` و `colors.*` ومتغيرات `globals.css` فقط؛ لا ألوان ثابتة للبراند/الدلالات.
- **الواجهة:** مكونات M3 (Button, Typography, …) وظلال من متغيرات CSS.
- **الدوال:** استخدام `lib/api/` وتطابق المعاملات والأنواع مع الداتابيز و TypeScript.

---

## 6. كيف تشير لمشكلة (زر، ألوان) عشان نعدّلها للنظام الموحد

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
