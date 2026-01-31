-- ============================================
-- Migration: Stories RLS – للمتابعين وصاحب المكان
-- Purpose: عرض الحالات (ستوريز) للمتابعين فقط + صاحب المحل
-- Safe: DDL only (policy drop + create)
-- ============================================

-- ========== 1. إزالة السياسة العامة (الجميع يشوف) ==========
DROP POLICY IF EXISTS "Anyone can view active stories" ON stories;

-- ========== 2. المتابعون يشوفون الحالات النشطة فقط ==========
CREATE POLICY "Followers can view active stories" ON stories
  FOR SELECT
  USING (
    expires_at > NOW()
    AND (
      place_id IN (
        SELECT place_id FROM follows WHERE follower_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM places
        WHERE places.id = stories.place_id AND places.user_id = auth.uid()
      )
    )
  );

-- ========== 3. توثيق ==========
COMMENT ON TABLE stories IS 'حالات الأماكن (ستوريز): صاحب المحل يضيفها وتظهر للمتابعين خلال 24 ساعة';
