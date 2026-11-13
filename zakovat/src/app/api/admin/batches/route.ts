import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handle, jsonError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  event_id: z.string().uuid().nullable().optional(),
  template_id: z.string().uuid(),
  source_name: z.string().max(255).default(""),
  total_rows: z.number().int().min(1).max(5000),
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const admin = await requireAdmin("issueCertificates");
  const body = schema.parse(await req.json());
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificate_batches")
    .insert({ ...body, event_id: body.event_id ?? null, created_by: admin.id })
    .select("id")
    .single();
  if (error) return jsonError("Paketni yaratib boʻlmadi: " + error.message, 500);
  return NextResponse.json({ batch_id: data.id }, { status: 201 });
});
