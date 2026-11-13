import Link from "next/link";
import { PageTitle } from "@/components/admin/admin-shell";
import { Card, CardHeader, EmptyState } from "@/components/ui/card";
import { CertificateStatusBadge, ResultBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { IPlus, IStack } from "@/components/admin/admin-icons";
import { requireAdminPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatNumber, relativeTime } from "@/lib/format";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const admin = await requireAdminPage();
  const sp = await searchParams;
  const supabase = await createClient();
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

  const [total, active, revoked, events, recent, logs] = await Promise.all([
    count(supabase.from("certificates").select("id", { count: "exact", head: true })),
    count(supabase.from("certificates").select("id", { count: "exact", head: true }).eq("status", "active")),
    count(supabase.from("certificates").select("id", { count: "exact", head: true }).eq("status", "revoked")),
    count(supabase.from("events").select("id", { count: "exact", head: true })),
    supabase.from("certificates").select("id, certificate_number, first_name, last_name, event_name, issue_date, status").order("created_at", { ascending: false }).limit(6),
    supabase.from("verification_logs").select("id, query, method, result, created_at, certificates(certificate_number, first_name, last_name)").order("created_at", { ascending: false }).limit(8),
  ]);

  const stats = [
    { label: "Jami sertifikatlar", value: total, tone: "text-navy-900" },
    { label: "Faol", value: active, tone: "text-success-700" },
    { label: "Bekor qilingan", value: revoked, tone: "text-danger-700" },
    { label: "Tadbirlar", value: events, tone: "text-gold-700" },
  ];

  return (
    <>
      <PageTitle
        title={`Xush kelibsiz, ${admin.fullName.split(" ")[0] || "admin"}!`}
        description="Bugun nima qilamiz? Eng koʻp ishlatiladigan amallar quyida."
        actions={
          <>
            <LinkButton href="/admin/certificates/bulk" variant="outline"><IStack className="size-5" /> Ommaviy yaratish</LinkButton>
            <LinkButton href="/admin/certificates/new"><IPlus className="size-5" /> Sertifikat yaratish</LinkButton>
          </>
        }
      />
      {sp.error === "forbidden" && <Alert tone="warning" className="mb-6">Bu boʻlimga kirish uchun ruxsatingiz yoʻq.</Alert>}

      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <dt className="text-sm font-medium text-muted">{s.label}</dt>
            <dd className={`mt-2 font-display text-4xl font-semibold ${s.tone}`}>{formatNumber(s.value)}</dd>
          </Card>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Soʻnggi sertifikatlar" action={<Link href="/admin/certificates" className="text-sm font-semibold text-navy-700 hover:text-gold-600">Barchasi →</Link>} />
          {recent.data && recent.data.length > 0 ? (
            <ul className="divide-y divide-line">
              {recent.data.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/certificates/${c.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-cream-50 sm:px-6">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy-900">{c.first_name} {c.last_name}</p>
                      <p className="truncate text-sm text-muted">{c.event_name} · {formatDate(c.issue_date)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <CertificateStatusBadge status={c.status} />
                      <span className="font-mono text-xs text-muted">{c.certificate_number}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Hali sertifikat yaratilmagan" text="Birinchi sertifikatni yaratish uchun quyidagi tugmani bosing." action={<LinkButton href="/admin/certificates/new" size="sm"><IPlus className="size-4" /> Sertifikat yaratish</LinkButton>} />
          )}
        </Card>

        <Card>
          <CardHeader title="Soʻnggi tekshiruvlar" description="Sertifikatlarni kim, qachon tekshirgani" action={<Link href="/admin/logs" className="text-sm font-semibold text-navy-700 hover:text-gold-600">Barchasi →</Link>} />
          {logs.data && logs.data.length > 0 ? (
            <ul className="divide-y divide-line">
              {logs.data.map((l) => {
                const cert = l.certificates as unknown as { certificate_number: string; first_name: string; last_name: string } | null;
                return (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy-900">{cert ? `${cert.first_name} ${cert.last_name}` : <span className="font-mono">{l.query.slice(0, 24)}</span>}</p>
                      <p className="text-xs text-muted">{l.method === "qr" ? "QR kod" : "Qoʻlda"} · {relativeTime(l.created_at)}</p>
                    </div>
                    <ResultBadge result={l.result} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="Hali tekshiruv boʻlmagan" text="Kimdir sertifikatni tekshirganda shu yerda koʻrinadi." />
          )}
        </Card>
      </div>
    </>
  );
}

