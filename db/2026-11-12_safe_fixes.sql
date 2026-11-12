-- MINDOVA — xavfsiz tuzatishlar (2026-11-12)
-- Hech qanday jadval, ustun yoki yozuv o'chirilmaydi. Faqat:
--  1) registrations jadvaliga to'g'ridan-to'g'ri yozish qoidasi qattiqlashtiriladi
--     (to'lovsiz "to'langan" yoki "keldi" yozuv yaratib bo'lmasin).
--     Sayt baribir register_event() funksiyasi orqali yozadi, u bunga bog'liq emas.
--  2) public_stats(): bosh sahifa uchun faqat umumiy sonlar (shaxsiy ma'lumot yo'q).
--  3) sync_my_registration_names(): foydalanuvchi o'z ismini o'z chiptalariga yozadi.
-- Orqaga qaytarish: 2026-11-12_safe_fixes_rollback.sql

drop policy if exists "reg_public_insert" on public.registrations;
create policy "reg_public_insert" on public.registrations
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'::reg_status
    and admin_note is null
    and status_changed_by is null
    and payment_status = 'free'
    and coalesce(amount, 0) = 0
    and coalesce(checked_in, false) = false
    and checked_in_at is null
    and checked_in_by is null
    and paid_at is null
    and exists (
      select 1 from public.events e
      where e.id = event_id and e.status = 'published' and coalesce(e.price, 0) = 0
    )
  );

create or replace function public.public_stats()
returns table(members bigint, registrations bigint, certificates bigint, events bigint)
language sql
stable
security definer
set search_path = public
as $$
  select (select count(*) from public.profiles),
         (select count(*) from public.registrations),
         (select count(*) from public.certificates where coalesce(status, 'active') = 'active'),
         (select count(*) from public.events where status = 'published')
$$;
revoke all on function public.public_stats() from public;
grant execute on function public.public_stats() to anon, authenticated;

create or replace function public.sync_my_registration_names(p_full_name text, p_telegram text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'Avval tizimga kiring'; end if;
  if char_length(trim(coalesce(p_full_name, ''))) not between 3 and 100 then
    raise exception 'Ism 3-100 belgidan iborat bo''lsin';
  end if;
  if p_telegram is not null and p_telegram !~* '^[a-z][a-z0-9_]{4,31}$' then
    raise exception 'Telegram username noto''g''ri';
  end if;
  update public.registrations
     set full_name = trim(p_full_name),
         telegram_username = coalesce(p_telegram, telegram_username),
         updated_at = now()
   where user_id = auth.uid();
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function public.sync_my_registration_names(text, text) from public;
grant execute on function public.sync_my_registration_names(text, text) to authenticated;
