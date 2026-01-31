-- ============================================
-- Migration: stories legacy columns nullable
-- Purpose: جعل content_url و type اختيارية (نظام موحد: media_url, media_type)
-- Safe: ALTER COLUMN only
-- ============================================

ALTER TABLE stories ALTER COLUMN content_url DROP NOT NULL;
ALTER TABLE stories ALTER COLUMN content_url SET DEFAULT '';
ALTER TABLE stories ALTER COLUMN type DROP NOT NULL;
ALTER TABLE stories ALTER COLUMN type SET DEFAULT 'image';
