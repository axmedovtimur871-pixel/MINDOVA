import { getBrowserClient } from "@/lib/supabase/browser";
import { detectImageKind } from "@/lib/image-info";
import { uuid } from "@/lib/uuid";

type Folder = "templates" | "signatures" | "events" | "gallery" | "site";
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Uploads an image straight from the browser to Supabase Storage (RLS: admins only),
 * then asks the server to verify it (real file type, size, dimensions). Files that
 * fail verification are deleted by the server. Large files never pass through a
 * serverless function, so host request-size limits do not apply.
 */
export async function uploadMedia(file: File, folder: Folder) {
  if (file.size > MAX_BYTES) throw new Error("Fayl hajmi 10 MB dan oshmasligi kerak.");
  const head = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const kind = detectImageKind(head);
  if (!kind) throw new Error("Faqat PNG, JPG yoki WEBP rasm yuklash mumkin.");
  if ((folder === "templates" || folder === "signatures") && kind === "webp") {
    throw new Error("Sertifikat uchun faqat PNG yoki JPG rasm yuklang.");
  }
  const ext = kind === "jpeg" ? "jpg" : kind;
  const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${uuid()}.${ext}`;
  const contentType = kind === "jpeg" ? "image/jpeg" : `image/${kind}`;

  const { error } = await getBrowserClient().storage.from("media").upload(path, file, { contentType, upsert: false, cacheControl: "31536000" });
  if (error) {
    throw new Error(/row-level security|unauthorized|403/i.test(error.message) ? "Rasm yuklash uchun ruxsatingiz yoʻq." : "Rasm yuklanmadi: " + error.message);
  }

  const res = await fetch("/api/admin/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, path }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Rasm tekshiruvdan oʻtmadi");
  return json as { path: string; width: number; height: number };
}
