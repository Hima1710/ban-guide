# 🗄️ Supabase Database Schema Analysis

**Project:** BAN - دليل المحلات والصيدليات  
**Date:** 2026-01-21  
**Status:** Analysis Complete

---

## 📊 Current Database Schema

### ✅ Existing Tables (From Migrations)

#### 1. **Core Tables** (Assumed to exist)
```sql
- auth.users (Supabase Auth)
- user_profiles (User data)
- places (Business listings)
- products (Product catalog)
- messages (Chat system)
- packages (Subscription packages)
- subscriptions (Active subscriptions)
```

#### 2. **Employee Management** ✅
```sql
- employee_requests (Job applications)
- place_employees (Accepted employees)
```

#### 3. **Posts System** ✅
```sql
- posts (Place posts - text/image/video)
```

#### 4. **Affiliate System** ✅
```sql
- affiliates (Affiliate records)
```

#### 5. **Discount System** ✅
```sql
- discount_codes (Discount codes with dates)
```

#### 6. **YouTube Integration** ✅
```sql
- youtube_tokens (YouTube API tokens)
```

#### 7. **Enhancements** ✅
```sql
- messages.employee_id (Employee who sent message)
- messages.product_id (Product reference)
- messages.recipient_id (Message recipient)
- messages.audio_url (Voice messages)
- messages.reply_to (Message threading)
- places.logo_url (Place logo)
- subscriptions.receipt_id (Payment receipt)
```

---

## 🔍 Schema Gaps Analysis

### ❌ Missing Tables

#### 1. **Affiliate Transactions** (MISSING)
**Purpose:** Track affiliate earnings and payments

```sql
CREATE TABLE affiliate_transactions (
  id UUID PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates(id),
  transaction_type VARCHAR(20),
  amount DECIMAL(10,2),
  description TEXT,
  created_at TIMESTAMP
);
```

**Need:** Track when affiliates earn money, when they withdraw, etc.

---

#### 2. **Package Features** (MISSING)
**Purpose:** Define what each package includes

```sql
CREATE TABLE package_features (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES packages(id),
  feature_name_ar TEXT,
  feature_name_en TEXT,
  is_included BOOLEAN
);
```

**Need:** Store detailed package features (e.g., "5 featured listings", "YouTube upload")

---

#### 3. **Place Views** (MISSING)
**Purpose:** Track place page views for analytics

```sql
CREATE TABLE place_views (
  id UUID PRIMARY KEY,
  place_id UUID REFERENCES places(id),
  user_id UUID REFERENCES auth.users(id), -- nullable
  viewed_at TIMESTAMP,
  ip_address INET
);
```

**Need:** Analytics for place owners

---

#### 4. **Product Categories** (MISSING)
**Purpose:** Organize products into categories

```sql
CREATE TABLE product_categories (
  id UUID PRIMARY KEY,
  name_ar TEXT,
  name_en TEXT,
  icon TEXT,
  created_at TIMESTAMP
);

ALTER TABLE products 
ADD COLUMN category_id UUID REFERENCES product_categories(id);
```

**Need:** Better product organization

---

#### 5. **Notifications** (MISSING)
**Purpose:** User notifications system

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT,
  message TEXT,
  type VARCHAR(20),
  is_read BOOLEAN,
  link TEXT,
  created_at TIMESTAMP
);
```

**Need:** Notify users of messages, subscription expiry, etc.

---

### ⚠️ Missing Columns in Existing Tables

#### user_profiles
```sql
-- Missing columns that might be needed:
- phone_verified_at TIMESTAMP
- last_login_at TIMESTAMP
- profile_completeness INTEGER (0-100)
- notification_preferences JSONB
```

#### places
```sql
-- Missing columns:
- featured_until TIMESTAMP  -- When featured listing expires
- view_count INTEGER        -- Total views
- rating_count INTEGER      -- Number of ratings
- average_rating DECIMAL    -- Average rating (0-5)
- verification_status VARCHAR(20) -- pending/verified/rejected
- verification_notes TEXT
```

#### subscriptions
```sql
-- Missing columns:
- auto_renew BOOLEAN       -- Auto-renewal flag
- payment_method VARCHAR(50) -- Payment method used
- cancelled_at TIMESTAMP   -- Cancellation date
- cancel_reason TEXT       -- Why cancelled
```

#### packages
```sql
-- Missing columns:
- is_featured BOOLEAN      -- Show on homepage
- sort_order INTEGER       -- Display order
- icon TEXT                -- Package icon
```

---

## 📋 Complete Migration Script Needed

### Priority 1: Essential (User Journey Requirements)
1. ✅ Affiliate transactions table
2. ✅ Notifications table
3. ✅ Add missing columns to places
4. ✅ Add missing columns to subscriptions
5. ✅ Add missing columns to packages

### Priority 2: Important (Better UX)
6. ✅ Package features table
7. ✅ Place views table
8. ✅ Product categories

### Priority 3: Nice to Have
9. ⭕ Message attachments table
10. ⭕ User activity logs
11. ⭕ System settings table

---

## 🔐 RLS Policies Needed

### Missing RLS Policies

#### 1. **Affiliate Transactions**
```sql
- Affiliates can view own transactions
- Admins can view all transactions
- System can insert transactions (SECURITY DEFINER)
```

#### 2. **Notifications**
```sql
- Users can view own notifications
- Users can update own notifications (mark as read)
- System can insert notifications (SECURITY DEFINER)
```

#### 3. **Package Features**
```sql
- Everyone can view active package features
- Admins can manage package features
```

#### 4. **Place Views**
```sql
- Place owners can view own place views
- Admins can view all views
- System can insert views (SECURITY DEFINER)
```

---

## 🎯 Naming Conventions (Standardized)

### Column Naming
```
✅ CORRECT:
- created_at (not createdAt or created_date)
- updated_at (not updatedAt or modified_at)
- user_id (not userId or uid)
- is_active (not active or isActive)
- phone_number (not phone or phoneNumber)

❌ AVOID:
- Mixed case (createdAt)
- Inconsistent naming (created_date vs updated_at)
- Unclear abbreviations (usr_id)
```

### Table Naming
```
✅ CORRECT:
- Plural nouns (users, places, products)
- Snake case (user_profiles, place_employees)
- Descriptive (affiliate_transactions)

❌ AVOID:
- Singular (user, place)
- Camel case (userProfiles)
- Unclear (trans, data)
```

### Foreign Key Naming
```
✅ CORRECT:
- References table name + _id (user_id, place_id)
- Clear relationship (created_by, owned_by)

❌ AVOID:
- Generic names (id, ref)
- Unclear (fk1, fk2)
```

---

## 📝 Migration Checklist

### Before Running Migration
- [ ] Backup database
- [ ] Test on development/staging first
- [ ] Verify all FK references exist
- [ ] Check for naming conflicts

### Migration Steps
1. [ ] Create new tables
2. [ ] Add missing columns to existing tables
3. [ ] Create indexes for performance
4. [ ] Enable RLS on new tables
5. [ ] Create RLS policies
6. [ ] Add table/column comments
7. [ ] Test with sample data
8. [ ] Update TypeScript interfaces

### After Migration
- [ ] Verify all tables created
- [ ] Test RLS policies
- [ ] Update application code
- [ ] Test all user journeys
- [ ] Monitor for errors

---

## 🚀 Next Steps

1. **Review this analysis** - Confirm all gaps identified
2. **Run migration script** - Apply incremental updates
3. **Test thoroughly** - Verify no data loss
4. **Update TypeScript types** - Keep code in sync
5. **Document changes** - Update team knowledge base

---

**Generated:** 2026-01-21  
**Status:** Ready for Migration Script Generation
