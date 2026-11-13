import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULT_CONTENT, mergeContent, type SiteContent } from "@/lib/content";
import type { EventRow } from "@/lib/types";

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  if (!isSupabaseConfigured) return DEFAULT_CONTENT;
  const { data, error } = await createPublicClient().from("site_content").select("key, value");
  if (error) {
    console.error("site_content:", error.message);
    return DEFAULT_CONTENT;
  }
  return mergeContent(data ?? []);
});

export const getPublishedEvents = cache(async (): Promise<EventRow[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await createPublicClient()
    .from("events")
    .select("*")
    .eq("status", "published")
    .order("starts_at", { ascending: true, nullsFirst: false });
  if (error) {
    console.error("events:", error.message);
    return [];
  }
  return (data ?? []) as EventRow[];
});

export const getEventBySlug = cache(async (slug: string): Promise<EventRow | null> => {
  if (!isSupabaseConfigured) return null;
  const { data } = await createPublicClient().from("events").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  return (data as EventRow) ?? null;
});

export const getPublicStats = cache(async (): Promise<{ events: number; certificates: number }> => {
  if (!isSupabaseConfigured) return { events: 0, certificates: 0 };
  const { data } = await createPublicClient().rpc("public_stats");
  return { events: Number(data?.events ?? 0), certificates: Number(data?.certificates ?? 0) };
});

export function splitEvents(events: EventRow[]) {
  const now = Date.now();
  const upcoming = events.filter((e) => !e.starts_at || new Date(e.ends_at ?? e.starts_at).getTime() >= now - 12 * 3600_000);
  const past = events
    .filter((e) => !upcoming.includes(e))
    .sort((a, b) => (b.starts_at ?? "").localeCompare(a.starts_at ?? ""));
  return { upcoming, past };
}
