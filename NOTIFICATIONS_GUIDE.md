# 🔔 دليل نظام الإشعارات

**التاريخ:** 2026-01-21  
**الحالة:** ✅ جاهز للاستخدام

---

## 📋 المكونات المُضافة

### 1. Hook: `useNotifications.ts`
```typescript
import { useNotifications } from '@/hooks/useNotifications'

const { 
  notifications,      // قائمة الإشعارات
  unreadCount,       // عدد الإشعارات غير المقروءة
  loading,           // حالة التحميل
  markAsRead,        // تحديد إشعار كمقروء
  markAllAsRead,     // تحديد الكل كمقروء
  refresh            // إعادة تحميل الإشعارات
} = useNotifications(userId)
```

### 2. Component: `NotificationBell.tsx`
- ✅ أيقونة جرس في TopBar
- ✅ Badge أحمر مع عدد الإشعارات
- ✅ قائمة منسدلة M3 (rounded-3xl)
- ✅ Real-time updates
- ✅ 8 أنواع إشعارات مختلفة

### 3. API: `lib/api/notifications.ts`
Helper functions لإرسال الإشعارات

---

## 🚀 كيفية الاستخدام

### إرسال إشعار مخصص

```typescript
import { sendNotification } from '@/lib/api/notifications'

await sendNotification({
  userId: user.id,
  titleAr: 'عنوان الإشعار',
  titleEn: 'Notification Title',
  messageAr: 'محتوى الإشعار بالعربية',
  messageEn: 'Notification content in English',
  type: 'message', // أو أي نوع آخر
  link: '/dashboard/page',
  icon: '💬',
  priority: 'high' // low, normal, high, urgent
})
```

### إرسال إشعار رسالة جديدة

```typescript
import { sendMessageNotification } from '@/lib/api/notifications'

await sendMessageNotification(
  recipientUserId,
  'صيدلية النور',
  placeId
)
```

### إرسال تنبيه انتهاء الاشتراك

```typescript
import { sendSubscriptionExpiryNotification } from '@/lib/api/notifications'

await sendSubscriptionExpiryNotification(userId, 3) // 3 أيام متبقية
```

### إشعار طلب موظف جديد

```typescript
import { sendEmployeeRequestNotification } from '@/lib/api/notifications'

await sendEmployeeRequestNotification(
  placeOwnerId,
  'صيدلية النور',
  placeId,
  'أحمد محمد'
)
```

### تأكيد الدفع

```typescript
import { sendPaymentConfirmationNotification } from '@/lib/api/notifications'

await sendPaymentConfirmationNotification(
  userId,
  500, // المبلغ
  'الباقة الذهبية'
)
```

### إشعار ترويجي

```typescript
import { sendPromotionNotification } from '@/lib/api/notifications'

await sendPromotionNotification(
  userId,
  'عرض خاص! 🎁',
  'احصل على خصم 50% على جميع الباقات',
  '/dashboard/packages'
)
```

---

## 🎨 أنواع الإشعارات

| النوع | الأيقونة | اللون | الاستخدام |
|------|---------|-------|-----------|
| `message` | 💬 | أزرق | رسائل جديدة من العملاء |
| `subscription` | 💳 | أخضر | اشتراكات وباقات |
| `employee_request` | 👥 | برتقالي | طلبات الموظفين |
| `post` | 📝 | بنفسجي | منشورات جديدة |
| `product` | 🛍️ | وردي | منتجات |
| `system` | ⚙️ | رمادي | إشعارات النظام |
| `promotion` | 🎁 | أحمر | عروض ترويجية |
| `payment` | 💰 | أخضر | مدفوعات |

---

## 🎯 مستويات الأولوية

```typescript
type Priority = 'low' | 'normal' | 'high' | 'urgent'
```

- **low**: إشعارات عامة
- **normal**: إشعارات عادية (افتراضي)
- **high**: مهمة (رسائل، طلبات)
- **urgent**: عاجلة جداً (انتهاء اشتراك)

---

## 📱 الإشعار الترحيبي

يتم إرسال إشعار تلقائياً عند:

### أول تسجيل دخول:
```
🎉 مرحباً بك في بان!
نحن سعداء بانضمامك إلينا. استكشف المحلات والصيدليات القريبة منك الآن!
```

### تسجيل دخول عائد:
```
👋 مرحباً بعودتك!
سعداء برؤيتك مجدداً. تحقق من التحديثات الجديدة!
```

---

## 🧪 الاختبار

### 1. اختبار يدوي في UI
```bash
# سجل خروج ثم دخول
# ستصلك إشعار ترحيبي
```

### 2. اختبار من SQL Editor
```sql
-- أرسل إشعار تجريبي
SELECT send_notification(
  'your-user-id-here',
  'اختبار الإشعارات',
  'هذا إشعار تجريبي للتأكد من عمل النظام',
  'system',
  '/dashboard'
);

-- تحقق من الإشعارات
SELECT * FROM notifications 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 5;
```

### 3. اختبار Real-time
```typescript
// افتح صفحتين بنفس المستخدم
// أرسل إشعار من إحداها
// ستراه يظهر فوراً في الأخرى
```

---

## 🔥 Real-time Features

النظام يستخدم Supabase Realtime:
- ✅ تحديث فوري عند إشعار جديد
- ✅ لا حاجة لـ polling
- ✅ يعمل عبر التبويبات (tabs)
- ✅ كفاءة عالية في استهلاك الموارد

---

## 🎨 التخصيص

### تغيير أيقونة الإشعار
```typescript
await sendNotification({
  // ...
  icon: '🔥', // أي emoji
})
```

### إضافة نوع إشعار جديد

1. **أضف النوع في قاعدة البيانات:**
```sql
-- تم تعريف الأنواع في CREATE TABLE
-- يمكن تعديل الـ CHECK constraint إذا احتجت
```

2. **أضف الستايل في `NotificationBell.tsx`:**
```typescript
const styles = {
  // ...
  new_type: { icon: '🆕', color: '#FF6B6B' }
}
```

---

## 📊 إحصائيات الإشعارات

### جلب عدد الإشعارات غير المقروءة
```typescript
const { data } = await supabase
  .from('notifications')
  .select('id', { count: 'exact' })
  .eq('user_id', userId)
  .eq('is_read', false)
```

### جلب الإشعارات حسب النوع
```typescript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('type', 'message')
  .order('created_at', { ascending: false })
```

---

## 🔐 الأمان

### RLS Policies موجودة:
- ✅ المستخدمون يرون إشعاراتهم فقط
- ✅ المستخدمون يستطيعون تحديثها (mark as read)
- ✅ المشرفون يرون كل الإشعارات
- ✅ `send_notification()` بـ SECURITY DEFINER

---

## 🚧 خطط المستقبل

### قريباً:
- [ ] صفحة إشعارات كاملة (`/dashboard/notifications`)
- [ ] فلترة حسب النوع
- [ ] بحث في الإشعارات
- [ ] إعدادات الإشعارات (تفعيل/تعطيل أنواع معينة)
- [ ] إشعارات Push (Browser notifications)
- [ ] Sound notifications
- [ ] Notification groups

---

## 💡 نصائح

### ✅ Best Practices:

1. **استخدم أنواع مناسبة:**
   - رسائل → `message`
   - باقات → `subscription`
   - نظام → `system`

2. **أضف روابط:**
   - كل إشعار يجب أن يحتوي `link`
   - يأخذ المستخدم للصفحة المطلوبة

3. **حدد الأولوية:**
   - عاجل → `urgent`
   - مهم → `high`
   - عادي → `normal`

4. **ترجمة:**
   - أضف `titleEn` و `messageEn`
   - يدعم المستقبل متعدد اللغات

5. **اختبر Real-time:**
   - افتح عدة تبويبات
   - تأكد من التحديث الفوري

---

## 🎉 النتيجة

نظام إشعارات احترافي ومتكامل:
- ✅ Real-time
- ✅ Material Design 3
- ✅ 8 أنواع إشعارات
- ✅ Helper functions جاهزة
- ✅ Responsive
- ✅ آمن (RLS)
- ✅ سريع وفعّال

**المستخدمون سيحبون هذا!** 🚀
