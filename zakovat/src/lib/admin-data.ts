import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { EventRow, TemplateRow } from "@/lib/types";

/** Active templates + events for the certificate forms. */
export async function loadIssuingData() {
  const supabase = await createClient();
  const [{ data: templates }, { data: events }] = await Promise.all([
    supabase.from("certificate_templates").select("*").eq("is_active", true).order("is_default", { ascending: false }).order("created_at"),
    supabase.from("events").select("id, title, starts_at, status").neq("status", "archived").order("starts_at", { ascending: false, nullsFirst: true }).limit(200),
  ]);
  return {
    templates: (templates ?? []) as TemplateRow[],
    events: (events ?? []).map((e) => ({ id: e.id, title: e.title })) as Pick<EventRow, "id" | "title">[],
  };
}
