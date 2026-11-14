-- MINDOVA — admin panel sertifikat shablonini saqlay olishi uchun (2026-11-14)
-- Muammo: "permission denied for table certificate_templates" — authenticated
-- roliga faqat SELECT berilgan edi. Kim yoza olishini RLS ("tpl_admin":
-- faqat is_admin()) hal qiladi; oddiy foydalanuvchi baribir yoza olmaydi.
grant insert, update on public.certificate_templates to authenticated;
-- Orqaga qaytarish: revoke insert, update on public.certificate_templates from authenticated;
