import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { Card, EmptyState } from "@/components/ui/card";
import { CertificateStatusBadge } from "@/components/ui/badge";
import { LinkButton, buttonClass } from "@/components/ui/button";
import { ListFilters } from "@/components/admin/list-filters";
import { Pagination, searchTerms } from "@/components/admin/pagination";
import { StatusToggle } from "@/components/admin/certificate-actions";
import { IPlus } from "@/components/admin/admin-icons";
import { IconDownload } from "@/components/site/icons";
import { can, requireAdminPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { CertificateRow } from "@/lib/types";

export const metadata: Metadata = { title: "Barcha sertifikatlar" };
const PAGE_SIZE = 20;

export default async function CertificatesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await requireAdminPage();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createClient();

  let query = supabase.from("certificates").select("*", { count: "exact" });
  for (const w of searchTerms(sp.q ?? "")) {
    query = query.or(`first_name.ilike.%${w}%,last_name.ilike.%${w}%,certificate_number.ilike.%${w}%,event_name.ilike.%${w}%`);
  }
  if (sp.status === "active" || sp.status === "revoked") query = query.eq("status", sp.status);
  if (sp.event) query = query.eq("event_id", sp.event);
  const { data, count, error } = await query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const { data: events } = await supabase.from("events").select("id, title").order("starts_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as CertificateRow[];
  const canRevoke = can(admin.role, "revokeCertificates");
  const hasFilters = Boolean(sp.q || sp.status || sp.event);

  const makeHref = (p: number) => {
    const u = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    u.set("page", String(p));
    return `/admin/certificates?${u}`;
  };

  return (
    <>
      <PageTitle
        title="Barcha sertifikatlar"
        description="Ism, familiya, raqam yoki tadbir boʻyicha qidiring. Sertifikatni ochish uchun ustiga bosing."
        actions={<LinkButton href="/admin/certificates/new"><IPlus className="size-5" /> Yangi sertifikat</LinkButton>}
      />
      <Card>
        <ListFilters
          placeholder="Ism, familiya yoki ZA-2026-… raqami"
          filters={[
            { name: "status", label: "Holati", options: [{ value: "active", label: "Faol" }, { value: "revoked", label: "Bekor qilingan" }] },
            { name: "event", label: "Tadbir", options: (events ?? []).map((e) => ({ value: e.id, label: e.title })) },
          ]}
        />
        {error ? (
          <p className="p-6 text-sm text-danger-700">Roʻyxatni yuklab boʻlmadi: {error.message}</p>
        ) : rows.length === 0 ? (
          <EmptyState
            title={hasFilters ? "Hech narsa topilmadi" : "Hali sertifikat yoʻq"}
            text={hasFilters ? "Qidiruv soʻzini yoki filtrlarni oʻzgartirib koʻring." : "Birinchi sertifikatni yarating — bu bir daqiqa oladi."}
            action={!hasFilters && <LinkButton href="/admin/certificates/new" size="sm"><IPlus className="size-4" /> Sertifikat yaratish</LinkButton>}
          />
        ) : (
          <>
            {/* Table on desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-cream-50 text-xs font-semibold tracking-wide text-muted uppercase">
                  <tr>
                    <th className="px-6 py-3">Egasi</th>
                    <th className="px-3 py-3">Raqam</th>
                    <th className="px-3 py-3">Tadbir</th>
                    <th className="px-3 py-3">Sana</th>
                    <th className="px-3 py-3">Holati</th>
                    <th className="px-6 py-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((c) => (
                    <tr key={c.id} className="hover:bg-cream-50/70">
                      <td className="px-6 py-3">
                        <Link href={`/admin/certificates/${c.id}`} className="font-semibold text-navy-900 hover:text-gold-700">{c.first_name} {c.last_name}</Link>
                        {c.certificate_type && <p className="text-xs text-muted">{c.certificate_type}</p>}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs whitespace-nowrap">{c.certificate_number}</td>
                      <td className="max-w-56 truncate px-3 py-3 text-muted">{c.event_name}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted">{formatDate(c.issue_date)}</td>
                      <td className="px-3 py-3"><CertificateStatusBadge status={c.status} /></td>
                      <td className="px-6 py-3">
                        <div className="flex justify-end gap-2">
                          <a href={`/api/admin/certificates/${c.id}/pdf`} className={buttonClass("outline", "sm")} title="PDF yuklab olish"><IconDownload className="size-4" /> PDF</a>
                          <StatusToggle id={c.id} status={c.status} number={c.certificate_number} canRevoke={canRevoke} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Cards on phones */}
            <ul className="divide-y divide-line md:hidden">
              {rows.map((c) => (
                <li key={c.id} className="p-4">
                  <Link href={`/admin/certificates/${c.id}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-navy-900">{c.first_name} {c.last_name}</p>
                      <CertificateStatusBadge status={c.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-muted">{c.event_name} · {formatDate(c.issue_date)}</p>
                    <p className="mt-1 font-mono text-xs text-muted">{c.certificate_number}</p>
                  </Link>
                  <div className="mt-3 flex gap-2">
                    <a href={`/api/admin/certificates/${c.id}/pdf`} className={buttonClass("outline", "sm", "flex-1")}><IconDownload className="size-4" /> PDF</a>
                    <StatusToggle id={c.id} status={c.status} number={c.certificate_number} canRevoke={canRevoke} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line"><Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} makeHref={makeHref} /></div>
          </>
        )}
      </Card>
    </>
  );
}
