import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/admin/admin-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { CertificateStatusBadge, ResultBadge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { CertificatePreview } from "@/components/certificate/certificate-preview";
import { StatusToggle } from "@/components/admin/certificate-actions";
import { PdfButtons } from "@/components/admin/pdf-buttons";
import { can, requireAdminPage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, relativeTime } from "@/lib/format";
import { verifyUrl } from "@/lib/env";
import type { CertificateRow, TemplateRow } from "@/lib/types";

export const metadata: Metadata = { title: "Sertifikat" };

export default async function CertificateDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("certificates").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const cert = data as CertificateRow;
  const [{ data: template }, { data: logs }, { data: creator }] = await Promise.all([
    supabase.from("certificate_templates").select("*").eq("id", cert.template_id).maybeSingle(),
    supabase.from("verification_logs").select("id, method, result, created_at").eq("certificate_id", id).order("created_at", { ascending: false }).limit(20),
    cert.created_by ? supabase.from("profiles").select("full_name, email").eq("id", cert.created_by).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const link = verifyUrl(cert.verification_token);

  return (
    <>
      <PageTitle
        title={`${cert.first_name} ${cert.last_name}`}
        description={<span className="font-mono">{cert.certificate_number}</span>}
        actions={<Link href="/admin/certificates" className="text-sm font-semibold text-navy-700 hover:text-gold-600">← Barcha sertifikatlar</Link>}
      />
      {sp.created && <Alert tone="success" title="Sertifikat yaratildi va bazaga saqlandi" className="mb-6">PDF tayyor. Uni yuklab olishingiz, chop etishingiz yoki havolani ishtirokchiga yuborishingiz mumkin.</Alert>}
      {cert.status === "revoked" && (
        <Alert tone="danger" title="Bu sertifikat bekor qilingan" className="mb-6">
          {cert.revoke_reason && <>Sabab: {cert.revoke_reason}. </>}
          {cert.revoked_at && <>Sana: {formatDateTime(cert.revoked_at)}.</>}
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {template && (
            <div className="overflow-hidden rounded-xl shadow-lift ring-1 ring-line">
              <CertificatePreview template={template as TemplateRow} data={cert} qrValue={link} watermark={cert.status === "revoked" ? "Bekor qilingan" : undefined} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <PdfButtons id={cert.id} verifyLink={link} />
            <StatusToggle id={cert.id} status={cert.status} number={cert.certificate_number} size="md" canRevoke={can(admin.role, "revokeCertificates")} />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Maʼlumotlar" action={<CertificateStatusBadge status={cert.status} />} />
            <dl className="divide-y divide-line px-5 text-sm sm:px-6">
              {[
                ["Ism", cert.first_name],
                ["Familiya", cert.last_name],
                ["Tadbir", cert.event_name],
                ["Sertifikat turi", cert.certificate_type || "—"],
                ["Berilgan sana", formatDate(cert.issue_date)],
                ["Tashkilotchi", cert.organizer || "—"],
                ["Izoh", cert.description || "—"],
                ["Yaratilgan", `${formatDateTime(cert.created_at)}${creator ? ` · ${creator.full_name || creator.email}` : ""}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-line px-5 py-4 sm:px-6">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Tekshirish havolasi (QR kod)</p>
              <a href={link} target="_blank" rel="noopener noreferrer" className="mt-1 block font-mono text-xs break-all text-navy-700 hover:text-gold-700">{link}</a>
            </div>
          </Card>

          <Card>
            <CardHeader title="Tekshiruvlar" description="Bu sertifikat necha marta tekshirilgani" />
            {logs && logs.length > 0 ? (
              <ul className="divide-y divide-line">
                {logs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between px-5 py-2.5 text-sm sm:px-6">
                    <span className="text-muted">{l.method === "qr" ? "QR kod" : "Qoʻlda"} · {relativeTime(l.created_at)}</span>
                    <ResultBadge result={l.result} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-5 text-sm text-muted sm:px-6">Hali tekshirilmagan.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
