"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { HttpError, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstZodError } from "@/lib/validation";
import type { ContentKey } from "@/lib/content";

const s = (max: number) => z.string().max(max).transform((v) => v.trim());
const url = z.string().trim().max(500).refine((v) => !v || /^https?:\/\//i.test(v), "Havola http:// yoki https:// bilan boshlansin");
const img = z.string().regex(/^(site|gallery)\/[\w\-/]+\.(png|jpg|webp)$/).nullable();

const schemas: Record<ContentKey, z.ZodType> = {
  general: z.object({ site_name: s(80).pipe(z.string().min(2)), tagline: s(200), footer_note: s(200) }),
  hero: z.object({ eyebrow: s(80), title: s(80).pipe(z.string().min(2)), slogan: s(200), intro: s(600), image_path: img }),
  about: z.object({ title: s(120), lead: s(400), body: s(6000), values: z.array(z.object({ title: s(60), text: s(300) })).max(6) }),
  activities: z.object({ title: s(120), intro: s(400), items: z.array(z.object({ title: s(80), text: s(400) })).max(12) }),
  stats: z.object({ title: s(80), show_computed: z.boolean(), items: z.array(z.object({ value: s(20), label: s(80) })).max(8) }),
  gallery: z.object({ title: s(120), intro: s(400), items: z.array(z.object({ path: z.string().regex(/^gallery\/[\w\-/]+\.(png|jpg|webp)$/), caption: s(160) })).max(40) }),
  contact: z.object({ title: s(120), intro: s(400), address: s(300), phone: s(40), email: z.string().trim().max(120).refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Email notoʻgʻri"), working_hours: s(120), map_url: url }),
  social: z.object({ telegram: url, instagram: url, youtube: url, facebook: url }),
};

export async function saveContent(key: ContentKey, value: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin("manageContent");
    const schema = schemas[key];
    if (!schema) return { ok: false, error: "Notoʻgʻri boʻlim" };
    const parsed = schema.safeParse(value);
    if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
    const supabase = await createClient();
    const { error } = await supabase.from("site_content").upsert({ key, value: parsed.data, updated_by: admin.id });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof HttpError ? e.message : "Saqlab boʻlmadi" };
  }
}

export async function changeOwnPassword(current: string, next: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin();
    if (next.length < 10) return { ok: false, error: "Yangi parol kamida 10 belgidan iborat boʻlsin." };
    const supabase = await createClient();
    const check = await supabase.auth.signInWithPassword({ email: admin.email, password: current });
    if (check.error) return { ok: false, error: "Joriy parol notoʻgʻri." };
    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof HttpError ? e.message : "Parolni oʻzgartirib boʻlmadi" };
  }
}
