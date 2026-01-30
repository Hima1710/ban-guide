# اتفاقيات قاعدة البيانات (النظام الموحد)

كل الـ migrations والـ DDL لازم تتبع القواعد دي عشان تبقى متوافقة مع النظام الموحد.

## التسمية (Naming)

| العنصر | القاعدة | مثال |
|--------|---------|------|
| الجداول | `snake_case` | `notifications`, `place_employees` |
| الأعمدة | `snake_case` | `user_id`, `title_ar`, `created_at` |
| الدوال (RPC) | `snake_case` | `send_notification`, `notify_place_followers` |
| معاملات الدوال | بادئة `p_` | `p_user_id`, `p_place_id`, `p_title_ar` |
| السياسات (RLS) | جملة وصفية بالإنجليزي | `"Users can view own notifications"` |
| الفهارس | `idx_اسم_الجدول_الأعمدة` | `idx_notifications_user_id` |

## الجداول

- **Primary key**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **تواريخ**: `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` واختياري `updated_at`
- **المراجع (FK)**: `REFERENCES الجدول(id) ON DELETE CASCADE` (أو SET NULL حسب المنطق)
- **RLS**: كل جدول له `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` مع سياسات واضحة
- **الفهارس**: فهرس على الأعمدة الأجنبية وأي عمود يُستخدم في WHERE/ORDER شائع
- **COMMENT**: `COMMENT ON TABLE` و `COMMENT ON COLUMN` للجداول والأعمدة المهمة

## الدوال (Functions / RPC)

- **اللغة**: `LANGUAGE plpgsql`
- **الأمان**: دوال الـ notification أو أي دالة تعمل نيابة عن المستخدم: `SECURITY DEFINER SET search_path = public`
- **المعاملات**: أسماء واضحة مع بادئة `p_`، وأنواع متوافقة مع الجداول (مثلاً `p_type` يطابق `notifications.type`)
- **قيم الـ type**: نفس قيم الـ CHECK في جدول `notifications`:
  `'message','subscription','employee_request','post','product','system','promotion','payment'`
- **COMMENT**: `COMMENT ON FUNCTION اسم_الدالة IS 'وصف قصير';`

## الـ Migrations

- في أول الملف: بلوك تعليق فيه **Migration:**، **Purpose:**، **Safe:** (DDL فقط أو وصف التعديل على الداتا)
- تقسيم المنطقي: `-- ========== 1. اسم_القسم ==========`
- عدم الاعتماد على IDs مولدة في migrations الداتا (لا hardcode لـ UUIDs)

## التطابق مع التطبيق

- أنواع الإشعارات في الـ DB (CHECK على `notifications.type`) تطابق `NotificationType` في `lib/types/database.ts`
- استدعاء الـ RPC من التطبيق يستخدم نفس أسماء المعاملات (`p_place_id`, `p_title_ar`, …) كما في الدالة
