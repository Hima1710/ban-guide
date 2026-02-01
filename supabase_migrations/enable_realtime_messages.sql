-- تفعيل Realtime لجدول messages حتى تعمل المحادثات في الوقت الفعلي.
-- يضيف الجدول إلى منشور supabase_realtime إن لم يكن مضافاً.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END
$$;
