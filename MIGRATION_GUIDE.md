# 🚀 Database Migration Guide

**Project:** BAN - دليلك للأماكن والخدمات  
**Date:** 2026-01-21  
**Migration:** complete_schema_migration.sql

---

## 📋 Pre-Migration Checklist

### ✅ Before You Start

- [ ] **Backup Database** (Optional but recommended)
  ```sql
  -- In Supabase Dashboard: Settings → Database → Backup
  ```

- [ ] **Verify Supabase Project Active**
  - Go to: https://app.supabase.com
  - Ensure project is not paused
  - Check connection status

- [ ] **Review Migration Script**
  - Open: `web/supabase_migrations/complete_schema_migration.sql`
  - Review what will be added
  - No data will be modified ✅

- [ ] **Test Connection**
  ```bash
  # From your app
  curl https://vcrmmplcmbiilysvfqhc.supabase.co/rest/v1/
  ```

---

## 🎯 Migration Methods

### Method 1: Supabase Dashboard (RECOMMENDED) ⭐

**Steps:**

1. **Open Supabase Dashboard**
   ```
   https://app.supabase.com
   ```

2. **Select Your Project**
   - Click on "BAN" project
   - Ensure it's not paused (click Resume if needed)

3. **Open SQL Editor**
   - Left sidebar → SQL Editor
   - Click "New Query"

4. **Copy Migration Script**
   - Open: `web/supabase_migrations/complete_schema_migration.sql`
   - Copy entire content (Ctrl+A, Ctrl+C)

5. **Paste and Run**
   - Paste into SQL Editor
   - Click "Run" (or Ctrl+Enter)
   - Wait 5-10 seconds

6. **Verify Success**
   ```
   ✅ You should see: "Success. No rows returned"
   ```

7. **Check New Tables**
   - Left sidebar → Table Editor
   - Should see new tables:
     - affiliate_transactions
     - notifications
     - package_features
     - place_views
     - product_categories

8. **Check New Columns**
   - Click on "places" table
   - Should see new columns:
     - featured_until
     - view_count
     - verification_status
     - etc.

**Total Time:** ~2 minutes

---

### Method 2: Command Line

**Requirements:**
- PostgreSQL client (psql)
- Database credentials

**Steps:**

1. **Get Connection String**
   ```
   Supabase Dashboard → Settings → Database → Connection String
   ```

2. **Run Migration**
   ```bash
   cd /home/zero/Desktop/BANV1/web
   
   psql "your-connection-string" \
     -f supabase_migrations/complete_schema_migration.sql
   ```

3. **Verify**
   ```bash
   psql "your-connection-string" -c "\dt" # List tables
   ```

---

### Method 3: API (Advanced)

Using Supabase Management API:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SERVICE ROLE KEY needed
)

const { data, error } = await supabase.rpc('exec_sql', {
  query: migrationScript
})
```

**Note:** Requires service role key (not recommended for security)

---

## ✅ Post-Migration Verification

### 1. Verify Tables Created

**SQL Query:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'affiliate_transactions',
  'notifications',
  'package_features',
  'place_views',
  'product_categories'
)
ORDER BY table_name;
```

**Expected Result:** 5 rows (all new tables)

---

### 2. Verify Columns Added

**Check places table:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'places'
AND column_name IN (
  'featured_until', 'view_count', 'rating_count', 
  'average_rating', 'verification_status', 'verification_notes'
);
```

**Expected Result:** 6 rows

---

### 3. Verify RLS Policies

**SQL Query:**
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN (
  'affiliate_transactions',
  'notifications',
  'package_features',
  'place_views',
  'product_categories'
)
ORDER BY tablename, policyname;
```

**Expected Result:** 15+ policies

---

### 4. Test Helper Functions

**Test get_affiliate_balance:**
```sql
-- Replace with actual affiliate_id
SELECT get_affiliate_balance('your-affiliate-id-here');
```

**Test send_notification:**
```sql
-- Replace with actual user_id
SELECT send_notification(
  'user-id-here',
  'اختبار',
  'هذا اشعار تجريبي',
  'system'
);
```

---

## 🔧 Update Application Code

### 1. Import New Types

```typescript
// In your hooks or components
import {
  AffiliateTransaction,
  Notification,
  PackageFeature,
  PlaceView,
  ProductCategory
} from '@/lib/types/database'
```

---

### 2. Use New Features

**Track Place Views:**
```typescript
// lib/api/places.ts
export async function trackPlaceView(placeId: string) {
  const { data, error } = await supabase
    .from('place_views')
    .insert({
      place_id: placeId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      ip_address: await getClientIP(),
      user_agent: navigator.userAgent,
      referrer: document.referrer
    })
  
  return { data, error }
}
```

**Send Notifications:**
```typescript
// Use helper function
const { data } = await supabase.rpc('send_notification', {
  p_user_id: userId,
  p_title_ar: 'رسالة جديدة',
  p_message_ar: 'لديك رسالة جديدة من العميل',
  p_type: 'message',
  p_link: '/dashboard/messages'
})
```

**Get Affiliate Balance:**
```typescript
const { data: balance } = await supabase.rpc('get_affiliate_balance', {
  p_affiliate_id: affiliateId
})

console.log(`Current balance: ${balance}`)
```

**Manage Product Categories:**
```typescript
// Fetch categories
const { data: categories } = await supabase
  .from('product_categories')
  .select('*')
  .eq('is_active', true)
  .order('sort_order')

// Add product with category
const { data } = await supabase
  .from('products')
  .insert({
    name_ar: 'دواء',
    category_id: categoryId,
    place_id: placeId,
    // ...
  })
```

---

## 🐛 Troubleshooting

### Issue 1: "relation already exists"
**Cause:** Table already created (migration run before)  
**Solution:** This is safe! The script uses `IF NOT EXISTS`  
**Action:** Continue - no problem

---

### Issue 2: "permission denied"
**Cause:** Not using admin/service role  
**Solution:** Use Supabase Dashboard (recommended)  
**Action:** Follow Method 1 above

---

### Issue 3: "foreign key constraint"
**Cause:** Referenced table doesn't exist  
**Solution:** Ensure base tables exist first  
**Action:** Check that `places`, `packages`, `affiliates` tables exist

---

### Issue 4: "column already exists"
**Cause:** Column already added (migration run before)  
**Solution:** This is safe! The script checks before adding  
**Action:** Continue - no problem

---

## 📊 Expected Changes

### New Tables: 5
```
✅ affiliate_transactions
✅ notifications  
✅ package_features
✅ place_views
✅ product_categories
```

### New Columns: 18
```
places:          6 columns
subscriptions:   4 columns
packages:        3 columns
products:        1 column
user_profiles:   3 columns
messages:        1 column (already added)
```

### New Indexes: 20+
```
Performance indexes for all new tables
```

### New RLS Policies: 15+
```
Complete security policies for all new tables
```

### New Functions: 3
```
✅ increment_place_view_count() - Auto-increment views
✅ get_affiliate_balance() - Calculate balance
✅ send_notification() - Create notifications
```

---

## 🎯 Testing After Migration

### Test 1: Verify Tables
```sql
SELECT COUNT(*) FROM affiliate_transactions;
SELECT COUNT(*) FROM notifications;
SELECT COUNT(*) FROM package_features;
SELECT COUNT(*) FROM place_views;
SELECT COUNT(*) FROM product_categories;
```

**Expected:** All queries succeed (may return 0 rows - that's OK)

---

### Test 2: Verify RLS
```sql
-- As a regular user, try to view another user's transactions
-- Should return 0 rows (not allowed)
SELECT * FROM affiliate_transactions 
WHERE affiliate_id != 'your-affiliate-id';
```

---

### Test 3: Insert Test Data
```sql
-- Test notification
SELECT send_notification(
  auth.uid(),
  'تجربة',
  'اشعار تجريبي',
  'system'
);

-- Test product category
INSERT INTO product_categories (name_ar, icon, color)
VALUES ('تجربة', '🧪', '#3B82F6');
```

---

## 📝 Rollback (If Needed)

**Note:** This migration is ADDITIVE ONLY (no data modification)

If you need to rollback:

```sql
-- Remove new tables (CAUTION: Deletes data!)
DROP TABLE IF EXISTS affiliate_transactions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS package_features CASCADE;
DROP TABLE IF EXISTS place_views CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;

-- Remove new columns
ALTER TABLE places DROP COLUMN IF EXISTS featured_until;
ALTER TABLE places DROP COLUMN IF EXISTS view_count;
-- ... etc
```

**WARNING:** Only run rollback if absolutely necessary!

---

## ✅ Success Confirmation

After running migration, you should see:

✅ **5 new tables** in Table Editor  
✅ **18+ new columns** across existing tables  
✅ **20+ new indexes** for performance  
✅ **15+ RLS policies** for security  
✅ **3 helper functions** for common operations  
✅ **No errors** in SQL Editor  
✅ **Sample categories** (optional)  

---

## 🎉 Next Steps

1. **✅ Run Migration** - Follow Method 1 (Dashboard)
2. **✅ Verify Success** - Check tables and columns
3. **✅ Update App Code** - Import new types
4. **✅ Test Features** - Try new functionality
5. **✅ Monitor** - Watch for errors in production

---

**🚀 Ready to migrate! The schema is production-ready and safe to deploy.**

**Questions?** Check DATABASE_SCHEMA_ANALYSIS.md for details.
