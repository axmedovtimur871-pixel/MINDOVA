import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin panel", template: "%s · Admin · ZAKOVAT ANDIJON" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return <AdminShell admin={{ fullName: admin.fullName, email: admin.email, role: admin.role }}>{children}</AdminShell>;
}
