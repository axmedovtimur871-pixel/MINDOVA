import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handle, jsonError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { FONT_KEYS, TEXT_LAYER_KEYS, normalizeLayout } from "@/lib/certificates/layout";
import { clearMediaCache } from "@/lib/certificates/render-pdf";

const pct = z.number().min(-10).max(110);
const textLayer = z.object({
  enabled: z.boolean(),
  text: z.string().max(300),
  x: pct, y: pct,
  fontSize: z.number().min(4).max(160),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  align: z.enum(["left", "center", "right"]),
  font: z.enum(FONT_KEYS as [string, ...string[]]),
  maxWidth: z.number().min(5).max(100),
  letterSpacing: z.number().min(0).max(20).optional(),
  uppercase: z.boolean().optional(),
});
const layoutSchema = z.object({
  ...Object.fromEntries(TEXT_LAYER_KEYS.map((k) => [k, textLayer])),
  qr: z.object({ enabled: z.boolean(), x: pct, y: pct, size: z.number().min(3).max(40), color: z.string().regex(/^#[0-9a-fA-F]{6}$/), background: z.boolean() }),
  signature: z.object({
    enabled: z.boolean(),
    path: z.string().regex(/^signatures\/[\w\-/]+\.(png|jpg)$/).nullable(),
    x: pct, y: pct, width: z.number().min(2).max(80), aspect: z.number().positive(),
  }),
});

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  page_size: z.enum(["A4_LANDSCAPE", "A4_PORTRAIT"]).optional(),
  background_fit: z.enum(["cover", "contain"]).optional(),
  background_path: z.string().regex(/^templates\/[\w\-/]+\.(png|jpg)$/).optional(),
  background_width: z.number().int().positive().optional(),
  background_height: z.number().int().positive().optional(),
  layout: z.unknown().optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
});

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(req);
  await requireAdmin("manageTemplates");
  const { id } = await params;
  const body = patchSchema.parse(await req.json());
  const update: Record<string, unknown> = { ...body };
  if (body.layout !== undefined) update.layout = layoutSchema.parse(normalizeLayout(body.layout));
  const supabase = await createClient();

  if (body.is_default) {
    await supabase.from("certificate_templates").update({ is_default: false }).eq("is_default", true).neq("id", id);
    update.is_active = true;
  }
  if (body.is_active === false) update.is_default = false;

  const { data, error } = await supabase.from("certificate_templates").update(update).eq("id", id).select("*").single();
  if (error) return jsonError("Saqlab boʻlmadi: " + error.message, 500);
  clearMediaCache();
  return NextResponse.json({ template: data });
});

export const DELETE = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(req);
  await requireAdmin("manageTemplates");
  const { id } = await params;
  const supabase = await createClient();
  const { count } = await supabase.from("certificates").select("id", { count: "exact", head: true }).eq("template_id", id);
  if ((count ?? 0) > 0) {
    return jsonError(`Bu shablon bilan ${count} ta sertifikat berilgan, shuning uchun uni oʻchirib boʻlmaydi. Uning oʻrniga “Faol emas” qiling.`, 409);
  }
  const { error } = await supabase.from("certificate_templates").delete().eq("id", id);
  if (error) return jsonError("Oʻchirib boʻlmadi: " + error.message, 500);
  return NextResponse.json({ ok: true });
});
