import { createServiceClient } from "@/lib/supabase/admin";
import { getCertificatePdf, pdfFileName, pdfResponse } from "@/lib/certificates/pdf-file";
import { clientFingerprint } from "@/lib/verify";
import { rateLimit } from "@/lib/rate-limit";
import type { CertificateRow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public download: only for an exact, unguessable token of an ACTIVE certificate.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{24,128}$/.test(token)) return new Response("Topilmadi", { status: 404 });
  const fp = await clientFingerprint();
  if (!rateLimit(`pdf:${fp.ipHash}`, 30, 60_000)) return new Response("Juda koʻp soʻrov", { status: 429 });

  const supabase = createServiceClient();
  const { data } = await supabase.from("certificates").select("*").eq("verification_token", token).maybeSingle();
  const cert = data as CertificateRow | null;
  if (!cert) return new Response("Sertifikat topilmadi", { status: 404 });
  if (cert.status !== "active") return new Response("Bu sertifikat bekor qilingan", { status: 410 });

  try {
    const bytes = await getCertificatePdf(supabase, cert);
    return pdfResponse(bytes, pdfFileName(cert));
  } catch (e) {
    console.error("public pdf:", e);
    return new Response("PDF tayyorlab boʻlmadi", { status: 500 });
  }
}
