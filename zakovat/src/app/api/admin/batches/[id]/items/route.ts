import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handle, jsonError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { IssueError, issueCertificate, loadTemplate } from "@/lib/certificates/issue";
import { bulkItemsSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 120;

// Generates a small chunk of certificates of one batch. The browser sends
// chunks one after another so it can show progress; every row carries its own
// idempotency key, so a retried chunk never creates duplicates.
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(req);
  await requireAdmin("issueCertificates");
  const { id: batchId } = await params;
  const body = bulkItemsSchema.parse(await req.json());
  const supabase = await createClient();

  const { data: batch } = await supabase.from("certificate_batches").select("id, template_id").eq("id", batchId).maybeSingle();
  if (!batch) return jsonError("Paket topilmadi.", 404);
  const template = await loadTemplate(supabase, body.template_id);

  const results: { key: string; ok: boolean; id?: string; certificate_number?: string; reused?: boolean; error?: string }[] = [];
  for (const row of body.rows) {
    try {
      const { certificate, reused } = await issueCertificate(
        supabase,
        {
          first_name: row.first_name,
          last_name: row.last_name,
          event_id: body.event_id ?? null,
          event_name: body.event_name,
          certificate_type: body.certificate_type,
          issue_date: body.issue_date,
          organizer: body.organizer,
          description: body.description,
          template_id: body.template_id,
          batch_id: batchId,
          idempotency_key: row.key,
        },
        template,
      );
      results.push({ key: row.key, ok: true, id: certificate.id, certificate_number: certificate.certificate_number, reused });
    } catch (e) {
      results.push({ key: row.key, ok: false, error: e instanceof IssueError ? e.message : "Kutilmagan xatolik" });
      if (e instanceof IssueError && e.status === 403) break;
    }
  }
  return NextResponse.json({ results });
});
