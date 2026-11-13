import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handle, jsonError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { pdfFileName } from "@/lib/certificates/pdf-file";
import type { CertificateRow } from "@/lib/types";

// List of a batch's PDFs with short-lived signed links. The browser downloads them
// and builds the ZIP itself, so no serverless response-size limit applies.
export const GET = handle(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: batch } = await supabase.from("certificate_batches").select("id, created_at").eq("id", id).maybeSingle();
  if (!batch) return jsonError("Paket topilmadi.", 404);

  const certs: CertificateRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("certificates").select("*").eq("batch_id", id).eq("status", "active").order("created_at").range(from, from + 999);
    if (error) return jsonError(error.message, 500);
    certs.push(...((data ?? []) as CertificateRow[]));
    if (!data || data.length < 1000) break;
  }
  if (certs.length === 0) return jsonError("Bu paketda yuklab olinadigan sertifikat yoʻq.", 404);

  const paths = certs.filter((c) => c.pdf_path).map((c) => c.pdf_path!);
  const signed = new Map<string, string>();
  for (let i = 0; i < paths.length; i += 100) {
    const { data } = await supabase.storage.from("certificates").createSignedUrls(paths.slice(i, i + 100), 900);
    for (const s of data ?? []) if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
  }

  return NextResponse.json({
    created_at: batch.created_at,
    files: certs.map((c) => ({
      name: pdfFileName(c),
      url: (c.pdf_path && signed.get(c.pdf_path)) || `/api/admin/certificates/${c.id}/pdf?inline=1`,
      row: [c.certificate_number, c.first_name, c.last_name, c.event_name, c.issue_date, c.status],
    })),
  });
});
