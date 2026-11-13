-- =====================================================================
-- ZAKOVAT ANDIJON — initial schema
-- Tables, helper functions, Row Level Security, audit triggers,
-- public verification RPC and storage buckets.
-- Safe to run once on a fresh Supabase project.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
do $$ begin
  create type public.admin_role as enum ('super_admin', 'admin', 'certificate_manager');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.certificate_status as enum ('active', 'revoked');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- profiles: one row per auth user
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 120),
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- administrators: who may use /admin and with which role
-- ---------------------------------------------------------------------
create table if not exists public.administrators (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  role        public.admin_role not null default 'certificate_manager',
  is_active   boolean not null default true,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger administrators_touch before update on public.administrators
  for each row execute function public.touch_updated_at();

-- Role helpers (SECURITY DEFINER so they can be used inside RLS policies
-- without recursive policy evaluation).
create or replace function public.current_admin_role()
returns public.admin_role
language sql stable security definer set search_path = public as $$
  select role from public.administrators
   where user_id = auth.uid() and is_active
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.administrators where user_id = auth.uid() and is_active)
$$;

create or replace function public.has_admin_role(roles public.admin_role[])
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.administrators
     where user_id = auth.uid() and is_active and role = any (roles)
  )
$$;

revoke all on function public.current_admin_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.has_admin_role(public.admin_role[]) from public;
grant execute on function public.current_admin_role() to authenticated;
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.has_admin_role(public.admin_role[]) to authenticated, anon;

-- ---------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(title) between 2 and 200),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  summary          text not null default '' check (char_length(summary) <= 400),
  description      text not null default '' check (char_length(description) <= 8000),
  location         text not null default '' check (char_length(location) <= 200),
  starts_at        timestamptz,
  ends_at          timestamptz,
  cover_image_path text,
  registration_url text check (registration_url is null or registration_url ~* '^https?://'),
  status           text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists events_status_starts_idx on public.events (status, starts_at);
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- certificate_templates
-- layout: JSON describing positions of each layer (see src/lib/certificates/layout.ts)
-- background_path: object path inside the "media" bucket, or "builtin/<file>"
-- for images shipped with the app.
-- ---------------------------------------------------------------------
create table if not exists public.certificate_templates (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(name) between 2 and 120),
  description       text not null default '' check (char_length(description) <= 500),
  background_path   text not null,
  background_width  integer not null check (background_width > 0),
  background_height integer not null check (background_height > 0),
  page_size         text not null default 'A4_LANDSCAPE' check (page_size in ('A4_LANDSCAPE', 'A4_PORTRAIT')),
  background_fit    text not null default 'cover' check (background_fit in ('cover', 'contain')),
  layout            jsonb not null default '{}'::jsonb,
  is_default        boolean not null default false,
  is_active         boolean not null default true,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create unique index if not exists certificate_templates_one_default
  on public.certificate_templates (is_default) where is_default;
create trigger certificate_templates_touch before update on public.certificate_templates
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- certificate_batches: one row per bulk upload (used for the ZIP download)
-- ---------------------------------------------------------------------
create table if not exists public.certificate_batches (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid references public.events (id) on delete set null,
  template_id  uuid references public.certificate_templates (id) on delete set null,
  source_name  text not null default '' check (char_length(source_name) <= 255),
  total_rows   integer not null default 0 check (total_rows >= 0),
  created_by   uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- certificates
-- ---------------------------------------------------------------------
create table if not exists public.certificates (
  id                  uuid primary key default gen_random_uuid(),
  certificate_number  text not null unique check (certificate_number ~ '^[A-Z0-9-]{6,40}$'),
  verification_token  text not null unique check (char_length(verification_token) >= 24),
  first_name          text not null check (char_length(btrim(first_name)) between 1 and 80),
  last_name           text not null check (char_length(btrim(last_name)) between 1 and 80),
  event_id            uuid references public.events (id) on delete restrict,
  event_name          text not null check (char_length(event_name) between 1 and 200),
  certificate_type    text not null default '' check (char_length(certificate_type) <= 120),
  template_id         uuid references public.certificate_templates (id) on delete restrict,
  issue_date          date not null default current_date,
  organizer           text not null default '' check (char_length(organizer) <= 200),
  description         text not null default '' check (char_length(description) <= 500),
  pdf_path            text,
  status              public.certificate_status not null default 'active',
  revoked_at          timestamptz,
  revoked_by          uuid references public.profiles (id) on delete set null,
  revoke_reason       text check (revoke_reason is null or char_length(revoke_reason) <= 500),
  batch_id            uuid references public.certificate_batches (id) on delete set null,
  idempotency_key     text unique check (idempotency_key is null or char_length(idempotency_key) <= 100),
  created_by          uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists certificates_created_idx on public.certificates (created_at desc);
create index if not exists certificates_event_idx on public.certificates (event_id);
create index if not exists certificates_batch_idx on public.certificates (batch_id);
create index if not exists certificates_status_idx on public.certificates (status);
create index if not exists certificates_dupe_idx
  on public.certificates (lower(btrim(first_name)), lower(btrim(last_name)), lower(event_name));
create trigger certificates_touch before update on public.certificates
  for each row execute function public.touch_updated_at();

-- Identity fields are immutable once issued: a certificate is either valid
-- or revoked; it is never silently rewritten.
create or replace function public.certificates_guard_update()
returns trigger language plpgsql as $$
begin
  if new.certificate_number is distinct from old.certificate_number
     or new.verification_token is distinct from old.verification_token
     or new.first_name is distinct from old.first_name
     or new.last_name is distinct from old.last_name
     or new.event_name is distinct from old.event_name
     or new.issue_date is distinct from old.issue_date
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at then
    raise exception 'Issued certificate details cannot be changed. Revoke it and issue a new one.';
  end if;
  return new;
end $$;
create trigger certificates_guard before update on public.certificates
  for each row execute function public.certificates_guard_update();

-- ---------------------------------------------------------------------
-- verification_logs (written only by verify_certificate())
-- ---------------------------------------------------------------------
create table if not exists public.verification_logs (
  id              bigint generated always as identity primary key,
  certificate_id  uuid references public.certificates (id) on delete set null,
  query           text not null,
  method          text not null check (method in ('qr', 'manual')),
  result          text not null check (result in ('verified', 'revoked', 'not_found')),
  ip_hash         text,
  user_agent      text,
  created_at      timestamptz not null default now()
);
create index if not exists verification_logs_created_idx on public.verification_logs (created_at desc);

-- ---------------------------------------------------------------------
-- activity_logs (audit trail; written by triggers and SECURITY DEFINER functions)
-- ---------------------------------------------------------------------
create table if not exists public.activity_logs (
  id           bigint generated always as identity primary key,
  actor_id     uuid references public.profiles (id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    text,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists activity_logs_created_idx on public.activity_logs (created_at desc);

create or replace function public.log_activity(p_action text, p_entity_type text, p_entity_id text, p_details jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.activity_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_details, '{}'::jsonb));
end $$;
revoke all on function public.log_activity(text, text, text, jsonb) from public;

-- ---------------------------------------------------------------------
-- site_content: editable homepage texts (key → JSON)
-- ---------------------------------------------------------------------
create table if not exists public.site_content (
  key         text primary key check (key ~ '^[a-z_]{2,40}$'),
  value       jsonb not null default '{}'::jsonb,
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);
create trigger site_content_touch before update on public.site_content
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Audit triggers
-- ---------------------------------------------------------------------
create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_id text;
  v_details jsonb := '{}'::jsonb;
  v_action text;
begin
  if tg_op = 'DELETE' then
    v_id := coalesce(to_jsonb(old) ->> 'id', to_jsonb(old) ->> 'user_id', to_jsonb(old) ->> 'key');
  else
    v_id := coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'user_id', to_jsonb(new) ->> 'key');
  end if;

  if tg_table_name = 'certificates' then
    if tg_op = 'INSERT' then
      v_action := 'certificate.created';
      v_details := jsonb_build_object('certificate_number', new.certificate_number,
                                      'name', new.first_name || ' ' || new.last_name,
                                      'event', new.event_name);
    elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
      v_action := case when new.status = 'revoked' then 'certificate.revoked' else 'certificate.restored' end;
      v_details := jsonb_build_object('certificate_number', new.certificate_number, 'reason', new.revoke_reason);
    else
      return null; -- ignore technical updates (e.g. pdf_path)
    end if;
  elsif tg_table_name = 'administrators' then
    v_action := 'admin.' || lower(tg_op);
    if tg_op = 'DELETE' then
      v_details := jsonb_build_object('role', old.role);
    else
      v_details := jsonb_build_object('role', new.role, 'is_active', new.is_active);
    end if;
  else
    v_action := tg_table_name || '.' || lower(tg_op);
    if tg_op <> 'DELETE' and tg_table_name = 'events' then
      v_details := jsonb_build_object('title', new.title, 'status', new.status);
    elsif tg_op <> 'DELETE' and tg_table_name = 'certificate_templates' then
      v_details := jsonb_build_object('name', new.name);
    end if;
  end if;

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), v_action, tg_table_name, v_id, v_details);
  return null;
end $$;

create trigger audit_certificates after insert or update on public.certificates
  for each row execute function public.audit_row_change();
create trigger audit_administrators after insert or update or delete on public.administrators
  for each row execute function public.audit_row_change();
create trigger audit_events after insert or update or delete on public.events
  for each row execute function public.audit_row_change();
create trigger audit_templates after insert or update or delete on public.certificate_templates
  for each row execute function public.audit_row_change();
create trigger audit_site_content after insert or update on public.site_content
  for each row execute function public.audit_row_change();

-- ---------------------------------------------------------------------
-- Revoke / restore (role-checked, with reason)
-- ---------------------------------------------------------------------
create or replace function public.set_certificate_status(p_id uuid, p_status public.certificate_status, p_reason text default null)
returns public.certificates
language plpgsql security definer set search_path = public as $$
declare
  v_row public.certificates;
begin
  if not public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if p_status = 'revoked' and coalesce(btrim(p_reason), '') = '' then
    raise exception 'A reason is required to revoke a certificate';
  end if;

  update public.certificates
     set status        = p_status,
         revoked_at    = case when p_status = 'revoked' then now() else null end,
         revoked_by    = case when p_status = 'revoked' then auth.uid() else null end,
         revoke_reason = case when p_status = 'revoked' then left(btrim(p_reason), 500) else null end
   where id = p_id
  returning * into v_row;

  if not found then
    raise exception 'Certificate not found';
  end if;
  return v_row;
end $$;
revoke all on function public.set_certificate_status(uuid, public.certificate_status, text) from public;
grant execute on function public.set_certificate_status(uuid, public.certificate_status, text) to authenticated;

-- ---------------------------------------------------------------------
-- Public verification
-- Returns only the fields needed on the /verify page and logs the lookup.
-- Exact match only (token or certificate number) — no listing, no partial search.
-- ---------------------------------------------------------------------
create or replace function public.verify_certificate(
  p_query text,
  p_method text default 'manual',
  p_ip_hash text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_query text := left(btrim(coalesce(p_query, '')), 128);
  v_cert public.certificates;
  v_tpl public.certificate_templates;
  v_result text;
begin
  if v_query = '' then
    return jsonb_build_object('status', 'not_found');
  end if;

  select * into v_cert from public.certificates
   where verification_token = v_query
      or certificate_number = upper(v_query)
   limit 1;

  if not found then
    v_result := 'not_found';
  elsif v_cert.status = 'revoked' then
    v_result := 'revoked';
  else
    v_result := 'verified';
  end if;

  insert into public.verification_logs (certificate_id, query, method, result, ip_hash, user_agent)
  values (v_cert.id, left(v_query, 128),
          case when p_method = 'qr' then 'qr' else 'manual' end,
          v_result, left(p_ip_hash, 128), left(p_user_agent, 300));

  if v_result = 'not_found' then
    return jsonb_build_object('status', 'not_found');
  end if;

  select * into v_tpl from public.certificate_templates where id = v_cert.template_id;

  return jsonb_build_object(
    'status', v_result,
    'certificate', jsonb_build_object(
      'certificate_number', v_cert.certificate_number,
      'verification_token', v_cert.verification_token,
      'first_name', v_cert.first_name,
      'last_name', v_cert.last_name,
      'event_name', v_cert.event_name,
      'certificate_type', v_cert.certificate_type,
      'issue_date', v_cert.issue_date,
      'organizer', v_cert.organizer,
      'description', v_cert.description,
      'revoked_at', v_cert.revoked_at
    ),
    'template', case when v_tpl.id is null then null else jsonb_build_object(
      'background_path', v_tpl.background_path,
      'background_width', v_tpl.background_width,
      'background_height', v_tpl.background_height,
      'page_size', v_tpl.page_size,
      'background_fit', v_tpl.background_fit,
      'layout', v_tpl.layout
    ) end
  );
end $$;
revoke all on function public.verify_certificate(text, text, text, text) from public;
grant execute on function public.verify_certificate(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles              enable row level security;
alter table public.administrators        enable row level security;
alter table public.events                enable row level security;
alter table public.certificate_templates enable row level security;
alter table public.certificate_batches   enable row level security;
alter table public.certificates          enable row level security;
alter table public.verification_logs     enable row level security;
alter table public.activity_logs         enable row level security;
alter table public.site_content          enable row level security;

-- profiles
create policy profiles_select_self_or_admin on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_super on public.profiles
  for update to authenticated
  using (public.has_admin_role(array['super_admin']::public.admin_role[]))
  with check (public.has_admin_role(array['super_admin']::public.admin_role[]));

-- administrators: every admin can see the team; only super admins change it
create policy administrators_select on public.administrators
  for select to authenticated using (public.is_admin());
create policy administrators_insert_super on public.administrators
  for insert to authenticated
  with check (public.has_admin_role(array['super_admin']::public.admin_role[]));
create policy administrators_update_super on public.administrators
  for update to authenticated
  using (public.has_admin_role(array['super_admin']::public.admin_role[]) and user_id <> auth.uid())
  with check (public.has_admin_role(array['super_admin']::public.admin_role[]) and user_id <> auth.uid());
create policy administrators_delete_super on public.administrators
  for delete to authenticated
  using (public.has_admin_role(array['super_admin']::public.admin_role[]) and user_id <> auth.uid());

-- events: published events are public
create policy events_public_select on public.events
  for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy events_admin_insert on public.events
  for insert to authenticated with check (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));
create policy events_admin_update on public.events
  for update to authenticated
  using (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]))
  with check (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));
create policy events_admin_delete on public.events
  for delete to authenticated using (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));

-- certificate templates
create policy templates_admin_select on public.certificate_templates
  for select to authenticated using (public.is_admin());
create policy templates_admin_insert on public.certificate_templates
  for insert to authenticated with check (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));
create policy templates_admin_update on public.certificate_templates
  for update to authenticated
  using (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]))
  with check (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));
create policy templates_admin_delete on public.certificate_templates
  for delete to authenticated using (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));

-- batches
create policy batches_admin_select on public.certificate_batches
  for select to authenticated using (public.is_admin());
create policy batches_admin_insert on public.certificate_batches
  for insert to authenticated with check (public.is_admin() and created_by = auth.uid());

-- certificates: no public access at all (public uses verify_certificate()).
create policy certificates_admin_select on public.certificates
  for select to authenticated using (public.is_admin());
create policy certificates_admin_insert on public.certificates
  for insert to authenticated
  with check (public.is_admin() and created_by = auth.uid() and status = 'active');
-- Status changes go through set_certificate_status(). Direct updates are
-- limited to super admins / admins (e.g. attaching a regenerated PDF).
create policy certificates_admin_update on public.certificates
  for update to authenticated
  using (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]))
  with check (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));
-- (no delete policy: certificates are revoked, never deleted)

-- logs
create policy verification_logs_admin_select on public.verification_logs
  for select to authenticated using (public.is_admin());
create policy activity_logs_admin_select on public.activity_logs
  for select to authenticated using (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));

-- site content
create policy site_content_public_select on public.site_content
  for select to anon, authenticated using (true);
create policy site_content_admin_insert on public.site_content
  for insert to authenticated with check (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));
create policy site_content_admin_update on public.site_content
  for update to authenticated
  using (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]))
  with check (public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));

-- Table privileges (RLS still applies on top of these)
revoke all on all tables in schema public from anon;
grant select on public.events, public.site_content to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke delete on public.certificates, public.verification_logs, public.activity_logs from authenticated;
revoke insert, update on public.verification_logs, public.activity_logs from authenticated;

-- ---------------------------------------------------------------------
-- Storage
--   media        (public read)  : template backgrounds, event covers, gallery
--   certificates (private)      : generated PDFs
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certificates', 'certificates', false, 20971520, array['application/pdf'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy media_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));
create policy media_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));
create policy media_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));

create policy certificates_files_admin_select on storage.objects
  for select to authenticated
  using (bucket_id = 'certificates' and public.is_admin());
create policy certificates_files_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'certificates' and public.is_admin());
create policy certificates_files_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'certificates' and public.has_admin_role(array['super_admin', 'admin']::public.admin_role[]));
-- Orphan PDFs (upload succeeded, row insert failed) may be removed by admins;
-- a PDF that belongs to an issued certificate can never be deleted.
create policy certificates_files_admin_delete_orphans on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'certificates' and public.is_admin()
    and not exists (select 1 from public.certificates c where c.pdf_path = storage.objects.name)
  );

-- ---------------------------------------------------------------------
-- Real, computed numbers for the homepage (no invented statistics)
-- ---------------------------------------------------------------------
create or replace function public.public_stats()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'events', (select count(*) from public.events where status in ('published', 'archived')),
    'certificates', (select count(*) from public.certificates where status = 'active')
  )
$$;
revoke all on function public.public_stats() from public;
grant execute on function public.public_stats() to anon, authenticated;
