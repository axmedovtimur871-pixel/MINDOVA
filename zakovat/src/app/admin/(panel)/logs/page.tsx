import Link from "next/link";
import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { Card, EmptyState } from "@/components/ui/card";
import { ResultBadge } from "@/components/ui/badge";
import { ListFilters } from "@/components/admin/list-filters";
import { Pagination } from "@/components/admin/pagination";
import { requireAdminPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Tekshiruvlar tarixi" };
const PAGE_SIZE = 30;

function device(ua: string | null) {
  if (!ua) return "—";
  if (/iPhone|iPad/i.test(ua)) return "iPhone / iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS/i.test(ua)) return "Mac";
  if (/Telegram/i.test(ua)) return "Telegram";
  return "Boshqa";
}

export default async function LogsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const supabase = await createClient();
  let q = supabase.from("verification_logs").select("id, query, method, result, user_agent, created_at, certificate_id, certificates(id, certificate_number, first_name, last_name)", { count: "exact" });
  if (sp.result === "verified" || sp.result === "revoked" || sp.result === "not_found") q = q.eq("result", sp.result);
  if (sp.method === "qr" || sp.method === "manual") q = q.eq("method", sp.method);
  const term = (sp.q ?? "").replace(/[,()%_\\*]/g, "").trim();
  if (term) q = q.ilike("query", `%${term}%`);
  const { data, count } = await q.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const makeHref = (p: number) => {
    const u = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    u.set("page", String(p));
    return `/admin/logs?${u}`;
  };
  return (
    <>
      <PageTitle title="Tekshiruvlar tarixi" description="Saytda sertifikat tekshirilgan har bir holat. IP manzillar saqlanmaydi — faqat ularning xesh qiymati." />
      <Card>
        <ListFilters
          placeholder="Kiritilgan raqam yoki token boʻyicha"
          filters={[
            { name: "result", label: "Natija", options: [{ value: "verified", label: "Tasdiqlandi" }, { value: "revoked", label: "Bekor qilingan" }, { value: "not_found", label: "Topilmadi" }] },
            { name: "method", label: "Usul", options: [{ value: "qr", label: "QR kod" }, { value: "manual", label: "Qoʻlda" }] },
          ]}
        />
        {!data || data.length === 0 ? (
          <EmptyState title="Yozuvlar yoʻq" text="Kimdir sertifikatni tekshirganda shu yerda paydo boʻladi." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-cream-50 text-xs font-semibold tracking-wide text-muted uppercase">
                  <tr><th className="px-6 py-3">Vaqt</th><th className="px-3 py-3">Sertifikat</th><th className="px-3 py-3">Usul</th><th className="px-3 py-3">Qurilma</th><th className="px-6 py-3">Natija</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.map((l) => {
                    const c = l.certificates as unknown as { id: string; certificate_number: string; first_name: string; last_name: string } | null;
                    return (
                      <tr key={l.id}>
                        <td className="px-6 py-3 whitespace-nowrap text-muted">{formatDateTime(l.created_at)}</td>
                        <td className="px-3 py-3">
                          {c ? (
                            <Link href={`/admin/certificates/${c.id}`} className="hover:text-gold-700"><span className="font-medium text-navy-900">{c.first_name} {c.last_name}</span> <span className="font-mono text-xs text-muted">{c.certificate_number}</span></Link>
                          ) : (
                            <span className="font-mono text-xs break-all text-muted">{l.query.slice(0, 40)}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted">{l.method === "qr" ? "QR kod" : "Qoʻlda"}</td>
                        <td className="px-3 py-3 text-muted">{device(l.user_agent)}</td>
                        <td className="px-6 py-3"><ResultBadge result={l.result} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line"><Pagination page={page} pageSize={PAGE_SIZE} total={count ?? 0} makeHref={makeHref} /></div>
          </>
        )}
      </Card>
    </>
  );
}
