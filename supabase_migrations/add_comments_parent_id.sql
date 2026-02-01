-- Migration: إضافة parent_id للرد على التعليقات
-- التعليق الجذري: parent_id = NULL. الرد: parent_id = id التعليق الأب

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

COMMENT ON COLUMN comments.parent_id IS 'معرّف التعليق الأب عند الرد؛ NULL = تعليق جذري';
