import { parseHttpUrl } from "./url";

// Public (browser-safe) configuration. Server-only secrets live in src/lib/supabase/admin.ts.
export const SUPABASE_URL = parseHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)?.href.replace(/\/+$/, "") ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
// Metadata is evaluated during page-data collection, including /_not-found.
// Keep it usable when the optional custom public address is missing or malformed.
export const SITE_URL = (
  parseHttpUrl(process.env.NEXT_PUBLIC_SITE_URL)?.href ?? "https://zakovat-andijon.netlify.app"
).replace(/\/+$/, "");

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function requireSupabaseConfig() {
  if (!isSupabaseConfigured) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL with a valid HTTP(S) URL and set NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

export function publicMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (path.startsWith("builtin/")) return `/${path}`;
  return `${SUPABASE_URL}/storage/v1/object/public/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function verifyUrl(token: string): string {
  return `${SITE_URL}/verify/${encodeURIComponent(token)}`;
}
