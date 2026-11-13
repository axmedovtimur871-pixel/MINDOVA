"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { IconCheck, IconDownload } from "@/components/site/icons";
import { CertificateCommonFields, loadCommonDefaults, saveCommonDefaults, type CommonValues } from "./certificate-common-fields";
import { IFile, IPlus, ITrash, IUpload } from "./admin-icons";
import { applyMapping, guessMapping, parseParticipantsFile, MAX_ROWS, type Mapping, type ParsedSheet } from "@/lib/bulk-parse";
import { duplicateKey, nameSchema, normalizeName } from "@/lib/validation";
import { uuid } from "@/lib/uuid";
import { cn } from "@/lib/cn";
import type { EventRow, TemplateRow } from "@/lib/types";

interface Row {
  key: string; // idempotency key – stays the same across retries
  first_name: string;
  last_name: string;
  include: boolean;
  result?: { ok: boolean; id?: string; number?: string; error?: string; reused?: boolean };
}

type Phase = "upload" | "review" | "generating" | "done";
const CHUNK = 5;

function rowError(r: Row): string | null {
  const f = nameSchema.safeParse(r.first_name);
  if (!f.success) return `Ism: ${f.error.issues[0].message}`;
  const l = nameSchema.safeParse(r.last_name);
  if (!l.success) return `Familiya: ${l.error.issues[0].message}`;
  return null;
}

export function BulkGenerator({ templates, events }: { templates: TemplateRow[]; events: Pick<EventRow, "id" | "title">[] }) {
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>("upload");
  const [fileName, setFileName] = useState("");
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [common, setCommon] = useState<CommonValues | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dbDupes, setDbDupes] = useState<Record<string, { certificate_number: string }>>({});
  const [checkingDupes, setCheckingDupes] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [fatal, setFatal] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const stopRef = useRef(false);

  useEffect(() => setCommon(loadCommonDefaults(templates, events)), [templates, events]);
  useEffect(() => { if (common) saveCommonDefaults(common); }, [common]);

  // Warn before leaving while generating
  useEffect(() => {
    if (phase !== "generating") return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [phase]);

  const buildRows = useCallback((s: ParsedSheet, m: Mapping) => {
    const mapped = applyMapping(s, m);
    setRows(mapped.map((r) => ({ key: uuid(), first_name: normalizeName(r.first_name), last_name: normalizeName(r.last_name), include: true })));
  }, []);

  async function handleFile(file: File) {
    setParseError(null);
    try {
      const s = await parseParticipantsFile(file);
      if (s.rows.length === 0) throw new Error("Faylda ism-familiyalar topilmadi.");
      const m = guessMapping(s);
      setSheet(s);
      setMapping(m);
      setFileName(file.name);
      buildRows(s, m);
      setPhase("review");
      if (s.rows.length > MAX_ROWS) toast(`Faqat birinchi ${MAX_ROWS} ta qator olindi.`, "info");
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Faylni oʻqib boʻlmadi.");
    }
  }

  // In-file duplicates
  const fileDupes = useMemo(() => {
    const seen = new Map<string, number>();
    const dupes = new Set<string>();
    rows.forEach((r) => {
      const k = duplicateKey(r.first_name, r.last_name, "");
      if (!r.first_name || !r.last_name) return;
      if (seen.has(k)) dupes.add(r.key);
      else seen.set(k, 1);
    });
    return dupes;
  }, [rows]);

  // Already issued for this event (checked in the database)
  const eventName = common?.event_name.trim() ?? "";
  const namesSignature = rows.map((r) => `${r.first_name}|${r.last_name}`).join("\n");
  useEffect(() => {
    if (phase !== "review" || !eventName || rows.length === 0) { setDbDupes({}); return; }
    const id = setTimeout(async () => {
      setCheckingDupes(true);
      try {
        const res = await fetch("/api/admin/certificates/check-duplicates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_name: eventName, names: rows.map((r) => ({ first_name: r.first_name, last_name: r.last_name })) }),
        });
        const json = await res.json();
        if (res.ok) setDbDupes(json.duplicates ?? {});
      } finally {
        setCheckingDupes(false);
      }
    }, 500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, namesSignature, phase]);

  const dbDupeOf = (r: Row) => dbDupes[duplicateKey(r.first_name, r.last_name, eventName)];

  // Duplicates start unticked so nobody gets two certificates by accident.
  // (Computed outside the state updater: updaters must stay pure because React may replay them.)
  const autoUnticked = useRef(new Set<string>());
  useEffect(() => {
    const toUntick = rows
      .filter((r) => r.include && !r.result?.ok && !autoUnticked.current.has(r.key))
      .filter((r) => fileDupes.has(r.key) || !!dbDupes[duplicateKey(r.first_name, r.last_name, eventName)])
      .map((r) => r.key);
    if (toUntick.length === 0) return;
    toUntick.forEach((k) => autoUnticked.current.add(k));
    setRows((rs) => rs.map((r) => (toUntick.includes(r.key) ? { ...r, include: false } : r)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileDupes, dbDupes]);

  const invalidCount = rows.filter((r) => r.include && rowError(r)).length;
  const selected = rows.filter((r) => r.include && !rowError(r));
  const pending = rows.filter((r) => r.include && !rowError(r) && !r.result?.ok);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function generate() {
    if (!common) return;
    setFatal(null);
    if (!common.event_name.trim()) return setFatal("Tadbirni tanlang yoki nomini yozing.");
    if (!common.template_id) return setFatal("Shablonni tanlang.");
    if (invalidCount > 0) return setFatal(`${invalidCount} ta qatorda xato bor. Ularni tuzating yoki belgisini olib tashlang.`);
    let todo = pending;
    if (todo.length === 0) return setFatal("Yaratiladigan qator tanlanmagan.");

    // Final duplicate check right before generating (the live check is debounced).
    // Rows the admin deliberately re-ticked after an automatic untick are respected.
    try {
      const res = await fetch("/api/admin/certificates/check-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_name: common.event_name.trim(), names: todo.map((r) => ({ first_name: r.first_name, last_name: r.last_name })) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Takrorlanishni tekshirib boʻlmadi");
      const found: Record<string, { certificate_number: string }> = json.duplicates ?? {};
      const seen = new Set<string>();
      const unexpected = todo.filter((r) => {
        const k = duplicateKey(r.first_name, r.last_name, common.event_name.trim());
        const inFile = seen.has(k);
        seen.add(k);
        return (found[k] || inFile) && !autoUnticked.current.has(r.key);
      });
      if (unexpected.length > 0) {
        unexpected.forEach((r) => autoUnticked.current.add(r.key));
        setDbDupes(found);
        setRows((rs) => rs.map((r) => (unexpected.some((u) => u.key === r.key) ? { ...r, include: false } : r)));
        return setFatal(`${unexpected.length} ta ishtirokchi takrorlangan yoki unga allaqachon sertifikat berilgan — ular belgilanmadi. Roʻyxatni tekshirib, qayta bosing.`);
      }
    } catch (e) {
      return setFatal(e instanceof Error ? e.message : "Takrorlanishni tekshirib boʻlmadi");
    }
    todo = todo.filter((r) => r.include);

    setPhase("generating");
    stopRef.current = false;
    let bid = batchId;
    try {
      if (!bid) {
        const res = await fetch("/api/admin/batches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: common.event_id || null, template_id: common.template_id, source_name: fileName, total_rows: todo.length }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Paket yaratilmadi");
        bid = json.batch_id as string;
        setBatchId(bid);
      }
      setProgress({ done: 0, total: todo.length });
      for (let i = 0; i < todo.length; i += CHUNK) {
        if (stopRef.current) break;
        const chunk = todo.slice(i, i + CHUNK);
        let attempt = 0;
        for (;;) {
          try {
            const res = await fetch(`/api/admin/batches/${bid}/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...common,
                event_id: common.event_id || null,
                rows: chunk.map((r) => ({ key: r.key, first_name: r.first_name, last_name: r.last_name })),
              }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error ?? `Server xatosi (${res.status})`);
            const byKey = new Map<string, { ok: boolean; id?: string; certificate_number?: string; error?: string; reused?: boolean }>(
              (json.results as { key: string; ok: boolean }[]).map((x) => [x.key, x]),
            );
            setRows((rs) => rs.map((r) => {
              const x = byKey.get(r.key);
              return x ? { ...r, result: { ok: x.ok, id: x.id, number: x.certificate_number, error: x.error, reused: x.reused } } : r;
            }));
            break;
          } catch (e) {
            // Network hiccup: retry the same chunk (idempotency keys prevent duplicates)
            if (++attempt >= 3) {
              const msg = e instanceof Error ? e.message : "Tarmoq xatosi";
              setRows((rs) => rs.map((r) => (chunk.some((c) => c.key === r.key) ? { ...r, result: { ok: false, error: msg } } : r)));
              break;
            }
            await new Promise((res) => setTimeout(res, 800 * attempt));
          }
        }
        setProgress({ done: Math.min(todo.length, i + chunk.length), total: todo.length });
      }
    } catch (e) {
      setFatal(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setPhase("done");
    }
  }

  if (!common) return <Card className="h-96 animate-pulse bg-cream-100"><span className="sr-only">Yuklanmoqda…</span></Card>;
  if (templates.length === 0) return <Alert tone="warning" title="Faol shablon yoʻq">Avval “Sertifikat shablonlari” boʻlimida shablonni faollashtiring.</Alert>;

  // ---------- Step 1: upload ----------
  if (phase === "upload") {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5 sm:p-6">
          <Steps current={1} />
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={cn("mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors", dragOver ? "border-gold-500 bg-gold-50" : "border-line bg-cream-50")}
          >
            <span className="grid size-14 place-items-center rounded-full bg-navy-900 text-gold-300"><IUpload className="size-7" /></span>
            <p className="mt-4 font-semibold text-navy-900">Excel (.xlsx) yoki CSV faylni shu yerga tashlang</p>
            <p className="mt-1 text-sm text-muted">yoki kompyuteringizdan tanlang (5 MB gacha, {MAX_ROWS} ta qatorgacha)</p>
            <Button className="mt-5" onClick={() => fileRef.current?.click()}><IFile className="size-5" /> Faylni tanlash</Button>
            <input ref={fileRef} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFile(f); }} />
          </div>
          {parseError && <Alert tone="danger" className="mt-4">{parseError}</Alert>}
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-navy-900">Fayl qanday boʻlishi kerak?</h2>
          <p className="mt-1 text-sm leading-6 text-muted">Birinchi qatorda ustun nomlari, keyin har bir qatorda bitta ishtirokchi:</p>
          <table className="mt-4 w-full overflow-hidden rounded-lg text-left text-sm ring-1 ring-line">
            <thead className="bg-cream-100"><tr><th className="px-3 py-2">Ism</th><th className="px-3 py-2">Familiya</th></tr></thead>
            <tbody className="divide-y divide-line bg-white">
              {[["Abdulloh", "Aliyev"], ["Muhammad", "Karimov"], ["Madina", "Sobirova"]].map(([a, b]) => <tr key={a}><td className="px-3 py-2">{a}</td><td className="px-3 py-2">{b}</td></tr>)}
            </tbody>
          </table>
          <p className="mt-3 text-sm leading-6 text-muted">“F.I.Sh.” kabi bitta ustunli roʻyxat ham boʻladi — keyingi qadamda ustunlarni tanlaysiz.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/samples/ishtirokchilar-namuna.xlsx" download className={buttonClass("outline", "sm")}><IconDownload className="size-4" /> Namuna (.xlsx)</a>
            <a href="/samples/ishtirokchilar-namuna.csv" download className={buttonClass("ghost", "sm")}><IconDownload className="size-4" /> Namuna (.csv)</a>
          </div>
        </Card>
      </div>
    );
  }

  const successCount = rows.filter((r) => r.result?.ok).length;
  const failed = rows.filter((r) => r.include && r.result && !r.result.ok);
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  const locked = phase === "generating";

  return (
    <div className="space-y-6">
      {/* ---------- Progress / report ---------- */}
      {(phase === "generating" || phase === "done") && (
        <Card className="p-5 sm:p-6" >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-navy-900">
                {phase === "generating" ? "Sertifikatlar yaratilmoqda…" : "Natija"}
              </h2>
              <p className="text-sm text-muted" aria-live="polite">
                {phase === "generating" ? `${progress.done} / ${progress.total} — sahifani yopmang.` : `${successCount} ta muvaffaqiyatli${failed.length ? `, ${failed.length} ta xato` : ""}.`}
              </p>
            </div>
            {phase === "generating" ? (
              <Button variant="outline" size="sm" onClick={() => (stopRef.current = true)}>Toʻxtatish</Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                {batchId && successCount > 0 && (
                  <a href={`/api/admin/batches/${batchId}/zip`} className={buttonClass("primary")}><IconDownload className="size-5" /> Barchasini ZIP qilib yuklab olish</a>
                )}
                {pending.length > 0 && <Button variant="outline" onClick={generate}>Qolganlarini qayta urinish ({pending.length})</Button>}
                <Link href="/admin/certificates" className={buttonClass("ghost")}>Roʻyxatga oʻtish</Link>
              </div>
            )}
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-cream-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-navy-800 to-gold-500 transition-[width] duration-500" style={{ width: `${phase === "done" && progress.total ? 100 : pct}%` }} />
          </div>
          {phase === "done" && successCount > 0 && failed.length === 0 && (
            <Alert tone="success" className="mt-4" title="Hammasi tayyor!">Barcha sertifikatlar bazaga saqlandi. ZIP faylda har bir ishtirokchi uchun alohida PDF va roʻyxat (CSV) bor.</Alert>
          )}
          {failed.length > 0 && phase === "done" && (
            <Alert tone="danger" className="mt-4" title={`${failed.length} ta sertifikat yaratilmadi`}>Xato sabablari jadvalda koʻrsatilgan. Tuzatib, “Qolganlarini qayta urinish” tugmasini bosing — tayyor boʻlganlari takrorlanmaydi.</Alert>
          )}
        </Card>
      )}

      {fatal && <Alert tone="danger">{fatal}</Alert>}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* ---------- Step 2: review ---------- */}
        <Card>
          <CardHeader
            title={`Ishtirokchilar (${rows.length})`}
            description={<>Fayl: <b>{fileName}</b>. Ismlarni shu yerda tuzatishingiz mumkin.</>}
            action={!locked && phase !== "done" && (
              <Button variant="ghost" size="sm" onClick={() => { setPhase("upload"); setRows([]); setSheet(null); setBatchId(null); autoUnticked.current.clear(); }}>Boshqa fayl</Button>
            )}
          />
          {sheet && mapping && phase === "review" && (
            <div className="grid gap-3 border-b border-line bg-cream-50 px-5 py-4 text-sm sm:grid-cols-3 sm:px-6">
              <label className="flex flex-col gap-1">
                <span className="font-semibold text-navy-900">Ustunlar</span>
                <Select value={mapping.mode} onChange={(e) => {
                  const guess = guessMapping(sheet);
                  const next: Mapping =
                    e.target.value === "full"
                      ? { mode: "full", column: guess.mode === "full" ? guess.column : guess.first, order: "last-first" }
                      : guess.mode === "split" ? guess : { mode: "split", first: 0, last: Math.min(1, sheet.headers.length - 1) };
                  setMapping(next); buildRows(sheet, next); autoUnticked.current.clear();
                }}>
                  <option value="split">Ism va familiya alohida</option>
                  <option value="full">Toʻliq ism bitta ustunda</option>
                </Select>
              </label>
              {mapping.mode === "split" ? (
                <>
                  <ColumnSelect label="Ism ustuni" headers={sheet.headers} value={mapping.first} onChange={(v) => { const m = { ...mapping, first: v }; setMapping(m); buildRows(sheet, m); }} />
                  <ColumnSelect label="Familiya ustuni" headers={sheet.headers} value={mapping.last} onChange={(v) => { const m = { ...mapping, last: v }; setMapping(m); buildRows(sheet, m); }} />
                </>
              ) : (
                <>
                  <ColumnSelect label="Toʻliq ism ustuni" headers={sheet.headers} value={mapping.column} onChange={(v) => { const m = { ...mapping, column: v }; setMapping(m); buildRows(sheet, m); }} />
                  <label className="flex flex-col gap-1">
                    <span className="font-semibold text-navy-900">Tartib</span>
                    <Select value={mapping.order} onChange={(e) => { const m = { ...mapping, order: e.target.value as "first-last" | "last-first" }; setMapping(m); buildRows(sheet, m); }}>
                      <option value="last-first">Familiya Ism (Aliyev Abdulloh)</option>
                      <option value="first-last">Ism Familiya (Abdulloh Aliyev)</option>
                    </Select>
                  </label>
                </>
              )}
            </div>
          )}

          <div className="max-h-[560px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-white text-xs font-semibold tracking-wide text-muted uppercase shadow-[0_1px_0_var(--color-line)]">
                <tr>
                  <th className="w-10 px-4 py-2.5"><span className="sr-only">Tanlash</span></th>
                  <th className="w-10 px-1 py-2.5">№</th>
                  <th className="px-2 py-2.5">Ism</th>
                  <th className="px-2 py-2.5">Familiya</th>
                  <th className="px-4 py-2.5">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r, i) => {
                  const err = rowError(r);
                  const dupFile = fileDupes.has(r.key);
                  const dupDb = dbDupeOf(r);
                  return (
                    <tr key={r.key} className={cn(!r.include && "bg-cream-50 text-muted", r.result?.ok && "bg-success-100/40")}>
                      <td className="px-4 py-1.5">
                        <input type="checkbox" className="size-4 accent-navy-900" checked={r.include} disabled={locked || r.result?.ok} onChange={(e) => updateRow(r.key, { include: e.target.checked })} aria-label={`${i + 1}-qatorni tanlash`} />
                      </td>
                      <td className="px-1 py-1.5 text-xs text-muted">{i + 1}</td>
                      <td className="px-2 py-1.5">
                        <input value={r.first_name} disabled={locked || r.result?.ok} onChange={(e) => updateRow(r.key, { first_name: e.target.value, result: undefined })} onBlur={(e) => updateRow(r.key, { first_name: normalizeName(e.target.value) })} aria-label="Ism" className={cn("h-9 w-full min-w-24 rounded-md border bg-white px-2 disabled:bg-transparent disabled:border-transparent", err?.startsWith("Ism") ? "border-danger-700" : "border-line")} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={r.last_name} disabled={locked || r.result?.ok} onChange={(e) => updateRow(r.key, { last_name: e.target.value, result: undefined })} onBlur={(e) => updateRow(r.key, { last_name: normalizeName(e.target.value) })} aria-label="Familiya" className={cn("h-9 w-full min-w-24 rounded-md border bg-white px-2 disabled:bg-transparent disabled:border-transparent", err?.startsWith("Familiya") ? "border-danger-700" : "border-line")} />
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col items-start gap-0.5">
                            {r.result?.ok ? (
                              <Link href={`/admin/certificates/${r.result.id}`} className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-success-700 hover:underline"><IconCheck className="size-3.5" />{r.result.number}</Link>
                            ) : r.result && !r.result.ok ? (
                              <span className="text-xs text-danger-700">{r.result.error}</span>
                            ) : err ? (
                              <Badge tone="danger">{err}</Badge>
                            ) : dupDb ? (
                              <Badge tone="warning">Allaqachon berilgan ({dupDb.certificate_number})</Badge>
                            ) : dupFile ? (
                              <Badge tone="warning">Faylda takrorlangan</Badge>
                            ) : r.include ? (
                              <Badge tone="success">Tayyor</Badge>
                            ) : (
                              <Badge>Oʻtkazib yuboriladi</Badge>
                            )}
                          </div>
                          {!locked && !r.result?.ok && (
                            <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-danger-100 hover:text-danger-700" aria-label="Qatorni oʻchirish">
                              <ITrash className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!locked && phase === "review" && (
            <div className="border-t border-line px-5 py-3 sm:px-6">
              <Button variant="ghost" size="sm" onClick={() => setRows((rs) => [...rs, { key: uuid(), first_name: "", last_name: "", include: true }])}><IPlus className="size-4" /> Qator qoʻshish</Button>
            </div>
          )}
        </Card>

        {/* ---------- Step 3: event + generate ---------- */}
        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="p-5 sm:p-6">
            <Steps current={phase === "review" ? 2 : 3} />
            <div className={cn("mt-5", (locked || phase === "done") && "pointer-events-none opacity-60")}>
              <CertificateCommonFields value={common} onChange={setCommon} templates={templates} events={events} />
            </div>
          </Card>
          {phase === "review" && (
            <Card className="p-5 sm:p-6">
              <ul className="space-y-1.5 text-sm">
                <li className="flex justify-between"><span className="text-muted">Yaratiladi</span><b className="text-navy-900">{selected.length} ta</b></li>
                <li className="flex justify-between"><span className="text-muted">Oʻtkazib yuboriladi</span><b>{rows.length - rows.filter((r) => r.include).length} ta</b></li>
                {invalidCount > 0 && <li className="flex justify-between text-danger-700"><span>Xatoli qatorlar</span><b>{invalidCount} ta</b></li>}
                {checkingDupes && <li className="text-xs text-muted">Bazadan takrorlanish tekshirilmoqda…</li>}
              </ul>
              <Button size="lg" className="mt-5 w-full" onClick={generate} disabled={selected.length === 0 || invalidCount > 0}>
                {selected.length} ta sertifikat yaratish
              </Button>
              <p className="mt-2 text-xs leading-5 text-muted">Takrorlangan va allaqachon sertifikat olganlar avtomatik belgilanmagan. Kerak boʻlsa, belgini qoʻyib qoʻshishingiz mumkin.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ColumnSelect({ label, headers, value, onChange }: { label: string; headers: string[]; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-semibold text-navy-900">{label}</span>
      <Select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
      </Select>
    </label>
  );
}

function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Faylni yuklash", "Tekshirish", "Yaratish"];
  return (
    <ol className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={cn("grid size-7 place-items-center rounded-full", i + 1 < current ? "bg-success-700 text-white" : i + 1 === current ? "bg-navy-900 text-gold-300" : "bg-cream-200 text-muted")}>
            {i + 1 < current ? <IconCheck className="size-4" /> : i + 1}
          </span>
          <span className={cn(i + 1 === current ? "text-navy-900" : "text-muted", "hidden sm:inline")}>{s}</span>
          {i < steps.length - 1 && <span className="h-px w-5 bg-line sm:w-8" />}
        </li>
      ))}
    </ol>
  );
}
