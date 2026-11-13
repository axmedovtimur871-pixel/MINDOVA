"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { CertificatePreview } from "@/components/certificate/certificate-preview";
import { IEye, ITrash, IUpload } from "./admin-icons";
import {
  FONTS, FONT_KEYS, PLACEHOLDERS, SAMPLE_DATA, TEXT_LAYER_KEYS, TEXT_LAYER_LABELS, defaultLayout, normalizeLayout,
  type CertificateData, type TemplateLayout, type TextLayer, type TextLayerKey,
} from "@/lib/certificates/layout";
import { uploadMedia } from "@/lib/upload-client";
import { cn } from "@/lib/cn";
import type { TemplateRow } from "@/lib/types";

type LayerKey = TextLayerKey | "qr" | "signature";

export function TemplateEditor({ template, isNew, certificateCount }: { template: TemplateRow; isNew: boolean; certificateCount: number }) {
  const router = useRouter();
  const toast = useToast();
  const [meta, setMeta] = useState({
    name: template.name,
    description: template.description,
    page_size: template.page_size,
    background_fit: template.background_fit,
    background_path: template.background_path,
    background_width: template.background_width,
    background_height: template.background_height,
  });
  const [layout, setLayout] = useState<TemplateLayout>(() => normalizeLayout(template.layout));
  const [selected, setSelected] = useState<LayerKey>("name");
  const [sample, setSample] = useState<CertificateData>({ ...SAMPLE_DATA, description: "1-oʻrin, «Bilimdonlar» jamoasi tarkibida" });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setL = (fn: (l: TemplateLayout) => TemplateLayout) => { setLayout(fn); setDirty(true); };
  const setText = (key: TextLayerKey, patch: Partial<TextLayer>) => setL((l) => ({ ...l, [key]: { ...l[key], ...patch } }));
  const setM = (patch: Partial<typeof meta>) => { setMeta((m) => ({ ...m, ...patch })); setDirty(true); };

  async function patch(body: Record<string, unknown>, okText: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Saqlanmadi");
      toast(okText);
      router.refresh();
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Xatolik", "error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    if (await patch({ ...meta, layout }, "Shablon saqlandi")) setDirty(false);
  }

  async function pdfPreview() {
    setPreviewing(true);
    const win = window.open("", "_blank");
    try {
      const res = await fetch("/api/admin/certificates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: template.id, layout, page_size: meta.page_size, background_fit: meta.background_fit, ...sample }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "PDF tayyorlanmadi");
      const url = URL.createObjectURL(await res.blob());
      if (win) win.location.href = url;
    } catch (e) {
      win?.close();
      toast(e instanceof Error ? e.message : "Xatolik", "error");
    } finally {
      setPreviewing(false);
    }
  }

  async function replaceBackground(file: File) {
    setUploading("bg");
    try {
      const up = await uploadMedia(file, "templates");
      setM({ background_path: up.path, background_width: up.width, background_height: up.height });
      toast("Yangi fon yuklandi — “Saqlash”ni bosing");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Xatolik", "error");
    } finally {
      setUploading(null);
    }
  }

  async function uploadSignature(file: File) {
    setUploading("sig");
    try {
      const up = await uploadMedia(file, "signatures");
      setL((l) => ({ ...l, signature: { ...l.signature, enabled: true, path: up.path, aspect: up.width / up.height } }));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Xatolik", "error");
    } finally {
      setUploading(null);
    }
  }

  async function remove() {
    const res = await fetch(`/api/admin/templates/${template.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setConfirmDelete(false); return toast(json.error ?? "Oʻchirilmadi", "error"); }
    toast("Shablon oʻchirildi");
    router.push("/admin/templates");
    router.refresh();
  }

  const layers: { key: LayerKey; label: string; enabled: boolean }[] = [
    ...TEXT_LAYER_KEYS.map((k) => ({ key: k as LayerKey, label: TEXT_LAYER_LABELS[k], enabled: layout[k].enabled })),
    { key: "qr", label: "QR kod", enabled: layout.qr.enabled },
    { key: "signature", label: "Imzo / muhr rasmi", enabled: layout.signature.enabled },
  ];

  return (
    <div className="space-y-6">
      {isNew && <Alert tone="info" title="Shablon yaratildi">Endi har bir matnni rasmda kerakli joyga sudrab qoʻying yoki oʻng tomondagi raqamlar bilan aniq sozlang, soʻng “Saqlash”ni bosing.</Alert>}
      {template.background_path.startsWith("builtin/") && (
        <Alert tone="warning" title="Bu ilova bilan kelgan boshlangʻich shablon">
          Rasmiy ZAKOVAT dizayningiz boʻlsa, uni “Fonni almashtirish” orqali yuklang (ism, sana va QR kodsiz “boʻsh” varianti) va matnlarni unga moslang.
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        {/* Preview */}
        <div className="space-y-3 xl:sticky xl:top-6 xl:self-start">
          <div className="overflow-hidden rounded-lg shadow-lift ring-1 ring-line">
            <CertificatePreview
              template={{ ...meta, layout }}
              data={sample}
              qrValue="https://zakovat-andijon.uz/verify/namuna-token"
              selected={selected}
              onSelect={(k) => setSelected(k as LayerKey)}
              onMove={(k, x, y) => setL((l) => ({ ...l, [k]: { ...(l[k as LayerKey] as object), x, y } }))}
            />
          </div>
          <p className="text-xs text-muted">Matn yoki QR kodni sichqoncha (yoki barmoq) bilan sudrab joylashtiring. Ustiga bosilsa, sozlamalari oʻng tomonda ochiladi.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} loading={saving} disabled={!dirty}>{dirty ? "Saqlash" : "Saqlangan"}</Button>
            <Button variant="outline" onClick={pdfPreview} loading={previewing}><IEye className="size-5" /> PDF namunasi</Button>
            <Button variant="ghost" onClick={() => { setLayout(defaultLayout()); setDirty(true); }}>Standart joylashuv</Button>
            {dirty && <Badge tone="warning" className="self-center">Saqlanmagan oʻzgarishlar bor</Badge>}
          </div>
          <Card className="p-4">
            <p className="mb-3 text-sm font-semibold text-navy-900">Namuna maʼlumotlari (faqat koʻrish uchun)</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input aria-label="Ism" value={sample.first_name} onChange={(e) => setSample({ ...sample, first_name: e.target.value })} />
              <Input aria-label="Familiya" value={sample.last_name} onChange={(e) => setSample({ ...sample, last_name: e.target.value })} />
              <Input aria-label="Tadbir" value={sample.event_name} onChange={(e) => setSample({ ...sample, event_name: e.target.value })} />
            </div>
            <button type="button" className="mt-2 text-xs font-semibold text-navy-700 hover:text-gold-700" onClick={() => setSample({ ...sample, first_name: "Muhammadabdulaziz", last_name: "Abdurahmonova-Gʻulomjonova" })}>
              Juda uzun ism bilan sinab koʻrish
            </button>
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <Card className="p-4">
            <p className="mb-2 text-sm font-semibold text-navy-900">Qatlamlar</p>
            <div className="flex flex-wrap gap-1.5">
              {layers.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setSelected(l.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors",
                    selected === l.key ? "bg-navy-900 text-cream-50 ring-navy-900" : "bg-white text-navy-800 ring-line hover:ring-navy-600",
                    !l.enabled && selected !== l.key && "text-muted line-through",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            {selected === "qr" ? (
              <div className="space-y-4">
                <Toggle label="QR kodni koʻrsatish" checked={layout.qr.enabled} onChange={(v) => setL((l) => ({ ...l, qr: { ...l.qr, enabled: v } }))} />
                <XY x={layout.qr.x} y={layout.qr.y} onChange={(x, y) => setL((l) => ({ ...l, qr: { ...l.qr, x, y } }))} />
                <Num label="Oʻlchami (sahifa kengligiga nisbatan %)" value={layout.qr.size} min={4} max={30} step={0.1} onChange={(v) => setL((l) => ({ ...l, qr: { ...l.qr, size: v } }))} />
                <Color label="Rangi" value={layout.qr.color} onChange={(v) => setL((l) => ({ ...l, qr: { ...l.qr, color: v } }))} />
                <Toggle label="Oq fon (qorongʻi dizaynda skanerlash oson boʻladi)" checked={layout.qr.background} onChange={(v) => setL((l) => ({ ...l, qr: { ...l.qr, background: v } }))} />
                <p className="text-xs leading-5 text-muted">Ishonchli skanerlash uchun QR kod kamida 8% boʻlsin va atrofida boʻsh joy qolsin.</p>
              </div>
            ) : selected === "signature" ? (
              <div className="space-y-4">
                <Toggle label="Imzo / muhr rasmini koʻrsatish" checked={layout.signature.enabled} onChange={(v) => setL((l) => ({ ...l, signature: { ...l.signature, enabled: v } }))} />
                <div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 hover:bg-cream-50">
                    <IUpload className="size-4" /> {uploading === "sig" ? "Yuklanmoqda…" : layout.signature.path ? "Boshqa rasm yuklash" : "Rasm yuklash (PNG, shaffof fon)"}
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) uploadSignature(f); }} />
                  </label>
                  {layout.signature.path && (
                    <button type="button" className="ml-3 text-sm text-danger-700" onClick={() => setL((l) => ({ ...l, signature: { ...l.signature, path: null, enabled: false } }))}>Olib tashlash</button>
                  )}
                </div>
                <XY x={layout.signature.x} y={layout.signature.y} onChange={(x, y) => setL((l) => ({ ...l, signature: { ...l.signature, x, y } }))} />
                <Num label="Kengligi (%)" value={layout.signature.width} min={3} max={60} step={0.5} onChange={(v) => setL((l) => ({ ...l, signature: { ...l.signature, width: v } }))} />
              </div>
            ) : (
              <TextLayerControls layer={layout[selected]} label={TEXT_LAYER_LABELS[selected]} onChange={(p) => setText(selected, p)} isName={selected === "name"} />
            )}
          </Card>

          <Card className="space-y-4 p-5">
            <p className="text-sm font-semibold text-navy-900">Shablon sozlamalari</p>
            <Field label="Nomi">{(p) => <Input {...p} value={meta.name} onChange={(e) => setM({ name: e.target.value })} maxLength={120} />}</Field>
            <Field label="Izoh">{(p) => <Textarea {...p} value={meta.description} onChange={(e) => setM({ description: e.target.value })} maxLength={500} className="min-h-16" />}</Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Sahifa">
                {(p) => (
                  <Select {...p} value={meta.page_size} onChange={(e) => setM({ page_size: e.target.value as typeof meta.page_size })}>
                    <option value="A4_LANDSCAPE">A4 albom (yotiq)</option>
                    <option value="A4_PORTRAIT">A4 kitob (tik)</option>
                  </Select>
                )}
              </Field>
              <Field label="Fonni joylash" hint="Rasm hech qachon choʻzilmaydi.">
                {(p) => (
                  <Select {...p} value={meta.background_fit} onChange={(e) => setM({ background_fit: e.target.value as typeof meta.background_fit })}>
                    <option value="contain">Toʻliq koʻrsatish (chetlari boʻsh qolishi mumkin)</option>
                    <option value="cover">Sahifani toʻldirish (chetlari kesilishi mumkin)</option>
                  </Select>
                )}
              </Field>
            </div>
            <p className="text-xs text-muted">Fon: {meta.background_width}×{meta.background_height} px {Math.abs(meta.background_width / meta.background_height - 841.89 / 595.28) < 0.02 || Math.abs(meta.background_height / meta.background_width - 841.89 / 595.28) < 0.02 ? "· A4 nisbatida ✓" : "· A4 nisbatida emas — “Fonni joylash” tanlovini tekshiring"}</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 hover:bg-cream-50">
              <IUpload className="size-4" /> {uploading === "bg" ? "Yuklanmoqda…" : "Fonni almashtirish"}
              <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) replaceBackground(f); }} />
            </label>
            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              {!template.is_default && template.is_active && <Button variant="outline" size="sm" onClick={() => patch({ is_default: true }, "Asosiy shablon qilindi")}>Asosiy shablon qilish</Button>}
              {template.is_active ? (
                <Button variant="outline" size="sm" onClick={() => patch({ is_active: false }, "Shablon faolsizlantirildi")}>Faolsizlantirish</Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => patch({ is_active: true }, "Shablon faollashtirildi")}>Faollashtirish</Button>
              )}
              <Button variant="ghost" size="sm" className="text-danger-700" onClick={() => setConfirmDelete(true)}><ITrash className="size-4" /> Oʻchirish</Button>
            </div>
            {certificateCount > 0 && <p className="text-xs leading-5 text-muted">Bu shablon bilan {certificateCount} ta sertifikat berilgan. Allaqachon yaratilgan PDF fayllar oʻzgarmaydi; yangi sozlamalar yangi sertifikatlarga qoʻllanadi.</p>}
          </Card>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Shablonni oʻchirish"
        description={certificateCount > 0 ? "Bu shablon bilan sertifikatlar berilgan — uni oʻchirib boʻlmaydi, faqat faolsizlantirish mumkin." : "Bu amalni ortga qaytarib boʻlmaydi."}
        footer={<><Button variant="ghost" onClick={() => setConfirmDelete(false)}>Bekor</Button>{certificateCount === 0 && <Button variant="danger" onClick={remove}>Oʻchirish</Button>}</>}
      />
    </div>
  );
}

function TextLayerControls({ layer, label, onChange, isName }: { layer: TextLayer; label: string; onChange: (p: Partial<TextLayer>) => void; isName: boolean }) {
  return (
    <div className="space-y-4">
      <Toggle label={`“${label}” matnini koʻrsatish`} checked={layer.enabled} onChange={(v) => onChange({ enabled: v })} />
      <Field label="Matn" hint={<>Jingalak qavs ichidagilar avtomatik almashtiriladi. {isName && "Ism-familiya uchun odatda {full_name}."}</>}>
        {(p) => <Input {...p} value={layer.text} onChange={(e) => onChange({ text: e.target.value })} maxLength={300} />}
      </Field>
      <div className="flex flex-wrap gap-1">
        {PLACEHOLDERS.map((ph) => (
          <button key={ph.key} type="button" title={ph.label} onClick={() => onChange({ text: `${layer.text}${layer.text ? " " : ""}${ph.key}` })} className="rounded-md bg-cream-100 px-2 py-1 font-mono text-[11px] text-navy-800 hover:bg-gold-100">
            {ph.key}
          </button>
        ))}
      </div>
      <XY x={layer.x} y={layer.y} onChange={(x, y) => onChange({ x, y })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Num label="Shrift oʻlchami (pt)" value={layer.fontSize} min={5} max={120} step={0.5} onChange={(v) => onChange({ fontSize: v })} />
        <Num label="Maks. kenglik (%)" value={layer.maxWidth} min={5} max={100} step={1} onChange={(v) => onChange({ maxWidth: v })} hint="Uzun matn shu kenglikka sigʻadigan qilib kichraytiriladi." />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Shrift">
          {(p) => (
            <Select {...p} value={layer.font} onChange={(e) => onChange({ font: e.target.value as TextLayer["font"] })}>
              {FONT_KEYS.map((k) => <option key={k} value={k}>{FONTS[k].label}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Tekislash">
          {(p) => (
            <Select {...p} value={layer.align} onChange={(e) => onChange({ align: e.target.value as TextLayer["align"] })}>
              <option value="left">Chapdan (X — chap chet)</option>
              <option value="center">Markazda (X — oʻrta)</option>
              <option value="right">Oʻngdan (X — oʻng chet)</option>
            </Select>
          )}
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Color label="Rangi" value={layer.color} onChange={(v) => onChange({ color: v })} />
        <Num label="Harflar oraligʻi (pt)" value={layer.letterSpacing ?? 0} min={0} max={20} step={0.1} onChange={(v) => onChange({ letterSpacing: v })} />
      </div>
      <Toggle label="KATTA HARFLARDA" checked={!!layer.uppercase} onChange={(v) => onChange({ uppercase: v })} />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-navy-900">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-navy-900" : "bg-cream-200")}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0")} />
      </button>
    </label>
  );
}

function Num({ label, value, onChange, min, max, step, hint }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      {(p) => (
        <div className="flex items-center gap-2">
          <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-navy-900" aria-hidden="true" tabIndex={-1} />
          <Input {...p} type="number" min={min} max={max} step={step} value={value} onChange={(e) => { const v = Number(e.target.value); if (!Number.isNaN(v)) onChange(v); }} className="h-9 w-[4.5rem] [appearance:textfield] px-2 text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        </div>
      )}
    </Field>
  );
}

function XY({ x, y, onChange }: { x: number; y: number; onChange: (x: number, y: number) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Num label="Gorizontal (X, %)" value={x} min={0} max={100} step={0.1} onChange={(v) => onChange(v, y)} />
      <Num label="Vertikal (Y, %)" value={y} min={0} max={100} step={0.1} onChange={(v) => onChange(x, v)} />
    </div>
  );
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      {(p) => (
        <div className="flex items-center gap-2">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-line bg-white p-0.5" aria-label={`${label} tanlash`} />
          <Input {...p} value={value} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)} className="h-9 font-mono text-sm" maxLength={7} />
        </div>
      )}
    </Field>
  );
}
