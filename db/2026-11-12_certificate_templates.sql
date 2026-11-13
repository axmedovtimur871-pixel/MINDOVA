-- MINDOVA — sertifikat shablonlari (2026-11-12)
-- Faqat qo'shimcha: hech narsa o'chirilmaydi.
-- 1) Shablonlarni hamma o'qiy oladi (ularda shaxsiy ma'lumot yo'q, faqat dizayn sozlamalari).
--    Yaratish/o'zgartirish avvalgidek faqat adminlarga ("tpl_admin" siyosati).
-- 2) cert_template_by_code(): /verify sahifasi sertifikatni to'g'ri shablonda chizishi uchun.
-- Orqaga qaytarish: 2026-11-12_certificate_templates_rollback.sql

drop policy if exists "tpl_read" on public.certificate_templates;
create policy "tpl_read" on public.certificate_templates
  for select to anon, authenticated using (true);

create or replace function public.cert_template_by_code(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select t.config from public.certificates c
       join public.certificate_templates t on t.id = c.template_id
      where upper(c.code) = upper(trim(p_code)) and t.config ? 'bg_url' limit 1),
    (select config from public.certificate_templates
      where is_active and config ? 'bg_url' order by created_at desc limit 1)
  )
$$;
revoke all on function public.cert_template_by_code(text) from public;
grant execute on function public.cert_template_by_code(text) to anon, authenticated;
