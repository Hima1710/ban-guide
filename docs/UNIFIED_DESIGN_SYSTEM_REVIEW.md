# تقرير مراجعة النظام الموحد (Unified Design System)

**التاريخ:** 2026-02-01  
**النطاق:** ويب (ban-web-app) + إشارة لأندرويد (themes.xml / colors.xml)

---

## 1. ما تم فهمه من التقنيات الحالية

### 1.1 الثيم والألوان

| المصدر | الوصف |
|--------|--------|
| **Web – ThemeContext.tsx** | مصدر واحد للألوان: `useTheme()` → `colors` (primary, surface, onSurface, outline, error, …). ثيم فاتح/داكن + ألوان حسب الدور (admin, user, guest). Primary: ذهبي (#B8942E light / #D4AF37 dark). |
| **Web – globals.css** | متغيرات CSS تُحدَّث من ThemeContext: `--color-primary`, `--color-on-primary`, `--color-surface`, `--shadow-sm/md/lg`, `--surface-chameleon`, `--surface-chameleon-glass`. أشكال: `--radius-sm/md/lg`, `--radius-extra-large`, `--element-gap`, `--main-padding`. خط: Cairo + M3 type scale (--md-sys-typescale-*). |
| **Android – colors.xml** | royal_gold #D4AF37, royal_gold_dark #B8941F — متوافق مع الـ primary في الويب. |
| **Android – themes.xml** | Theme.AppCompat مع colorPrimary/colorAccent من colors.xml، statusBar/navigationBar بلون البراند. |

**الخلاصة:** الألوان والأشكال والخطوط معرّفة في مكان واحد (ويب: ThemeContext + globals.css؛ أندرويد: themes/colors). أي تعديل جديد يجب أن يلتزم بـ `colors.*` ومتغيرات CSS دون ألوان hex/rgba ثابتة في المكونات.

---

### 1.2 الهيدر وحالات التمرير (الحالي)

| المكون | السلوك الحالي |
|--------|----------------|
| **SmartTopBar** | `sticky top-0 z-50`، ارتفاع ثابت 56px، `surface-chameleon-glass`، عنوان حسب المسار. **لا يوجد** منطق Pinned/Collapsed حسب التمرير — الهيدر ثابت دائماً. |
| **الصفحة الرئيسية (app/page.tsx)** | شريط ثابت تحت الهيدر: **الحالات (Stories)** تُخفى عند التمرير لأسفل وتظهر عند التمرير لأعلى** (تراكم scroll + cooldown). التابات (فيديوهات/منشورات/منتجات) تبقى ظاهرة. |
| **صفحة الأماكن (app/places/page.tsx)** | شريط ثابت: **العنوان + البحث + الفلاتر** يُخفى عند التمرير لأسفل ويظهر عند التمرير لأعلى (نفس منطق التراكم + cooldown). |
| **صفحة المحادثات** | هيدر محلي بسيط (عنوان "المحادثات") + فلتر أماكن؛ **لا** collapse حسب التمرير. |
| **صفحة تفاصيل المكان (places/[id])** | شريط sticky داخلي للتابات؛ **لا** تكامل مع هيدر موحد. |

**الفجوة:** منطق الإخفاء/الإظهار مكرر في الصفحة الرئيسية وصفحة الأماكن (scroll listener + state + transition) و**ليس** مكوناً مشتركاً. الهيدر الرئيسي (SmartTopBar) لا يدعم حالات Collapsed/Pinned.

---

### 1.3 التمرير (Scrolling) وحاويات المحتوى

| البند | الوضع الحالي |
|--------|----------------|
| **حاوية التمرير الوحيدة** | في AppShell: `<main ref={scrollContainerRef}>` مع `overflow-y: auto` و`flex-1 min-h-0`. مرجعها يُعطى عبر **ScrollContainerContext** → `useScrollContainer()`. |
| **استخدام الصفحات** | الصفحات **لا** تنشئ حاويات تمرير خاصة؛ المحتوى داخل الـ main. VirtualList في كل الصفحات (الرئيسية، الأماكن، تفاصيل المكان، المحادثات، التعليقات) تستقبل `scrollElementRef={scrollRef}` من نفس الـ main. |
| **حالات استثنائية** | (1) **VideoShortsFeed**: حاوية تمرير محلية خاصة للشبكة (gridContainerRef) لأن التمرير أفقي/عمودي خاص. (2) **MessagesInlineChat** و **Comments**: قائمة رسائل/تعليقات داخل حاوية محلية بـ maxHeight وref خاص — أي **nested scroll** داخل الـ main. |

**مشاكل محتملة (Nested Scrolling):**  
- عند وجود قائمة طويلة داخل منطقة محدودة الارتفاع (مثلاً تعليقات أو رسائل)، المستخدم يمرّر داخل الحاوية الداخلية؛ السلوك عادةً مقبول إذا الحاوية الداخلية لها حد واضح (maxHeight) والـ main لا يتحرك حتى انتهاء التمرير الداخلي.  
- الخطر: حاويتان بعرض كامل كلتاهما overflow-y: auto بدون تحديد واضح لمن "يملك" التمرير — لم يظهر في المراجعة كوضع حالي، لكن أي مكون جديد يجب أن يتبع قاعدة "حاوية تمرير واحدة رئيسية (main) + حاويات فرعية محدودة (maxHeight + ref) عند الحاجة".

---

### 1.4 تحليل مكونات الصفحات (ملخص)

| الصفحة | الهيدر / الشريط العلوي | المحتوى | التمرير |
|--------|-------------------------|---------|---------|
| **الرئيسية** | SmartTopBar + (Stories قابلة للاختفاء + Tabs ثابتة) | فييد (VirtualList: منشورات/منتجات/فيديوهات) | main واحد، VirtualList تستخدم scrollRef |
| **الأماكن** | SmartTopBar + Breadcrumbs + (عنوان+بحث+فلاتر قابلة للاختفاء) | VirtualList أماكن | main واحد |
| **المحادثات** | SmartTopBar + Breadcrumbs + header محلي + فلتر | شبكة أماكن أو MessagesInlineChat | main واحد؛ داخل المحادثة قائمة رسائل بحاوية محلية |
| **تفاصيل المكان** | SmartTopBar + Breadcrumbs + sticky تابات | منشورات/منتجات (VirtualList) أو محتوى التاب | main واحد |
| **لوحة التحكم** | SmartTopBar + Breadcrumbs | محتوى ثابت/قوائم | main واحد |

---

## 2. اقتراحات تحسين برمجية (مرونة + مكونات قابلة لإعادة الاستخدام)

### 2.1 مكون هيدر/شريط موحد يدعم Pinned و Collapsed

- **الفكرة:** استخراج منطق "إخفاء عند التمرير لأسفل، إظهار عند التمرير لأعلى" في مكون أو هوك مشترك بدل تكراره في الصفحة الرئيسية والأماكن.
- **مقترح تنفيذي:**
  - **هوك:** مثلاً `useScrollCollapse(options)` يرجع `{ showBar, scrollRef }` مع خيارات: `topThreshold`, `minScrollToHide`, `minScrollToShow`, `cooldownAfterHide`, `cooldownAfterShow`, `throttleMs`. الصفحات تمرر نفس الـ scrollRef من `useScrollContainer()` وتستمع على نفس العنصر.
  - **مكون:** مثلاً `<CollapsibleStickyBar show={showBar} className="...">` يلف المحتوى (أطفال) ويطبّق `maxHeight` + `opacity` + `transition` حسب `show`. يمكن استخدامه للـ Stories في الرئيسية وللقسم العلوي في الأماكن دون نسخ الكود.
- **الهيدر الرئيسي (SmartTopBar):** يمكن لاحقاً ربطه بنفس المنطق كـ "وضع مضغوط" (مثلاً ارتفاع أقل أو إخفاء جزء ثانوي) بدل ترك الهيدر ثابتاً دائماً — اختياري حسب التصميم.

### 2.2 الالتزام بالألوان والأشكال والخطوط

- **قاعدة:** لا ألوان ثابتة (hex/rgba) في المكونات؛ استخدام `useTheme()` و `colors.*` أو متغيرات CSS (`var(--color-primary)`، `var(--shadow-md)`، إلخ).
- **الأشكال:** استخدام `--radius-*`, `--element-gap`, `rounded-section`, `p-main` من globals.css.
- **الخطوط:** مكونات Typography من M3 (TitleLarge, BodyMedium, …) مع `color` من الثيم عند الحاجة.
- **الظلال:** `var(--shadow-sm)` أو `var(--shadow-md)` بدل `box-shadow` ثابت.

### 2.3 تحسين تجربة التمرير (منع تداخل السكرول)

- **الحفاظ على النموذج الحالي:** حاوية تمرير رئيسية واحدة (`main`) ومرجعها عبر `useScrollContainer()`؛ كل VirtualList تستخدم نفس الـ ref.
- **القوائم/النوافذ الداخلية:** عند الحاجة لقائمة داخل منطقة محدودة (تعليقات، رسائل، منتجات في شيت): استخدام حاوية ذات `maxHeight` وref خاص وتمرير هذا الـ ref إلى VirtualList لتلك القائمة فقط؛ تجنب وجود حاويتين بعرض كامل كلتاهما scroll.
- **توثيق:** ذكر في UNIFIED_SYSTEM_REFERENCE أو VIRTUALIZATION_STRATEGY أن التمرير المتداخل مسموح فقط في "نوافذ" محدودة الارتفاع (maxHeight) وليس في تخطيط الصفحة الكامل.

---

## 3. ملخص سريع قبل البدء في التعديل

| البند | الوضع الحالي | التوصية |
|--------|---------------|----------|
| **الثيم والألوان** | ThemeContext + globals.css مصدر واحد؛ أندرويد متوافق | الالتزام بـ colors.* ومتغيرات CSS في أي مكون جديد |
| **الهيدر** | SmartTopBar ثابت؛ Stories والأماكن لها منطق collapse مكرر | استخراج هوك/مكون موحد (مثلاً useScrollCollapse + CollapsibleStickyBar)؛ اختياري: دعم وضع Collapsed للهيدر الرئيسي لاحقاً |
| **الأشكال والخطوط** | معرّفة في globals.css و M3 | استخدام نفس المتغيرات والكلاسات في المكونات الجديدة |
| **التمرير** | main واحد + VirtualList على نفس الـ ref؛ حاويات محلية للتعليقات/المحادثة | الإبقاء على نموذج "حاوية رئيسية واحدة"؛ توثيق قاعدة التمرير المتداخل للنوافذ المحدودة فقط |

بعد الموافقة على هذا الفهم والاتجاه، يمكن البدء في تنفيذ مكون الهيدر/الشريط الموحد (CollapsibleStickyBar + useScrollCollapse) ثم نقله للصفحة الرئيسية والأماكن وإزالة التكرار.
