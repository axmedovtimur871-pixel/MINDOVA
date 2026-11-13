import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/types";

export interface CurrentAdmin {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Bosh administrator",
  admin: "Administrator",
  certificate_manager: "Sertifikat menejeri",
};

/** What each role may do. Mirrors the RLS policies in the database. */
export const PERMISSIONS = {
  issueCertificates: ["super_admin", "admin", "certificate_manager"],
  revokeCertificates: ["super_admin", "admin"],
  manageTemplates: ["super_admin", "admin"],
  manageEvents: ["super_admin", "admin"],
  manageContent: ["super_admin", "admin"],
  viewActivity: ["super_admin", "admin"],
  manageAdmins: ["super_admin"],
} satisfies Record<string, AdminRole[]>;
export type Permission = keyof typeof PERMISSIONS;

export function can(role: AdminRole | null | undefined, permission: Permission): boolean {
  return !!role && (PERMISSIONS[permission] as AdminRole[]).includes(role);
}

/** Returns the signed-in, active administrator or null. */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("administrators")
    .select("role, is_active, profiles!administrators_user_id_fkey(full_name)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data || !data.is_active) return null;
  const profile = data.profiles as unknown as { full_name: string } | null;
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name || user.email || "",
    role: data.role as AdminRole,
  };
}

/** For admin pages: redirect away when not allowed. */
export async function requireAdminPage(permission?: Permission): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login?error=no-access");
  if (permission && !can(admin.role, permission)) redirect("/admin?error=forbidden");
  return admin;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** For API routes / server actions: throw a 401/403 when not allowed. */
export async function requireAdmin(permission?: Permission): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new HttpError(401, "Tizimga kiring.");
  if (permission && !can(admin.role, permission)) throw new HttpError(403, "Bu amal uchun ruxsatingiz yoʻq.");
  return admin;
}
