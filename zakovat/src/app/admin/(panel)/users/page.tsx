import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { AdminUsers, type AdminListItem } from "@/components/admin/admin-users";
import { Pagination } from "@/components/admin/pagination";
import { can, requireAdminPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Foydalanuvchilar va adminlar" };
const PAGE_SIZE = 25;

const ACTIONS: Record<string, string> = {
  "certificate.created": "Sertifikat yaratdi",
  "certificate.revoked": "Sertifikatni bekor qildi",
  "certificate.restored": "Sertifikatni qayta tikladi",
  "admin.insert": "Administrator qoʻshildi",
  "admin.update": "Administrator oʻzgartirildi",
  "admin.delete": "Administrator oʻchirildi",
  "admin.invited": "Administrator hisobini yaratdi",
  "admin.password_reset": "Parolni almashtirdi",
  "events.insert": "Tadbir qoʻshdi",
  "events.update": "Tadbirni tahrirladi",
  "events.delete": "Tadbirni oʻchirdi",
  "certificate_templates.insert": "Shablon qoʻshdi",
  "certificate_templates.update": "Shablonni oʻzgartirdi",
  "certificate_templates.delete": "Shablonni oʻchirdi",
  "site_content.insert": "Sayt matnini saqladi",
  "site_content.update": "Sayt matnini oʻzgartirdi",
};

function describe(details: Record<string, unknown>) {
  const parts = [details.name, details.certificate_number, details.title, details.email, details.reason ? `sabab: ${details.reason}` : null, details.role]
    .filter(Boolean)
    .map(String);
  return parts.join(" · ");
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const admin = await requireAdminPage("viewActivity");
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const supabase = await createClient();
  const [{ data: admins }, { data: logs, count }] = await Promise.all([
    supabase.from("administrators").select("user_id, role, is_active, created_at, profiles!administrators_user_id_fkey(full_name, email)").order("created_at"),
    supabase.from("activity_logs").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
  ]);
  const list: AdminListItem[] = (admins ?? []).map((a) => {
    const p = a.profiles as unknown as { full_name: string; email: string } | null;
    return { user_id: a.user_id, role: a.role, is_active: a.is_active, created_at: a.created_at, full_name: p?.full_name ?? "", email: p?.email ?? "" };
  });
  const names = new Map(list.map((a) => [a.user_id, a.full_name || a.email]));

  return (
    <>
      <PageTitle title="Foydalanuvchilar va adminlar" description="Kim admin panelga kira oladi va kim nima qilgani (audit tarixi)." />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader title="Administratorlar" description={can(admin.role, "manageAdmins") ? "Rollar: Bosh administrator, Administrator, Sertifikat menejeri." : "Administratorlarni faqat Bosh administrator boshqaradi."} />
          <AdminUsers admins={list} currentId={admin.id} canManage={can(admin.role, "manageAdmins")} />
        </Card>
        <Card>
          <CardHeader title="Faoliyat tarixi" description="Muhim amallar avtomatik yoziladi va oʻchirilmaydi." />
          {!logs || logs.length === 0 ? (
            <EmptyState title="Hali yozuv yoʻq" />
          ) : (
            <>
              <ul className="divide-y divide-line">
                {logs.map((l) => (
                  <li key={l.id} className="px-5 py-3 sm:px-6">
                    <p className="text-sm text-navy-900"><b>{l.actor_id ? names.get(l.actor_id) ?? "Administrator" : "Tizim"}</b> — {ACTIONS[l.action] ?? l.action}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatDateTime(l.created_at)}{describe(l.details ?? {}) && ` · ${describe(l.details ?? {})}`}</p>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line"><Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} makeHref={(p) => `/admin/users?page=${p}`} /></div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
