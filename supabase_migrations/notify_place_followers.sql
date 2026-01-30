-- ============================================
-- Migration: notify_place_followers (RPC)
-- Purpose: Notify all followers of a place when new post/product is published.
-- Follows: snake_case names, p_ params, SECURITY DEFINER + search_path, COMMENT.
-- Safe: DDL only (CREATE OR REPLACE FUNCTION).
-- ============================================

-- ============================================
-- 1. notify_place_followers
-- ============================================
-- p_type must match notifications.type CHECK:
-- 'message','subscription','employee_request','post','product','system','promotion','payment'
CREATE OR REPLACE FUNCTION notify_place_followers(
  p_place_id UUID,
  p_title_ar TEXT,
  p_message_ar TEXT,
  p_type VARCHAR(30),
  p_link TEXT DEFAULT NULL,
  p_title_en TEXT DEFAULT NULL,
  p_message_en TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT f.follower_id
    FROM follows f
    WHERE f.place_id = p_place_id
  LOOP
    PERFORM send_notification(
      r.follower_id,
      p_title_ar,
      p_message_ar,
      p_type,
      p_link,
      p_title_en,
      p_message_en
    );
  END LOOP;
END;
$$;

COMMENT ON FUNCTION notify_place_followers IS 'Notify all followers of a place (e.g. new post or product).';
