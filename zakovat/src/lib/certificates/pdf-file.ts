import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderCertificatePdf } from "./render-pdf";
import { verifyUrl } from "@/lib/env";
import type { CertificateRow } from "@/lib/types";

/** Stored PDF if present, otherwise re-rendered from the database record. */
export async function getCertificatePdf(supabase: SupabaseClient, cert: CertificateRow): Promise<Uint8Array> {
  if (cert.pdf_path) {
    const { data } = await supabase.storage.from("certificates").download(cert.pdf_path);
    if (data) return new Uint8Array(await data.arrayBuffer());
  }
  const { data: template } = await supabase.from("certificate_templates").select("*").eq("id", cert.template_id).maybeSingle();
  if (!template) throw new Error("Sertifikat shabloni topilmadi.");
  return renderCertificatePdf(template, cert, { verifyUrl: verifyUrl(cert.verification_token) });
}

export function pdfFileName(cert: Pick<CertificateRow, "certificate_number" | "first_name" | "last_name">) {
  const ascii = `${cert.first_name}-${cert.last_name}`
    .normalize("NFKD")
    .replace(/[ʻʼ'`]/g, "")
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${cert.certificate_number}${ascii ? "-" + ascii : ""}.pdf`;
}

export function pdfResponse(bytes: Uint8Array, filename: string, inline = false) {
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * Short-lived signed link to the stored PDF (served by Supabase Storage, so large
 * files never pass through a serverless function). Null when no stored file exists.
 */
export async function signedPdfUrl(
  supabase: SupabaseClient,
  cert: CertificateRow,
  opts: { download?: boolean; expiresIn?: number } = {},
): Promise<string | null> {
  if (!cert.pdf_path) return null;
  const { data, error } = await supabase.storage
    .from("certificates")
    .createSignedUrl(cert.pdf_path, opts.expiresIn ?? 120, opts.download === false ? undefined : { download: pdfFileName(cert) });
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
