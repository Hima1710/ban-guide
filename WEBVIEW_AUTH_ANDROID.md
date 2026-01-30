# متطلبات الويب فيو لتسجيل الدخول (Android)

## المشكلة من اللوج

عند اختيار الحساب من Google Account Picker يحدث التالي:

1. التطبيق يحقن الإيميل ويستدعي `receiveEmailFromNative(email)` ✓  
2. الويب يستدعي `Android.onEmailReceived()` → "Web confirmed receipt. Loop stopped." ✓  
3. الويب يستدعي **Google OAuth** (`signInWithOAuth`) فيوجّه المتصفح إلى رابط تسجيل الدخول (مثل `accounts.google.com` أو Supabase Auth).  
4. **التطبيق يعترض هذا التنقّل** (`shouldOverrideUrlLoading: اعتراض تنقل auth`) ويفتح Account Picker مرة أخرى **بدلاً من تحميل الرابط**.  
5. نتيجة ذلك: تدفق OAuth لا يكتمل أبداً، والمستخدم يظل في حلقة (اختيار حساب → اعتراض → اختيار حساب مرة أخرى).

## المطلوب في تطبيق Android

**يجب عدم اعتراض تنقلات OAuth.** السماح بتحميل الروابط التالية حتى يكتمل تسجيل الدخول:

- `https://accounts.google.com/*`
- `https://*.google.com/*` (أو على الأقل مسارات تسجيل الدخول)
- `https://*.supabase.co/*` (أو مسار مشروعك في Supabase Auth)

**منطق مقترح في `shouldOverrideUrlLoading`:**

- إذا كان الرابط **لصفحة التطبيق** (مثل `ban-guide.vercel.app/auth/login`) والمستخدم ضغط على "تسجيل الدخول" → يمكن فتح Account Picker وحقن الإيميل.  
- إذا كان الرابط **لـ Google أو Supabase Auth** (بعد أن الويب بدأ OAuth) → **لا تعترض**؛ أرجع `false` أو اسمح بتحميل الرابط حتى يفتح المستخدم صفحة Google للموافقة ثم يعود إلى التطبيق بعد نجاح الدخول.

باختصار: اعترض فقط عندما تريد أنت فتح Account Picker (مثلاً عند أول ضغطة على الدخول). بعد حقن الإيميل واستدعاء `onEmailReceived()`، أي تنقّل لاحق إلى Google/Supabase يجب أن يُحمّل في الويب فيو ولا يُعاد توجيهه لـ Account Picker.

## ملخص التدفق الصحيح

1. المستخدم يفتح صفحة تسجيل الدخول في الويب فيو.  
2. (اختياري) التطبيق يفتح Account Picker ويحقن الإيميل → الويب يستدعي `receiveEmailFromNative` ثم `signInWithOAuth(google, login_hint: email)`.  
3. المتصفح ينتقل إلى **Google** (accounts.google.com) → **يجب ألا يعترض التطبيق هذا التنقّل.**  
4. المستخدم يوافق على Google، ثم يُعاد توجيهه إلى `auth/callback` ثم الرئيسية.  
5. عندها فقط تكتمل الجلسة ويظهر المستخدم مسجّل دخولاً.

## الجلسة عند تحميل ban-app://auth-callback في الويب فيو

- العميل Supabase مُعدّ بـ **detectSessionInUrl: true** (الافتراضي في supabase-js) فيقرأ الـ fragment (#access_token=...) عند تحميل الصفحة ويُنشئ الجلسة.
- **supabase.auth.onAuthStateChange** يعمل في كل التطبيق (AuthContext)؛ عند حدث **SIGNED_IN** يتم تحديث المستخدم.
- صفحة **/auth/callback** (عميل): تستمع لـ onAuthStateChange، وعند **SIGNED_IN** تعيد التوجيه فوراً إلى **/** حتى يصل المستخدم للرئيسية بعد إكمال الدخول.
- تأكد في تطبيق الأندرويد: عند استقبال `ban-app://auth-callback#...` إما تحميل نفس الرابط في الويب فيو (أو تحميل `https://موقعك/auth/callback#...` بنفس الـ fragment) حتى يقرأ الويب الـ fragment ويُكمل الجلسة ثم التوجيه إلى /.
