import { requireAdmin } from "@/lib/auth";
import { handle, jsonError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { getCertificatePdf, pdfFileName, pdfResponse } from "@/lib/certificates/pdf-file";
import type { CertificateRow } from "@/lib/types";

export const runtime = "nodejs";

export const GET = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("certificates").select("*").eq("id", id).maybeSingle();
  if (!data) return jsonError("Sertifikat topilmadi.", 404);
  const cert = data as CertificateRow;
  const bytes = await getCertificatePdf(supabase, cert);
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  return pdfResponse(bytes, pdfFileName(cert), inline);
});
