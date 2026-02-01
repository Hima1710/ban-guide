# تقرير: الملفات المتحكمة في الألوان والأزرار والمكونات

## ١. الملفات التي تتحكم في الألوان

### مصدر واحد للحقيقة (الثيم والألوان)

| الملف | الدور |
|-------|------|
| **`contexts/ThemeContext.tsx`** | **المصدر الرئيسي للألوان.** يوفّر `useTheme()` و `ThemeProvider`، ويحتوي على: ألوان النهاري `getLightColors()`، ألوان الليلي `getDarkColors()`، ألوان حسب الدور `roleColors`، ويثبّت كل قيم الثيم على `document.documentElement` كمتغيرات CSS (مثل `--color-primary`, `--color-on-surface`). أي تغيير في الثيم (نهاري/ليلي) أو الدور يمر من هنا. |
| **`app/globals.css`** | **القيم الافتراضية والكلاسات.** يحدّد `:root` للمتغيرات (primary, surface, outline, error, success, …) والـ aliases والـ Chameleon والظلال والخطوط ونطاق M3 Type Scale. يستخدمه Tailwind والكلاسات المباشرة مثل `bg-primary`, `text-on-surface`. |
| **`tailwind.config.ts`** | **ربط الثيم بـ Tailwind.** يمدّد الـ theme بألوان تشير إلى متغيرات CSS (مثل `primary: 'var(--color-primary)'`)، وبنصف قطر وزوايا وخطوط. لا يخزّن ألواناً ثابتة؛ القيم من `globals.css` والـ ThemeContext. |
| **`app/layout.tsx`** | يغلّف التطبيق بـ `ThemeProvider` فقط؛ لا يحدد ألواناً. |

**الخلاصة:** الألوان الفعلية (قيم النهاري/الليلي) تُحدد في **ملف واحد** هو `contexts/ThemeContext.tsx`، وتُطبَّق عبر متغيرات CSS على الـ root. `globals.css` يعطي القيم الافتراضية ونطاق الاستخدام، و`tailwind.config.ts` يربطها بـ Tailwind.

---

## ٢. كم ملف يستهلك الألوان (يستخدم الثيم)

ملفات تستدعي `useTheme()` أو تستخدم `colors.*` أو متغيرات مثل `--color-*` أو كلاسات مثل `bg-primary` / `text-on-surface`:

- **حوالي ٦١ ملفاً** (صفحات، مكونات، سياقات) يستخدمون الثيم أو الألوان بشكل مباشر أو غير مباشر.

أهم المجموعات:

- **الصفحات (app/):** مثل `page.tsx`, `places/[id]/page.tsx`, `dashboard/*`, `admin/*`, `auth/*` — عشرات الملفات.
- **المكونات (components/):** مثل `Button`, `Modal`, `BanCard`, `SmartTopBar`, `BottomNavigation`, `ConversationsSidebar`, `Typography`, … — عشرات الملفات أيضاً.

كل هذه الملفات **تستهلك** الألوان ولا تغيّر تعريف الثيم؛ التعريف يبقى في `ThemeContext.tsx` + `globals.css` + `tailwind.config.ts`.

---

## ٣. الأزرار (Button): كم ملف يتحمّل المكون

### تعريف الزر

- **مكوّن واحد فقط:** `components/common/Button.tsx`
  - يستخدم `useTheme()` لاختيار الأنماط حسب `variant` و `isDark` (filled / outlined / text / danger).

### تصدير الزر

- **`components/common/index.ts`** — يصدّر `Button`.
- **`components/m3/index.ts`** — يعيد تصدير `Button` من `../common/Button` (نفس المكوّن).

### ملفات تستورد وتستخدم Button

**٢٨ ملفاً** يستوردون `Button` (من `@/components/m3` أو `@/components/common`)، وجميعها تستخدم نفس الملف `components/common/Button.tsx`:

| المصدر | عدد الملفات | أمثلة |
|--------|-------------|--------|
| من `@/components/m3` | ٢٢ | `app/page.tsx`, `app/places/[id]/page.tsx`, `app/dashboard/*`, `app/messages/page.tsx`, `ConversationsSidebar`, `BanCard`, `Modal`, `ChatInput`, `StoryViewer`, `AddStorySheetContent`, `MapPicker`, `NavBar`, … |
| من `@/components/common` | ٦ | `SmartTopBar`, `admin/discount-codes`, `admin/packages`, `admin/affiliates`, `auth/login` |

**الخلاصة:**  
- **ملف واحد** يتحكم في شكل الأزرار: `components/common/Button.tsx`.  
- **٢٨ ملفاً** يتحمّل (يستورد ويستخدم) هذا المكوّن.

---

## ٤. مكونات أخرى مرتبطة بالألوان والثيم

مكونات تستخدم `useTheme()` أو ألوان الثيم مباشرة (منطقياً “تتحمّل” في الألوان):

- **مشتركة (common):** `Button`, `Modal`, `Input`, `Card`, `BanCard`, `LoadingSpinner`
- **M3:** `BottomNavigation`, `SmartTopBar`, `Sidebar`, `AppShell`, `BottomSheet`, `Typography`
- **أخرى:** `ConversationsSidebar`, `ConversationDrawer`, `ChatInput`, `StoryViewer`, `AddStorySheetContent`, `MapPicker`, `PlaceCard`, `Breadcrumbs`, `NotificationBell`, `MessageItem`, `NavBar`, `FeaturedPlaces`, `MapComponent`, `VersionBadge`, `ErrorBoundary`, `SweetAlert`, `YouTubeUpload`

عدد الملفات التي تستهلك الثيم (كما ورد أعلاه) حوالي **٦١ ملفاً**؛ كثير منها مكونات أو صفحات تستخدم أيضاً `Button`.

---

## ٥. ملخص سريع

| البند | العدد / الملف |
|-------|----------------|
| ملفات **تتحكم** في تعريف الألوان (مصدر الحقيقة) | **٣:** `ThemeContext.tsx`, `globals.css`, `tailwind.config.ts` |
| ملف يتحكم في **الأزرار** (شكل واحد موحد) | **١:** `components/common/Button.tsx` |
| ملفات **تستورد** الزر | **٢٨** |
| ملفات **تستهلك** الثيم/الألوان (استدعاء أو استخدام ألوان) | **حوالي ٦١** |

إذا أردت تغيير الألوان في التطبيق، التعديل يكون في `ThemeContext.tsx` (وقيم افتراضية في `globals.css` إن لزم). إذا أردت تغيير شكل كل الأزرار، التعديل يكون في `components/common/Button.tsx` فقط.
