import Link from "next/link";
import { CertificatePreview } from "./certificate-preview";
import { buttonClass } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { IconAlert, IconCheck, IconDownload, IconSearch, IconX } from "@/components/site/icons";
import type { VerifyOutcome } from "@/lib/verify";
import { formatDate, formatDateTime } from "@/lib/format";
import { verifyUrl } from "@/lib/env";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

export function VerifyResultView({ result, query }: { result: VerifyOutcome; query: string }) {
  if (result.status === "rate_limited") {
    return <Alert tone="warning" title="Juda koʻp urinish">Bir daqiqadan soʻng qayta urinib koʻring.</Alert>;
  }
  if (result.status === "unavailable") {
    return <Alert tone="danger" title="Tekshirish vaqtincha ishlamayapti">Iltimos, birozdan soʻng qayta urinib koʻring.</Alert>;
  }

  const statusUi = {
    verified: { label: t.verify.verified, text: t.verify.verifiedText, Icon: IconCheck, cls: "border-success-700/25 bg-success-100 text-success-700", ring: "bg-success-700 text-white" },
    revoked: { label: t.verify.revoked, text: t.verify.revokedText, Icon: IconX, cls: "border-danger-700/25 bg-danger-100 text-danger-700", ring: "bg-danger-700 text-white" },
    not_found: { label: t.verify.notFound, text: t.verify.notFoundText, Icon: IconAlert, cls: "border-warning-700/25 bg-warning-100 text-warning-700", ring: "bg-warning-700 text-white" },
  }[result.status];

  const c = result.certificate;
  return (
    <div className="animate-rise space-y-6" aria-live="polite">
      <div className={cn("flex items-start gap-4 rounded-2xl border p-5 sm:p-6", statusUi.cls)} role="status">
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", statusUi.ring)}>
          <statusUi.Icon className="size-7" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-80">{t.verify.status}</p>
          <p className="font-display text-2xl font-bold tracking-wide sm:text-3xl">{statusUi.label}</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{statusUi.text}</p>
          {result.status === "not_found" && query && (
            <p className="mt-2 font-mono text-xs break-all opacity-80">{query.slice(0, 64)}</p>
          )}
        </div>
      </div>

      {c && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
            <dl className="divide-y divide-line">
              <Row label={t.verify.owner} value={<span className="font-display text-xl font-semibold text-navy-900">{c.first_name} {c.last_name}</span>} />
              <Row label={t.verify.number} value={<span className="font-mono tracking-wider">{c.certificate_number}</span>} />
              <Row label={t.verify.event} value={c.event_name} />
              {c.certificate_type && <Row label={t.verify.type} value={c.certificate_type} />}
              <Row label={t.verify.issued} value={formatDate(c.issue_date)} />
              {c.organizer && <Row label={t.verify.organizer} value={c.organizer} />}
              {result.status === "revoked" && c.revoked_at && <Row label={t.verify.revokedAt} value={formatDateTime(c.revoked_at)} />}
            </dl>
            {result.status === "verified" && (
              <a href={`/api/certificates/${encodeURIComponent(c.verification_token)}/pdf`} className={buttonClass("primary", "lg", "mt-6 w-full")}>
                <IconDownload className="size-5" /> {t.verify.download}
              </a>
            )}
            <Link href="/verify" className={buttonClass("ghost", "md", "mt-2 w-full")}>
              <IconSearch className="size-4" /> {t.verify.again}
            </Link>
          </div>

          {result.template && (
            <figure>
              <figcaption className="mb-3 text-xs font-semibold tracking-[0.16em] text-muted uppercase">{t.verify.preview}</figcaption>
              <div className="overflow-hidden rounded-lg shadow-lift ring-1 ring-line">
                <CertificatePreview
                  template={result.template}
                  data={{
                    first_name: c.first_name,
                    last_name: c.last_name,
                    event_name: c.event_name,
                    certificate_type: c.certificate_type,
                    issue_date: c.issue_date,
                    organizer: c.organizer,
                    description: c.description,
                    certificate_number: c.certificate_number,
                  }}
                  qrValue={verifyUrl(c.verification_token)}
                  watermark={result.status === "revoked" ? "Bekor qilingan" : undefined}
                />
              </div>
            </figure>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="shrink-0 text-xs font-semibold tracking-[0.12em] text-muted uppercase">{label}</dt>
      <dd className="text-[15px] text-ink sm:text-right">{value}</dd>
    </div>
  );
}
