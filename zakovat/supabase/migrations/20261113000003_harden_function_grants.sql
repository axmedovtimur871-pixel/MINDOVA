-- Supabase grants EXECUTE on new public functions to anon/authenticated by default,
-- so "revoke ... from public" alone is not enough. Lock internal functions down.

-- Internal / trigger-only functions: nobody calls them through the API.
revoke execute on function public.log_activity(text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.audit_row_change() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.certificates_guard_update() from public, anon, authenticated;

-- Admin-only helpers: not for signed-out visitors.
revoke execute on function public.current_admin_role() from anon;
revoke execute on function public.set_certificate_status(uuid, public.certificate_status, text) from anon;

-- Kept on purpose:
--   is_admin(), has_admin_role()  – used inside RLS policies (return false for visitors)
--   verify_certificate(), public_stats() – the public verification page and homepage numbers

-- Fixed search_path for the remaining trigger functions.
alter function public.touch_updated_at() set search_path = public;
alter function public.certificates_guard_update() set search_path = public;
