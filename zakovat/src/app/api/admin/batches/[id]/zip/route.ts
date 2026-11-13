import JSZip from "jszip";
import { requireAdmin } from "@/lib/auth";
import { handle, jsonError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { getCertificatePdf, pdfFileName } from "@/lib/certificates/pdf-file";
import type { CertificateRow } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

// ZIP with every PDF of a bulk batch (or the given ids).
export const GET = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: batch } = await supabase.from("certificate_batches").select("id, created_at, source_name").eq("id", id).maybeSingle();
  if (!batch) return jsonError("Paket topilmadi.", 404);

  const certs: CertificateRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("batch_id", id)
      .order("created_at")
      .range(from, from + 999);
    if (error) return jsonError(error.message, 500);
    certs.push(...((data ?? []) as CertificateRow[]));
    if (!data || data.length < 1000) break;
  }
  const onlyActive = new URL(req.url).searchParams.get("active") !== "0";
  const list = onlyActive ? certs.filter((c) => c.status === "active") : certs;
  if (list.length === 0) return jsonError("Bu paketda yuklab olinadigan sertifikat yoʻq.", 404);

  const zip = new JSZip();
  const used = new Set<string>();
  const queue = [...list];
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const cert = queue.shift()!;
      const bytes = await getCertificatePdf(supabase, cert);
      let name = pdfFileName(cert);
      while (used.has(name)) name = name.replace(/\.pdf$/, "-1.pdf");
      used.add(name);
      zip.file(name, bytes, { binary: true });
    }
  });
  await Promise.all(workers);

  const csv = ["Sertifikat raqami;Ism;Familiya;Tadbir;Sana;Holat"]
    .concat(list.map((c) => [c.certificate_number, c.first_name, c.last_name, c.event_name, c.issue_date, c.status].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")))
    .join("\r\n");
  zip.file("royxat.csv", "﻿" + csv);

  // PDFs are already compressed – STORE keeps the ZIP fast to build.
  const content = await zip.generateAsync({ type: "uint8array", compression: "STORE" });
  const date = batch.created_at.slice(0, 10);
  return new Response(Buffer.from(content), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(content.byteLength),
      "Content-Disposition": `attachment; filename="sertifikatlar-${date}-${list.length}ta.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
});
