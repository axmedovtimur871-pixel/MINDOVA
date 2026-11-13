import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handle, jsonError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { detectImageKind, imageDimensions } from "@/lib/image-info";
import { publicMediaUrl } from "@/lib/env";

export const runtime = "nodejs";

const FOLDERS = {
  templates: { pdfSafe: true, perm: "manageTemplates" },
  signatures: { pdfSafe: true, perm: "manageTemplates" },
  events: { pdfSafe: false, perm: "manageEvents" },
  gallery: { pdfSafe: false, perm: "manageContent" },
  site: { pdfSafe: false, perm: "manageContent" },
} as const;
const MAX_BYTES = 10 * 1024 * 1024;

const schema = z.object({
  folder: z.enum(["templates", "signatures", "events", "gallery", "site"]),
  path: z.string().regex(/^(templates|signatures|events|gallery|site)\/\d{4}-\d{2}\/[0-9a-f-]{36}\.(png|jpg|webp)$/),
});

// Verifies an image the browser just uploaded to the public "media" bucket:
// real file type (magic bytes), size and dimensions. Anything invalid is deleted.
export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const { folder, path } = schema.parse(await req.json());
  if (!path.startsWith(`${folder}/`)) return jsonError("Notoʻgʻri papka.", 400);
  const cfg = FOLDERS[folder];
  await requireAdmin(cfg.perm);
  const supabase = await createClient();
  const reject = async (message: string, status = 415) => {
    await supabase.storage.from("media").remove([path]);
    return jsonError(message, status);
  };

  const res = await fetch(publicMediaUrl(path)!, { cache: "no-store" });
  if (!res.ok) return jsonError("Yuklangan rasm topilmadi.", 404);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) return reject("Fayl hajmi 10 MB dan oshmasligi kerak.", 413);

  const kind = detectImageKind(bytes);
  if (!kind) return reject("Faqat PNG, JPG yoki WEBP rasm yuklash mumkin.");
  if (cfg.pdfSafe && kind === "webp") return reject("Sertifikat uchun faqat PNG yoki JPG rasm yuklang.");
  const ext = path.split(".").pop();
  if ((kind === "jpeg" ? "jpg" : kind) !== ext) return reject("Fayl turi kengaytmaga mos emas.");
  const dims = imageDimensions(bytes);
  if (!dims || dims.width < 50 || dims.height < 50) return reject("Rasm oʻlchamini aniqlab boʻlmadi yoki u juda kichik.");
  if (folder === "templates" && Math.max(dims.width, dims.height) < 1200) {
    return reject(`Shablon rasmi juda kichik (${dims.width}×${dims.height}). Sifatli chop etish uchun kamida 2000 piksel kenglikdagi rasm yuklang.`, 422);
  }
  return NextResponse.json({ path, width: dims.width, height: dims.height }, { status: 201 });
});
