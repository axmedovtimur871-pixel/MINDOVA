-- Built-in starter template (background shipped with the app at public/builtin/).
-- Upload the official ZAKOVAT design in Admin → Sertifikat shablonlari to replace it.
insert into public.certificate_templates
  (name, description, background_path, background_width, background_height, page_size, background_fit, layout, is_default, is_active)
select
  'Zakovat Andijon — asosiy',
  'Ilova bilan birga keladigan boshlang‘ich shablon. Rasmiy dizaynni yuklab, uni almashtirishingiz mumkin.',
  'builtin/zakovat-certificate.jpg', 3508, 2480, 'A4_LANDSCAPE', 'cover',
  '{}'::jsonb,   -- empty = use the default layout defined in the app
  true, true
where not exists (select 1 from public.certificate_templates);
