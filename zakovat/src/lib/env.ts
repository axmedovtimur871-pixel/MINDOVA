// Public (browser-safe) configuration. Server-only secrets live in src/lib/supabase/admin.ts.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function publicMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("builtin/")) return `/${path}`;
  return `${SUPABASE_URL}/storage/v1/object/public/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function verifyUrl(token: string): string {
  return `${SITE_URL}/verify/${encodeURIComponent(token)}`;
}
