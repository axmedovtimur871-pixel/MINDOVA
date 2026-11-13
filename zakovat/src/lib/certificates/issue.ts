import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateCertificateNumber, generateVerificationToken } from "./ids";
import { renderCertificatePdf } from "./render-pdf";
import { verifyUrl } from "@/lib/env";
import { duplicateKey } from "@/lib/validation";
import type { CertificateRow, TemplateRow } from "@/lib/types";

export interface IssueInput {
  first_name: string;
  last_name: string;
  event_id: string | null;
  event_name: string;
  certificate_type: string;
  issue_date: string;
  organizer: string;
  description: string;
  template_id: string;
  batch_id?: string | null;
  idempotency_key?: string | null;
}

export class IssueError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function loadTemplate(supabase: SupabaseClient, id: string): Promise<TemplateRow> {
  const { data, error } = await supabase.from("certificate_templates").select("*").eq("id", id).maybeSingle();
  if (error) throw new IssueError("Shablonni oʻqib boʻlmadi: " + error.message, 500);
  if (!data) throw new IssueError("Shablon topilmadi.", 404);
  if (!data.is_active) throw new IssueError("Bu shablon oʻchirilgan (faol emas).");
  return data as TemplateRow;
}

/** Existing active certificates with the same name for the same event. */
export async function findDuplicates(
  supabase: SupabaseClient,
  eventName: string,
  names: { first_name: string; last_name: string }[],
): Promise<Map<string, Pick<CertificateRow, "id" | "certificate_number" | "created_at">>> {
  const result = new Map<string, Pick<CertificateRow, "id" | "certificate_number" | "created_at">>();
  if (names.length === 0) return result;
  const wanted = new Set(names.map((n) => duplicateKey(n.first_name, n.last_name, eventName)));
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("certificates")
      .select("id, certificate_number, created_at, first_name, last_name, event_name")
      .ilike("event_name", eventName.replace(/[%_\\]/g, "\\$&"))
      .eq("status", "active")
      .range(from, from + pageSize - 1);
    if (error) throw new IssueError("Takrorlanishni tekshirib boʻlmadi: " + error.message, 500);
    for (const row of data ?? []) {
      const key = duplicateKey(row.first_name, row.last_name, row.event_name);
      if (wanted.has(key) && !result.has(key)) result.set(key, row);
    }
    if (!data || data.length < pageSize) break;
  }
  return result;
}

/**
 * Issues one certificate as the signed-in admin:
 * unique ID + token → PDF with QR → private storage → database row.
 * Safe to retry with the same idempotency_key (returns the existing certificate).
 */
export async function issueCertificate(
  supabase: SupabaseClient,
  input: IssueInput,
  template: TemplateRow,
): Promise<{ certificate: CertificateRow; reused: boolean }> {
  if (input.idempotency_key) {
    const { data: existing } = await supabase
      .from("certificates")
      .select("*")
      .eq("idempotency_key", input.idempotency_key)
      .maybeSingle();
    if (existing) return { certificate: existing as CertificateRow, reused: true };
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    const certificate_number = generateCertificateNumber(input.issue_date);
    const verification_token = generateVerificationToken();

    const pdf = await renderCertificatePdf(
      template,
      { ...input, certificate_number },
      { verifyUrl: verifyUrl(verification_token) },
    );

    const pdf_path = `${input.issue_date.slice(0, 4)}/${certificate_number}.pdf`;
    const upload = await supabase.storage
      .from("certificates")
      .upload(pdf_path, pdf, { contentType: "application/pdf", upsert: false });
    if (upload.error) {
      if (/exists|duplicate/i.test(upload.error.message)) continue; // number collision – try another
      throw new IssueError("PDF faylni saqlab boʻlmadi: " + upload.error.message, 500);
    }

    const { data, error } = await supabase
      .from("certificates")
      .insert({
        certificate_number,
        verification_token,
        first_name: input.first_name,
        last_name: input.last_name,
        event_id: input.event_id,
        event_name: input.event_name,
        certificate_type: input.certificate_type,
        template_id: input.template_id,
        issue_date: input.issue_date,
        organizer: input.organizer,
        description: input.description,
        pdf_path,
        batch_id: input.batch_id ?? null,
        idempotency_key: input.idempotency_key ?? null,
      })
      .select("*")
      .single();

    if (!error && data) return { certificate: data as CertificateRow, reused: false };

    // Roll back the uploaded file so storage never holds orphan PDFs.
    // (Only admins with storage delete rights can remove it; otherwise it stays private.)
    await supabase.storage.from("certificates").remove([pdf_path]);

    if (error?.code === "23505") {
      if (error.message.includes("idempotency_key") && input.idempotency_key) {
        const { data: existing } = await supabase
          .from("certificates")
          .select("*")
          .eq("idempotency_key", input.idempotency_key)
          .single();
        if (existing) return { certificate: existing as CertificateRow, reused: true };
      }
      continue; // number/token collision – extremely unlikely, retry
    }
    if (error?.code === "42501") throw new IssueError("Sertifikat yaratish uchun ruxsatingiz yoʻq.", 403);
    throw new IssueError("Sertifikatni saqlab boʻlmadi: " + (error?.message ?? "nomaʼlum xato"), 500);
  }
  throw new IssueError("Noyob raqam yaratib boʻlmadi, qayta urinib koʻring.", 500);
}

export function duplicateKeyFor(input: { first_name: string; last_name: string; event_name: string }) {
  return duplicateKey(input.first_name, input.last_name, input.event_name);
}
