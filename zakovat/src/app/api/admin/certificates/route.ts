import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handle, jsonError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { findDuplicates, issueCertificate, loadTemplate } from "@/lib/certificates/issue";
import { singleCertificateSchema, duplicateKey } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

// Create ONE certificate: validate → duplicate check → PDF + QR → storage → database.
export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await requireAdmin("issueCertificates");
  const input = singleCertificateSchema.parse(await req.json());
  const supabase = await createClient();
  const template = await loadTemplate(supabase, input.template_id);

  if (!input.allow_duplicate) {
    const dupes = await findDuplicates(supabase, input.event_name, [input]);
    const existing = dupes.get(duplicateKey(input.first_name, input.last_name, input.event_name));
    if (existing) {
      return jsonError("Bu ishtirokchiga shu tadbir uchun sertifikat allaqachon berilgan.", 409, { duplicate: existing });
    }
  }

  const { certificate, reused } = await issueCertificate(supabase, input, template);
  return NextResponse.json({ certificate, reused }, { status: reused ? 200 : 201 });
});
