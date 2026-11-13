"use client";

import { Field, Input, Select } from "@/components/ui/field";
import type { EventRow, TemplateRow } from "@/lib/types";

export interface CommonValues {
  template_id: string;
  event_id: string; // "" = custom
  event_name: string;
  certificate_type: string;
  issue_date: string;
  organizer: string;
  description: string;
}

export const TYPE_SUGGESTIONS = ["Ishtirokchi", "Faol ishtirokchi", "Gʻolib", "1-oʻrin", "2-oʻrin", "3-oʻrin", "Hakam", "Tashkilotchi", "Koʻngilli"];
const STORAGE_KEY = "zakovat:certificate-defaults";

export function loadCommonDefaults(templates: TemplateRow[], events: Pick<EventRow, "id" | "title">[]): CommonValues {
  const def = templates.find((t) => t.is_default) ?? templates[0];
  const base: CommonValues = {
    template_id: def?.id ?? "",
    event_id: "",
    event_name: "",
    certificate_type: "Ishtirokchi",
    issue_date: new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tashkent" }),
    organizer: "Zakovat Andijon",
    description: "",
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<CommonValues> | null;
    if (saved) {
      const merged = { ...base, ...saved };
      if (!templates.some((t) => t.id === merged.template_id)) merged.template_id = base.template_id;
      if (merged.event_id && !events.some((e) => e.id === merged.event_id)) merged.event_id = "";
      return merged;
    }
  } catch { /* storage unavailable */ }
  return base;
}

export function saveCommonDefaults(v: CommonValues) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

export function CertificateCommonFields({ value, onChange, templates, events, errors = {} }: {
  value: CommonValues;
  onChange: (v: CommonValues) => void;
  templates: TemplateRow[];
  events: Pick<EventRow, "id" | "title">[];
  errors?: Partial<Record<keyof CommonValues, string>>;
}) {
  const set = <K extends keyof CommonValues>(k: K, v: CommonValues[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Tadbir" required className="sm:col-span-2" error={errors.event_name} hint={events.length === 0 ? "Tadbirlar roʻyxati boʻsh — nomini qoʻlda yozing yoki “Tadbirlar” boʻlimida tadbir qoʻshing." : undefined}>
        {(p) => (
          <div className="flex flex-col gap-2">
            <Select
              {...p}
              value={value.event_id}
              onChange={(e) => {
                const ev = events.find((x) => x.id === e.target.value);
                onChange({ ...value, event_id: e.target.value, event_name: ev ? ev.title : value.event_id ? "" : value.event_name });
              }}
            >
              <option value="">Boshqa (nomini qoʻlda yozish)</option>
              {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </Select>
            {!value.event_id && (
              <Input value={value.event_name} onChange={(e) => set("event_name", e.target.value)} placeholder="Masalan: Zakovat Andijon kubogi" maxLength={200} aria-label="Tadbir nomi" aria-invalid={errors.event_name ? true : undefined} />
            )}
          </div>
        )}
      </Field>
      <Field label="Sertifikat turi" hint="Roʻyxatdan tanlang yoki oʻzingiz yozing.">
        {(p) => (
          <>
            <Input {...p} list="cert-types" value={value.certificate_type} onChange={(e) => set("certificate_type", e.target.value)} maxLength={120} />
            <datalist id="cert-types">{TYPE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
          </>
        )}
      </Field>
      <Field label="Berilgan sana" required error={errors.issue_date}>
        {(p) => <Input {...p} type="date" value={value.issue_date} onChange={(e) => set("issue_date", e.target.value)} />}
      </Field>
      <Field label="Tashkilotchi">
        {(p) => <Input {...p} value={value.organizer} onChange={(e) => set("organizer", e.target.value)} maxLength={200} />}
      </Field>
      <Field label="Shablon" required error={errors.template_id}>
        {(p) => (
          <Select {...p} value={value.template_id} onChange={(e) => set("template_id", e.target.value)}>
            {templates.length === 0 && <option value="">Faol shablon yoʻq</option>}
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.is_default ? " (asosiy)" : ""}</option>)}
          </Select>
        )}
      </Field>
      <Field label="Qoʻshimcha izoh (ixtiyoriy)" className="sm:col-span-2" hint="Masalan: “1-oʻrin, «Bilimdonlar» jamoasi tarkibida”. Sertifikatda alohida qatorda chiqadi.">
        {(p) => <Input {...p} value={value.description} onChange={(e) => set("description", e.target.value)} maxLength={500} />}
      </Field>
    </div>
  );
}
