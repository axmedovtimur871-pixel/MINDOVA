import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handle, jsonError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { MIME, detectImageKind, imageDimensions } from "@/lib/image-info";

export const runtime = "nodejs";

const FOLDERS = {
  templates: { pdfSafe: true, perm: "manageTemplates" },
  signatures: { pdfSafe: true, perm: "manageTemplates" },
  events: { pdfSafe: false, perm: "manageEvents" },
  gallery: { pdfSafe: false, perm: "manageContent" },
  site: { pdfSafe: false, perm: "manageContent" },
} as const;
const MAX_BYTES = 10 * 1024 * 1024;

// Validated image upload into the public "media" bucket.
export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const form = await req.formData();
  const folder = String(form.get("folder") ?? "") as keyof typeof FOLDERS;
  const cfg = FOLDERS[folder];
  if (!cfg) return jsonError("Notoʻgʻri papka.", 400);
  await requireAdmin(cfg.perm);

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError("Fayl tanlanmagan.", 400);
  if (file.size > MAX_BYTES) return jsonError("Fayl hajmi 10 MB dan oshmasligi kerak.", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectImageKind(bytes);
  if (!kind) return jsonError("Faqat PNG, JPG yoki WEBP rasm yuklash mumkin.", 415);
  if (cfg.pdfSafe && kind === "webp") return jsonError("Sertifikat uchun faqat PNG yoki JPG rasm yuklang.", 415);
  const dims = imageDimensions(bytes);
  if (!dims || dims.width < 50 || dims.height < 50) return jsonError("Rasm oʻlchamini aniqlab boʻlmadi yoki u juda kichik.", 415);
  if (folder === "templates" && Math.max(dims.width, dims.height) < 1200) {
    return jsonError(`Shablon rasmi juda kichik (${dims.width}×${dims.height}). Sifatli chop etish uchun kamida 2000 piksel kenglikdagi rasm yuklang.`, 422);
  }

  const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${kind === "jpeg" ? "jpg" : kind}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from("media").upload(path, bytes, { contentType: MIME[kind], upsert: false, cacheControl: "31536000" });
  if (error) return jsonError("Rasmni saqlab boʻlmadi: " + error.message, 500);
  return NextResponse.json({ path, width: dims.width, height: dims.height }, { status: 201 });
});
