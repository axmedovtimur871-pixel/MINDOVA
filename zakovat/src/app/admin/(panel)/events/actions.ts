"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, HttpError } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstZodError, normalizeUzbekApostrophes } from "@/lib/validation";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const text = (max: number) => z.string().max(max).transform((s) => normalizeUzbekApostrophes(s.trim()));

const eventSchema = z.object({
  id: z.string().uuid().optional(),
  title: text(200).pipe(z.string().min(2, "Tadbir nomini kiriting")),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Havola faqat lotin harflari, raqamlar va “-” dan iborat boʻlsin").max(80),
  summary: text(400),
  description: text(8000),
  location: text(200),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  registration_url: z.string().trim().max(500).refine((v) => !v || /^https?:\/\//i.test(v), "Havola http:// yoki https:// bilan boshlansin").transform((v) => v || null),
  cover_image_path: z.string().regex(/^events\/[\w\-/]+\.(png|jpg|webp)$/).nullable(),
  status: z.enum(["draft", "published", "archived"]),
});

function revalidatePublic() {
  revalidatePath("/", "layout");
}

export async function saveEvent(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin("manageEvents");
    const parsed = eventSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };
    const { id, ...data } = parsed.data;
    if (data.starts_at && data.ends_at && new Date(data.ends_at) < new Date(data.starts_at)) {
      return { ok: false, error: "Tugash vaqti boshlanish vaqtidan oldin boʻlishi mumkin emas." };
    }
    const supabase = await createClient();
    const q = id
      ? supabase.from("events").update(data).eq("id", id).select("id").single()
      : supabase.from("events").insert(data).select("id").single();
    const { data: row, error } = await q;
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Bunday havola (slug) bilan tadbir allaqachon bor. Boshqasini yozing." };
      return { ok: false, error: error.message };
    }
    revalidatePublic();
    revalidatePath("/admin/events");
    return { ok: true, id: row.id };
  } catch (e) {
    return { ok: false, error: e instanceof HttpError ? e.message : "Saqlab boʻlmadi" };
  }
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  try {
    await requireAdmin("manageEvents");
    const supabase = await createClient();
    const { count } = await supabase.from("certificates").select("id", { count: "exact", head: true }).eq("event_id", id);
    if ((count ?? 0) > 0) return { ok: false, error: `Bu tadbir boʻyicha ${count} ta sertifikat berilgan. Uni oʻchirib boʻlmaydi — “Arxiv” holatiga oʻtkazing.` };
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePublic();
    revalidatePath("/admin/events");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof HttpError ? e.message : "Oʻchirib boʻlmadi" };
  }
}
