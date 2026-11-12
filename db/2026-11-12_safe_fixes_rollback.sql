-- 2026-11-12_safe_fixes.sql ni bekor qilish (oldingi holatga to'liq qaytaradi)
drop policy if exists "reg_public_insert" on public.registrations;
create policy "reg_public_insert" on public.registrations
  for insert to public
  with check (((user_id is null) or (user_id = auth.uid())) and (status = 'pending'::reg_status)
              and (admin_note is null) and (status_changed_by is null));
drop function if exists public.public_stats();
drop function if exists public.sync_my_registration_names(text, text);
