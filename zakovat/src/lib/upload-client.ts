/** Upload an image to /api/admin/media; returns storage path + dimensions. */
export async function uploadMedia(file: File, folder: "templates" | "signatures" | "events" | "gallery" | "site") {
  const fd = new FormData();
  fd.append("folder", folder);
  fd.append("file", file);
  const res = await fetch("/api/admin/media", { method: "POST", body: fd });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Rasm yuklanmadi");
  return json as { path: string; width: number; height: number };
}
