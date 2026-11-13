"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { CertificatePreview } from "@/components/certificate/certificate-preview";
import { IconCheck, IconDownload } from "@/components/site/icons";
import { CertificateCommonFields, loadCommonDefaults, saveCommonDefaults, type CommonValues } from "./certificate-common-fields";
import { IEye, IPrinter } from "./admin-icons";
import { normalizeName } from "@/lib/validation";
import { formatDateTime } from "@/lib/format";
import { uuid } from "@/lib/uuid";
import type { CertificateRow, EventRow, TemplateRow } from "@/lib/types";

interface Props {
  templates: TemplateRow[];
  events: Pick<EventRow, "id" | "title">[];
}

export function SingleCertificateForm({ templates, events }: Props) {
  const toast = useToast();
  const [common, setCommon] = useState<CommonValues | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [created, setCreated] = useState<CertificateRow[]>([]);
  const [duplicate, setDuplicate] = useState<{ certificate_number: string; created_at: string; id: string } | null>(null);
  const idemKey = useRef(uuid());
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => setCommon(loadCommonDefaults(templates, events)), [templates, events]);
  useEffect(() => { if (common) saveCommonDefaults(common); }, [common]);

  if (!common) return <Card className="h-96 animate-pulse bg-cream-100" ><span className="sr-only">Yuklanmoqda…</span></Card>;
  if (templates.length === 0) {
    return (
      <Alert tone="warning" title="Faol shablon yoʻq">
        Sertifikat yaratish uchun avval <Link className="underline" href="/admin/templates">Sertifikat shablonlari</Link> boʻlimida shablonni faollashtiring.
      </Alert>
    );
  }

  const template = templates.find((t) => t.id === common.template_id) ?? templates[0];
  const data = {
    first_name: normalizeName(first) || "Ism",
    last_name: normalizeName(last) || "Familiya",
    event_name: common.event_name || "Tadbir nomi",
    certificate_type: common.certificate_type,
    issue_date: common.issue_date,
    organizer: common.organizer,
    description: common.description,
    certificate_number: "ZA-…",
  };

  function validate() {
    const e: Record<string, string> = {};
    if (!normalizeName(first)) e.first_name = "Ismni kiriting";
    if (!normalizeName(last)) e.last_name = "Familiyani kiriting";
    if (!common!.event_name.trim()) e.event_name = "Tadbirni tanlang yoki nomini yozing";
    if (!common!.issue_date) e.issue_date = "Sanani tanlang";
    if (!common!.template_id) e.template_id = "Shablonni tanlang";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(allowDuplicate = false) {
    if (!validate()) return;
    setLoading(true);
    setFormError(null);
    try {
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...common,
          event_id: common!.event_id || null,
          first_name: first,
          last_name: last,
          allow_duplicate: allowDuplicate,
          idempotency_key: idemKey.current,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409 && json.duplicate) {
        setDuplicate(json.duplicate);
        return;
      }
      if (!res.ok) throw new Error(json.error ?? "Sertifikat yaratilmadi");
      const cert = json.certificate as CertificateRow;
      setCreated((c) => [cert, ...c.filter((x) => x.id !== cert.id)].slice(0, 10));
      toast(`Tayyor: ${cert.first_name} ${cert.last_name} — ${cert.certificate_number}`);
      idemKey.current = uuid();
      setFirst("");
      setLast("");
      setDuplicate(null);
      setTimeout(() => firstRef.current?.focus(), 50);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  async function openPdfPreview() {
    setPreviewLoading(true);
    const win = window.open("", "_blank");
    try {
      const res = await fetch("/api/admin/certificates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...common, first_name: first, last_name: last }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Namuna tayyorlanmadi");
      const url = URL.createObjectURL(await res.blob());
      if (win) win.location.href = url;
      else window.location.href = url;
    } catch (e) {
      win?.close();
      toast(e instanceof Error ? e.message : "Xatolik", "error");
    } finally {
      setPreviewLoading(false);
    }
  }

  const latest = created[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit(false);
        }}
        className="space-y-6"
      >
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-navy-900">1. Ishtirokchi</h2>
          <p className="mt-0.5 text-sm text-muted">Faqat shu ikki maydonni toʻldiring va “Sertifikat yaratish” tugmasini bosing.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Ism" required error={errors.first_name}>
              {(p) => (
                <Input
                  {...p}
                  ref={firstRef}
                  value={first}
                  onChange={(e) => { setFirst(e.target.value); setErrors((x) => ({ ...x, first_name: "" })); }}
                  autoComplete="off"
                  autoFocus
                  maxLength={80}
                  placeholder="Abdulloh"
                />
              )}
            </Field>
            <Field label="Familiya" required error={errors.last_name}>
              {(p) => (
                <Input
                  {...p}
                  value={last}
                  onChange={(e) => { setLast(e.target.value); setErrors((x) => ({ ...x, last_name: "" })); }}
                  autoComplete="off"
                  maxLength={80}
                  placeholder="Aliyev"
                />
              )}
            </Field>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">
            Maslahat: <b>o&apos;</b> va <b>g&apos;</b> avtomatik ravishda toʻgʻri <b>oʻ</b>, <b>gʻ</b> harflariga aylantiriladi.
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-navy-900">2. Tadbir maʼlumotlari</h2>
          <p className="mt-0.5 mb-4 text-sm text-muted">Bu qiymatlar eslab qolinadi — keyingi ishtirokchi uchun qayta yozish shart emas.</p>
          <CertificateCommonFields value={common} onChange={setCommon} templates={templates} events={events} errors={errors} />
        </Card>

        {formError && <Alert tone="danger" title="Sertifikat yaratilmadi">{formError}</Alert>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" size="lg" loading={loading} className="sm:flex-1">
            {loading ? "Yaratilmoqda…" : "Sertifikat yaratish"}
          </Button>
          <Button variant="outline" size="lg" onClick={openPdfPreview} loading={previewLoading}>
            <IEye className="size-5" /> PDF namunasi
          </Button>
        </div>
      </form>

      <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div>
          <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-muted uppercase">Jonli koʻrinish</p>
          <div className="overflow-hidden rounded-lg shadow-lift ring-1 ring-line">
            <CertificatePreview template={template} data={data} qrValue="https://zakovat-andijon.uz/verify/namuna" watermark="Namuna" />
          </div>
          <p className="mt-2 text-xs text-muted">QR kod va raqam yaratilganda avtomatik qoʻyiladi.</p>
        </div>

        {latest && (
          <Card className="animate-rise border-success-700/25 p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success-700 text-white"><IconCheck className="size-6" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy-900">{latest.first_name} {latest.last_name}</p>
                <p className="font-mono text-sm text-muted">{latest.certificate_number}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={`/api/admin/certificates/${latest.id}/pdf`} className={buttonClass("primary", "sm")}><IconDownload className="size-4" /> PDF yuklab olish</a>
                  <a href={`/api/admin/certificates/${latest.id}/pdf?inline=1`} target="_blank" className={buttonClass("outline", "sm")}><IPrinter className="size-4" /> Ochish / chop etish</a>
                  <Link href={`/admin/certificates/${latest.id}`} className={buttonClass("ghost", "sm")}>Batafsil →</Link>
                </div>
              </div>
            </div>
            {created.length > 1 && (
              <div className="mt-4 border-t border-line pt-3">
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">Shu sessiyada yaratilganlar</p>
                <ul className="space-y-1.5 text-sm">
                  {created.slice(1).map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2">
                      <Link href={`/admin/certificates/${c.id}`} className="truncate text-navy-800 hover:text-gold-700">{c.first_name} {c.last_name}</Link>
                      <a href={`/api/admin/certificates/${c.id}/pdf`} className="shrink-0 text-xs font-semibold text-navy-700 hover:text-gold-700">PDF ↓</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}
      </div>

      <Modal
        open={!!duplicate}
        onClose={() => setDuplicate(null)}
        title="Bu sertifikat allaqachon bor"
        description={
          duplicate && (
            <>
              <b>{normalizeName(first)} {normalizeName(last)}</b> uchun “{common.event_name}” tadbiri boʻyicha{" "}
              <b className="font-mono">{duplicate.certificate_number}</b> raqamli sertifikat {formatDateTime(duplicate.created_at)} da berilgan.
              Bu boshqa odam (adash) boʻlsa, baribir yaratishingiz mumkin.
            </>
          )
        }
        footer={
          <>
            {duplicate && <Link href={`/admin/certificates/${duplicate.id}`} className={buttonClass("ghost")}>Mavjudini ochish</Link>}
            <Button variant="outline" onClick={() => setDuplicate(null)} data-autofocus>Bekor qilish</Button>
            <Button loading={loading} onClick={() => submit(true)}>Baribir yaratish</Button>
          </>
        }
      />
    </div>
  );
}
