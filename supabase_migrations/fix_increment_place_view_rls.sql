-- عدّ المشاهدات يجب أن يعمل لأي زائر (ليس فقط مالك المكان).
-- RPC يعمل بصلاحيات المستدعي فـ RLS يمنع UPDATE من غير المالك.
-- جعل الدالة SECURITY DEFINER مع search_path آمن.

CREATE OR REPLACE FUNCTION public.increment_place_view(place_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE places
  SET total_views = total_views + 1,
      today_views = CASE
        WHEN last_view_reset_date = CURRENT_DATE THEN today_views + 1
        ELSE 1
      END,
      last_view_reset_date = CURRENT_DATE
  WHERE id = place_uuid;
END;
$$;

COMMENT ON FUNCTION public.increment_place_view(UUID) IS 'يزيد عداد مشاهدات المكان (اليوم والإجمالي)؛ يعمل لأي زائر بفضل SECURITY DEFINER.';
