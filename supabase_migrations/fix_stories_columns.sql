-- ============================================
-- Migration: Fix stories table columns
-- Purpose: إضافة أعمدة ناقصة لجدول stories (media_type, media_url, expires_at)
-- Safe: ADD COLUMN IF NOT EXISTS
-- ============================================

-- إن لم يكن الجدول موجوداً، أنشئه بالكامل
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL DEFAULT '',
  media_type VARCHAR(10) NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة الأعمدة إن كانت الجدول موجوداً بدونها
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'media_url'
  ) THEN
    ALTER TABLE stories ADD COLUMN media_url TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE stories ADD COLUMN media_type VARCHAR(10) NOT NULL DEFAULT 'image';
    ALTER TABLE stories ADD CONSTRAINT stories_media_type_check CHECK (media_type IN ('image', 'video'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE stories ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stories_place_id ON stories(place_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

COMMENT ON TABLE stories IS 'حالات الأماكن (ستوريز): صاحب المحل يضيفها وتظهر للمتابعين خلال 24 ساعة';
