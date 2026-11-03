-- MINDOVA: Click / Payme / boshqa to'lov usullari
-- Supabase Dashboard -> SQL Editor bo'limida bir marta ishga tushiring.

alter table public.payment_settings
  add column if not exists click_enabled boolean not null default false,
  add column if not exists click_service_id text,
  add column if not exists click_merchant_id text,
  add column if not exists payme_enabled boolean not null default false,
  add column if not exists payme_merchant_id text,
  add column if not exists custom_enabled boolean not null default false,
  add column if not exists custom_name text,
  add column if not exists custom_url text;

-- Admin panel payment_settings jadvalini o'qishi va saqlashi uchun.
grant select, insert, update on public.payment_settings to authenticated;

-- Supabase'da RLS yoqilgan bo'lsa ham sozlamalar o'qilishi va admin
-- tomonidan saqlanishi uchun siyosatlar (qayta ishga tushirish xavfsiz).
alter table public.payment_settings enable row level security;

drop policy if exists "payment_settings_read" on public.payment_settings;
create policy "payment_settings_read" on public.payment_settings
  for select to authenticated
  using (true);

drop policy if exists "payment_settings_admin_write" on public.payment_settings;
create policy "payment_settings_admin_write" on public.payment_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Foydalanuvchi to'lov usulini faqat o'zining kutilayotgan/rad etilgan
-- ro'yxatdan o'tishiga yozadi. Boshqa odamning yozuvini o'zgartira olmaydi.
create or replace function public.set_payment_method(p_reg_id uuid, p_method text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_method not in ('card', 'click', 'payme', 'custom') then
    raise exception 'Noto''g''ri to''lov usuli';
  end if;

  update public.registrations
     set paid_method = p_method
   where id = p_reg_id
     and user_id = auth.uid()
     and payment_status in ('pending', 'rejected');
end;
$$;

revoke all on function public.set_payment_method(uuid, text) from public;
grant execute on function public.set_payment_method(uuid, text) to authenticated;

-- Onlayn to'lovdan keyin chekni kutilayotgan to'lovga ham biriktirish.
create or replace function public.submit_payment_receipt(p_reg_id uuid, p_receipt text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.registrations
     set receipt_path = p_receipt,
         payment_status = 'pending',
         payment_note = null
   where id = p_reg_id
     and user_id = auth.uid()
     and payment_status in ('pending', 'rejected');
end;
$$;

revoke all on function public.submit_payment_receipt(uuid, text) from public;
grant execute on function public.submit_payment_receipt(uuid, text) to authenticated;

