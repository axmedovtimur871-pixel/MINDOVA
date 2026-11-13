import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handle, jsonError } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/admin";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email notoʻgʻri"),
  full_name: z.string().trim().min(2, "Ism-familiyani kiriting").max(120),
  password: z.string().min(10, "Parol kamida 10 belgidan iborat boʻlsin").max(72),
  role: z.enum(["super_admin", "admin", "certificate_manager"]),
});

// Only a super admin can create administrator accounts. The service-role key is
// used here (server only) because creating auth users is outside RLS.
export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  const actor = await requireAdmin("manageAdmins");
  const body = schema.parse(await req.json());
  const svc = createServiceClient();

  let userId: string | null = null;
  const created = await svc.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: body.full_name },
  });
  if (created.error) {
    if (!/already|exists|registered/i.test(created.error.message)) return jsonError(created.error.message, 400);
    const { data: profile } = await svc.from("profiles").select("id").eq("email", body.email).maybeSingle();
    if (!profile) return jsonError("Bu email bilan foydalanuvchi mavjud, lekin profil topilmadi.", 409);
    userId = profile.id;
    await svc.auth.admin.updateUserById(userId!, { password: body.password, ban_duration: "none" });
  } else {
    userId = created.data.user.id;
  }

  await svc.from("profiles").upsert({ id: userId, email: body.email, full_name: body.full_name });
  const { error } = await svc
    .from("administrators")
    .upsert({ user_id: userId, role: body.role, is_active: true, created_by: actor.id });
  if (error) return jsonError("Administratorni saqlab boʻlmadi: " + error.message, 500);
  await svc.from("activity_logs").insert({
    actor_id: actor.id, action: "admin.invited", entity_type: "administrators", entity_id: userId,
    details: { email: body.email, role: body.role },
  });
  return NextResponse.json({ id: userId }, { status: 201 });
});
