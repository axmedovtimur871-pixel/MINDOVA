import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handle, jsonError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  status: z.enum(["active", "revoked"]),
  reason: z.string().max(500).optional(),
});

// Revoke / restore – role is checked here AND inside set_certificate_status() in the database.
export const POST = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(req);
  await requireAdmin("revokeCertificates");
  const { id } = await params;
  const { status, reason } = schema.parse(await req.json());
  if (status === "revoked" && !reason?.trim()) return jsonError("Bekor qilish sababini yozing.", 422);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_certificate_status", { p_id: id, p_status: status, p_reason: reason ?? null });
  if (error) return jsonError(error.code === "42501" ? "Ruxsat yoʻq." : error.message, error.code === "42501" ? 403 : 400);
  revalidatePath("/admin/certificates");
  return NextResponse.json({ certificate: data });
});
