import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handle, jsonError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

const schema = z.object({
  role: z.enum(["super_admin", "admin", "certificate_manager"]).optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(10, "Parol kamida 10 belgidan iborat boʻlsin").max(72).optional(),
  full_name: z.string().trim().min(2).max(120).optional(),
});

export const PATCH = handle(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(req);
  const actor = await requireAdmin("manageAdmins");
  const { id } = await params;
  const body = schema.parse(await req.json());
  if (id === actor.id && (body.role || body.is_active === false)) {
    return jsonError("Oʻz rolingizni oʻzgartira yoki oʻzingizni oʻchira olmaysiz.", 400);
  }

  // Role / status: through RLS as the signed-in super admin (audited by trigger).
  if (body.role || body.is_active !== undefined) {
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (body.role) patch.role = body.role;
    if (body.is_active !== undefined) patch.is_active = body.is_active;
    const { error } = await supabase.from("administrators").update(patch).eq("user_id", id);
    if (error) return jsonError(error.message, 400);
  }

  if (body.password || body.full_name || body.is_active !== undefined) {
    const svc = createServiceClient();
    if (body.password) {
      const { error } = await svc.auth.admin.updateUserById(id, { password: body.password });
      if (error) return jsonError(error.message, 400);
      await svc.from("activity_logs").insert({ actor_id: actor.id, action: "admin.password_reset", entity_type: "administrators", entity_id: id });
    }
    if (body.full_name) await svc.from("profiles").update({ full_name: body.full_name }).eq("id", id);
    // A deactivated admin is also signed out everywhere.
    if (body.is_active === false) await svc.auth.admin.updateUserById(id, { ban_duration: "876000h" });
    if (body.is_active === true) await svc.auth.admin.updateUserById(id, { ban_duration: "none" });
  }
  return NextResponse.json({ ok: true });
});
