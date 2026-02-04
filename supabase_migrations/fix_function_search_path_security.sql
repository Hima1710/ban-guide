-- Migration: fix_function_search_path_security
-- Purpose: Set search_path = public on all SECURITY DEFINER / RPC functions per Supabase security advisor.
-- Safe: DDL only (ALTER FUNCTION).
-- Ref: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

ALTER FUNCTION public.get_affiliate_balance(uuid) SET search_path = public;
ALTER FUNCTION public.increment_discount_code_usage(uuid) SET search_path = public;
ALTER FUNCTION public.increment_place_view_count() SET search_path = public;
ALTER FUNCTION public.reset_daily_views() SET search_path = public;
ALTER FUNCTION public.send_notification(uuid, text, text, character varying, text, text, text) SET search_path = public;
ALTER FUNCTION public.set_admin_by_email(text) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
