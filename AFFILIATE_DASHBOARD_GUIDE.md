# 💰 دليل لوحة المسوق - Affiliate Dashboard Guide

**التاريخ:** 2026-01-21  
**الحالة:** ✅ جاهز للاستخدام

---

## 🎯 نظرة عامة

لوحة تحكم متكاملة للمسوقين تدعم **تعدد الأدوار**:
- 💰 **المسوق**: إدارة الأرباح والعمولات
- 🏪 **صاحب أماكن**: إدارة الصيدليات والمحلات
- **كلاهما**: في نفس الوقت!

---

## 📋 المكونات

### 1. Hook: `useAffiliate.ts`

```typescript
import { useAffiliate } from '@/hooks/useAffiliate'

const { 
  affiliate,           // بيانات المسوق
  transactions,        // سجل المعاملات (50 آخر معاملة)
  stats,              // الإحصائيات
  loading,            // حالة التحميل
  error,              // رسالة الخطأ
  copyCode,           // نسخ كود التسويق
  requestWithdrawal,  // طلب سحب
  refresh             // إعادة تحميل البيانات
} = useAffiliate()
```

#### الإحصائيات (stats):
```typescript
{
  totalEarnings: number       // إجمالي الأرباح
  pendingBalance: number      // الرصيد المتاح (من get_affiliate_balance)
  withdrawnAmount: number     // المبلغ المسحوب
  totalReferrals: number      // عدد المستخدمين المسجلين
  activeSubscriptions: number // الاشتراكات النشطة
}
```

---

### 2. Page: `dashboard/affiliate/page.tsx`

#### التبويبات:
- **💰 أرباحي**: إحصائيات وأرباح ومعاملات
- **🏪 أماكني**: رابط سريع لإدارة الأماكن

#### الكروت الإحصائية (4):
1. **الرصيد المتاح** 💚
   - يستخدم `get_affiliate_balance()`
   - زر سحب مباشر
   - أخضر + أيقونة DollarSign

2. **إجمالي الأرباح** 💙
   - مجموع كل العمولات المكتملة
   - أزرق + أيقونة TrendingUp

3. **المستخدمين المسجلين** 🧡
   - عدد من استخدموا الكود
   - برتقالي + أيقونة Users

4. **الاشتراكات النشطة** 💜
   - عدد الاشتراكات الحالية
   - بنفسجي + أيقونة ShoppingBag

---

## 🎨 التصميم - Material Design 3

### الألوان:
```typescript
// كل الألوان من ThemeContext
backgroundColor: colors.surface
color: colors.onSurface
borderColor: colors.outline
```

### Border Radius:
```
rounded-3xl = 24px   // الكروت الكبيرة
rounded-2xl = 16px   // Inputs & Buttons
rounded-full         // Buttons صغيرة & Badges
```

### Transitions:
```
hover:scale-[1.02]   // Hover على الكروت
transition-all       // Smooth animations
```

---

## 💳 جدول المعاملات

### الأعمدة:
1. **النوع** - مع أيقونة ولون
2. **المبلغ** - بالجنيه (+/-)
3. **الحالة** - Badge ملون
4. **التاريخ** - بالعربي

### أنواع المعاملات:

| النوع | الأيقونة | اللون | الوصف |
|------|---------|-------|-------|
| `earning` | 📈 ArrowUpRight | أخضر | عمولة مكتسبة |
| `withdrawal` | 📉 ArrowDownRight | أحمر | سحب |
| `bonus` | 🎁 Gift | برتقالي | مكافأة |
| `adjustment` | ⚙️ CheckCircle | رمادي | تعديل إداري |

### حالات المعاملات:

| الحالة | اللون | الوصف |
|-------|-------|-------|
| `completed` | أخضر | مكتملة |
| `pending` | برتقالي | قيد المراجعة |
| `failed` | أحمر | فشلت |
| `cancelled` | رمادي | ملغاة |

---

## 🔄 تعدد الأدوار

### السيناريو 1: مسوق فقط
```
User Profile:
  is_affiliate: true
  
Navigation:
  ✅ أرباحي (affiliate page)
  ❌ أماكني (no places)
```

### السيناريو 2: صاحب أماكن فقط
```
User Profile:
  is_affiliate: false
  
Navigation:
  ✅ أماكني (has places)
  ❌ أرباحي (not affiliate)
```

### السيناريو 3: مسوق + صاحب أماكن
```
User Profile:
  is_affiliate: true
  + has places
  
Navigation:
  ✅ أرباحي (affiliate page)
  ✅ أماكني (places page)
  
في صفحة المسوق:
  Tab 1: أرباحي (الأرباح والعمولات)
  Tab 2: أماكني (الأماكن الخاصة به)
```

---

## 💸 نظام السحب

### الخطوات:
1. المستخدم ينقر زر "سحب"
2. يفتح Modal
3. يدخل المبلغ المطلوب
4. النظام يتحقق من الرصيد
5. ينشئ معاملة بحالة `pending`
6. المشرف يراجع ويوافق
7. تتحول الحالة إلى `completed`

### التحققات:
```typescript
✅ المبلغ > 0
✅ المبلغ <= الرصيد المتاح
✅ المستخدم لديه سجل affiliate
```

### في قاعدة البيانات:
```sql
INSERT INTO affiliate_transactions (
  affiliate_id,
  transaction_type,
  amount,
  description_ar,
  status
) VALUES (
  'affiliate-id',
  'withdrawal',
  -500,  -- سالب للسحب
  'طلب سحب 500 جنيه',
  'pending'
);
```

---

## 🧪 الاختبار

### 1. إنشاء مسوق تجريبي:

```sql
-- في Supabase SQL Editor

-- 1. تحديث البروفايل
UPDATE user_profiles
SET is_affiliate = true
WHERE email = 'your-email@example.com';

-- 2. إنشاء سجل المسوق
INSERT INTO affiliates (
  user_id,
  code,
  discount_percentage,
  total_earnings,
  paid_earnings,
  pending_earnings
) VALUES (
  (SELECT id FROM user_profiles WHERE email = 'your-email@example.com'),
  'MYCODE10',
  10,
  0,
  0,
  0
);

-- 3. إضافة معاملات تجريبية
INSERT INTO affiliate_transactions (
  affiliate_id,
  transaction_type,
  amount,
  description_ar,
  status
) VALUES 
  (
    (SELECT id FROM affiliates WHERE code = 'MYCODE10'),
    'earning',
    500,
    'عمولة اشتراك جديد',
    'completed'
  ),
  (
    (SELECT id FROM affiliates WHERE code = 'MYCODE10'),
    'earning',
    300,
    'عمولة تجديد اشتراك',
    'completed'
  ),
  (
    (SELECT id FROM affiliates WHERE code = 'MYCODE10'),
    'bonus',
    100,
    'مكافأة شهرية',
    'completed'
  );

-- 4. التحقق
SELECT * FROM affiliates WHERE code = 'MYCODE10';
SELECT * FROM affiliate_transactions 
WHERE affiliate_id = (SELECT id FROM affiliates WHERE code = 'MYCODE10');
SELECT get_affiliate_balance((SELECT id FROM affiliates WHERE code = 'MYCODE10'));
```

---

### 2. اختبار الواجهة:

```bash
1. افتح: http://localhost:3000
2. سجل دخول بالحساب الذي عدلته
3. انقر "أرباحي" من القائمة الجانبية
4. يجب أن ترى:
   ✅ الرصيد المتاح: 800.00 جنيه
   ✅ إجمالي الأرباح: 900.00 جنيه
   ✅ 3 معاملات في الجدول
```

---

### 3. اختبار طلب السحب:

```bash
1. في صفحة المسوق
2. انقر زر "سحب" في كارد الرصيد المتاح
3. أدخل مبلغ (مثلاً 500)
4. انقر "تأكيد"
5. يجب أن:
   ✅ ينشأ معاملة سحب pending
   ✅ تظهر في الجدول
   ✅ الرصيد المتاح يبقى كما هو (حتى الموافقة)
```

---

## 🔐 الأمان

### RLS Policies نشطة:
- ✅ المسوقون يرون معاملاتهم فقط
- ✅ المشرفون يرون كل المعاملات
- ✅ المستخدمون العاديون لا يرون شيء
- ✅ `get_affiliate_balance()` بـ SECURITY DEFINER

### التحققات:
- ✅ فقط من لديه سجل في `affiliates` يدخل الصفحة
- ✅ التحقق من `profile.is_affiliate`
- ✅ لا يمكن السحب أكثر من الرصيد

---

## 📱 Responsive Breakpoints

### Desktop (lg: 1024px+):
```
Grid: 4 columns (stats cards)
Table: Full width
Tabs: Horizontal
```

### Tablet (md: 768px+):
```
Grid: 2 columns
Table: Scrollable
```

### Mobile (< 768px):
```
Grid: 1 column (stacked)
Tabs: Horizontal scroll
Modal: Full width - padding
```

---

## 🔄 توحيد المسميات

### ✅ التغييرات:

| قبل | بعد | السبب |
|-----|-----|-------|
| محلاتي | أماكني | شمولية (صيدليات، مطاعم، خدمات) |
| لوحة المسوق | أرباحي | أوضح وأسهل |
| My Shops | My Places | شامل أكثر |

### الأماكن المُحدّثة:
- ✅ `config/navigation.ts` - "أماكني" في التبويبات
- ✅ `dashboard/affiliate/page.tsx` - تبويب "أماكني"

---

## 🚀 Integration Examples

### إرسال عمولة عند اشتراك جديد:

```typescript
// في subscription confirmation
import { supabase } from '@/lib/supabase'

// Get affiliate from code
const { data: affiliate } = await supabase
  .from('affiliates')
  .select('id')
  .eq('code', affiliateCodeUsed)
  .single()

if (affiliate) {
  // Calculate commission (مثلاً 20% من المبلغ)
  const commission = subscriptionAmount * 0.20

  // Create earning transaction
  await supabase
    .from('affiliate_transactions')
    .insert({
      affiliate_id: affiliate.id,
      transaction_type: 'earning',
      amount: commission,
      description_ar: `عمولة اشتراك جديد - ${packageName}`,
      reference_type: 'subscription',
      reference_id: subscriptionId,
      status: 'completed'
    })

  // Send notification
  await sendNotification({
    userId: affiliate.user_id,
    titleAr: 'عمولة جديدة! 💰',
    messageAr: `ربحت ${commission} جنيه من اشتراك جديد`,
    type: 'payment',
    link: '/dashboard/affiliate',
    priority: 'high'
  })
}
```

---

### معالجة طلب سحب (من Admin Panel):

```typescript
// في admin panel
const approveWithdrawal = async (transactionId: string) => {
  await supabase
    .from('affiliate_transactions')
    .update({ 
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId)

  // Send notification to affiliate
  await sendNotification({
    userId: affiliateUserId,
    titleAr: 'تم الموافقة على السحب ✅',
    messageAr: 'تم الموافقة على طلب السحب. سيتم التحويل قريباً.',
    type: 'payment',
    priority: 'high'
  })
}
```

---

## 📊 معادلات الحسابات

### الرصيد المتاح (Pending Balance):
```sql
-- من get_affiliate_balance() function
SELECT COALESCE(SUM(
  CASE 
    WHEN transaction_type IN ('earning', 'bonus', 'adjustment') THEN amount
    WHEN transaction_type = 'withdrawal' THEN -amount
    ELSE 0
  END
), 0) as balance
FROM affiliate_transactions
WHERE affiliate_id = 'affiliate-id'
AND status = 'completed';
```

### إجمالي الأرباح (Total Earnings):
```typescript
transactions
  .filter(t => t.transaction_type === 'earning' && t.status === 'completed')
  .reduce((sum, t) => sum + t.amount, 0)
```

### المسحوبات (Withdrawals):
```typescript
transactions
  .filter(t => t.transaction_type === 'withdrawal' && t.status === 'completed')
  .reduce((sum, t) => sum + t.amount, 0)
```

---

## 🎯 User Journey - المسوق

### الخطوة 1: التسجيل كمسوق
```
1. المشرف ينشئ سجل في affiliates
2. يحدد كود التسويق
3. يحدد نسبة الخصم
4. يُفعل is_affiliate في user_profiles
```

### الخطوة 2: نسخ الكود
```
1. المسوق يدخل لوحته
2. ينقر "نسخ الكود"
3. يشارك الكود مع العملاء
```

### الخطوة 3: ربح العمولات
```
1. عميل يسجل باستخدام الكود
2. يشترك في باقة
3. النظام يحسب العمولة (20%)
4. يضيف معاملة earning
5. المسوق يرى الرصيد يزيد
6. يصله إشعار 💰
```

### الخطوة 4: طلب السحب
```
1. المسوق ينقر "سحب"
2. يدخل المبلغ
3. ينشأ معاملة withdrawal (pending)
4. المشرف يراجع
5. يوافق → completed
6. المسوق يصله إشعار ✅
```

---

## 🛠️ Admin Operations

### موافقة على السحب:

```sql
-- في Admin Panel
UPDATE affiliate_transactions
SET 
  status = 'completed',
  updated_at = NOW()
WHERE id = 'transaction-id'
AND transaction_type = 'withdrawal'
AND status = 'pending';
```

### إضافة مكافأة:

```sql
INSERT INTO affiliate_transactions (
  affiliate_id,
  transaction_type,
  amount,
  description_ar,
  status
) VALUES (
  'affiliate-id',
  'bonus',
  200,
  'مكافأة شهر ديسمبر',
  'completed'
);
```

### تعديل رصيد:

```sql
INSERT INTO affiliate_transactions (
  affiliate_id,
  transaction_type,
  amount,
  description_ar,
  status
) VALUES (
  'affiliate-id',
  'adjustment',
  -50,  -- سالب للخصم، موجب للإضافة
  'تصحيح خطأ في الحساب',
  'completed'
);
```

---

## 📈 مؤشرات الأداء (KPIs)

### للمسوق:
- إجمالي الأرباح
- الرصيد المتاح
- عدد المستخدمين المُحالين
- الاشتراكات النشطة
- معدل التحويل (Conversion Rate)

### للإدارة:
- إجمالي العمولات المدفوعة
- عدد المسوقين النشطين
- أعلى المسوقين ربحاً
- طلبات السحب المعلقة

---

## 🎨 التخصيص

### تغيير نسبة العمولة:

```typescript
// في subscription logic
const commissionRate = 0.20 // 20%
const commission = subscriptionAmount * commissionRate
```

### إضافة نوع معاملة جديد:

1. **في قاعدة البيانات:**
```sql
ALTER TABLE affiliate_transactions 
DROP CONSTRAINT affiliate_transactions_transaction_type_check;

ALTER TABLE affiliate_transactions 
ADD CONSTRAINT affiliate_transactions_transaction_type_check 
CHECK (transaction_type IN ('earning', 'withdrawal', 'adjustment', 'bonus', 'refund'));
```

2. **في الكود:**
```typescript
// في getTransactionStyle()
const styles = {
  // ...
  refund: { label: 'استرداد', color: '#EC4899', icon: RefundIcon }
}
```

---

## 🔄 Real-time Updates

الصفحة تدعم Real-time بشكل غير مباشر:
- ✅ الإشعارات Real-time (عند وصول عمولة جديدة)
- ⏭️ يمكن إضافة subscription للمعاملات

```typescript
// Future: Real-time transactions
useEffect(() => {
  const channel = supabase
    .channel('affiliate-transactions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'affiliate_transactions',
        filter: `affiliate_id=eq.${affiliate.id}`
      },
      () => refresh()
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [affiliate?.id])
```

---

## 📝 Next Steps (اختياري)

### صفحة Admin للمسوقين:
- [ ] `/admin/affiliates` - إدارة المسوقين
- [ ] موافقة على طلبات السحب
- [ ] عرض إحصائيات كل مسوق
- [ ] إضافة/تعطيل مسوقين

### تحسينات:
- [ ] Charts للأرباح (خط زمني)
- [ ] Filters للمعاملات (حسب النوع/التاريخ)
- [ ] Export CSV للمعاملات
- [ ] Payment method selection (بنك، Instapay، etc)

---

## 🎉 النتيجة

صفحة مسوق احترافية:
- ✅ تصميم M3 موحد
- ✅ تدعم تعدد الأدوار
- ✅ متصلة بالجداول الجديدة
- ✅ حسابات دقيقة
- ✅ نظام سحب متكامل
- ✅ مسميات موحدة ("أماكني")
- ✅ Real-time notifications
- ✅ Responsive 100%
- ✅ آمنة (RLS)

**المسوقون سيحبون هذا النظام!** 💰🚀
