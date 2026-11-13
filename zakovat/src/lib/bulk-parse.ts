import Papa from "papaparse";
import { readSheet } from "read-excel-file/browser";

export interface ParsedSheet {
  headers: string[];
  rows: string[][];
  headerDetected: boolean;
}

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_ROWS = 2000;

const HEADER_HINTS = /^(ism|ismi|first|firstname|first name|name|familiya|familiyasi|last|lastname|last name|surname|f\.?i\.?sh\.?|f\.?i\.?o\.?|to.?liq ism|full ?name|№|n|#|t\/r|tr)$/i;

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).replace(/\s+/g, " ").trim();
}

function finalize(raw: unknown[][]): ParsedSheet {
  const rows = raw.map((r) => r.map(cellToString)).filter((r) => r.some((c) => c !== ""));
  if (rows.length === 0) return { headers: [], rows: [], headerDetected: false };
  const width = Math.max(...rows.map((r) => r.length));
  const padded = rows.map((r) => [...r, ...Array(width - r.length).fill("")]);
  const first = padded[0];
  const headerDetected = first.some((c) => HEADER_HINTS.test(c.toLowerCase().replace(/[ʻʼ'`’‘]/g, "")));
  const headers = headerDetected ? first.map((h, i) => h || `Ustun ${i + 1}`) : first.map((_, i) => `Ustun ${i + 1}`);
  return { headers, rows: headerDetected ? padded.slice(1) : padded, headerDetected };
}

export async function parseParticipantsFile(file: File): Promise<ParsedSheet> {
  if (file.size > MAX_FILE_BYTES) throw new Error("Fayl hajmi 5 MB dan katta.");
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt") || file.type === "text/csv") {
    const text = await file.text();
    const res = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: "greedy", delimitersToGuess: [",", ";", "\t", "|"] });
    if (res.errors.length && res.data.length === 0) throw new Error("CSV faylni oʻqib boʻlmadi.");
    return finalize(res.data);
  }
  if (name.endsWith(".xlsx")) {
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    if (!(head[0] === 0x50 && head[1] === 0x4b)) throw new Error("Bu fayl haqiqiy .xlsx emas.");
    const data = (await readSheet(file)) as unknown[][];
    return finalize(data);
  }
  if (name.endsWith(".xls")) throw new Error("Eski .xls formati qoʻllab-quvvatlanmaydi. Faylni Excelda “.xlsx” sifatida saqlang.");
  throw new Error("Faqat .xlsx yoki .csv fayl yuklang.");
}

export type Mapping = { mode: "split"; first: number; last: number } | { mode: "full"; column: number; order: "first-last" | "last-first" };

/** Guess which columns hold first and last names. */
export function guessMapping(sheet: ParsedSheet): Mapping {
  const h = sheet.headers.map((x) => x.toLowerCase().replace(/[ʻʼ'`’‘]/g, ""));
  const firstIdx = h.findIndex((x) => /^(ism|ismi|first|firstname|first name|name)$/.test(x));
  const lastIdx = h.findIndex((x) => /^(familiya|familiyasi|last|lastname|last name|surname)$/.test(x));
  if (firstIdx >= 0 && lastIdx >= 0) return { mode: "split", first: firstIdx, last: lastIdx };
  const fullIdx = h.findIndex((x) => /(f\.?i\.?sh|f\.?i\.?o|toliq ism|full ?name)/.test(x));
  if (fullIdx >= 0) return { mode: "full", column: fullIdx, order: "last-first" };
  // No headers: skip a leading numbering column (1, 2, 3…)
  const numeric = (i: number) => sheet.rows.slice(0, 20).every((r) => /^\d+\.?$/.test(r[i] ?? "") || !r[i]);
  const cols = sheet.headers.map((_, i) => i).filter((i) => !numeric(i));
  if (cols.length >= 2) return { mode: "split", first: cols[0], last: cols[1] };
  if (cols.length === 1) return { mode: "full", column: cols[0], order: "first-last" };
  return { mode: "split", first: 0, last: Math.min(1, sheet.headers.length - 1) };
}

export function applyMapping(sheet: ParsedSheet, m: Mapping): { first_name: string; last_name: string; source: number }[] {
  return sheet.rows.slice(0, MAX_ROWS).map((r, i) => {
    if (m.mode === "split") return { first_name: r[m.first] ?? "", last_name: r[m.last] ?? "", source: i };
    const parts = (r[m.column] ?? "").split(" ").filter(Boolean);
    if (parts.length < 2) return { first_name: parts[0] ?? "", last_name: "", source: i };
    // Uzbek lists usually go "Familiya Ism Otasining ismi" – keep only the first two words.
    return m.order === "last-first"
      ? { last_name: parts[0], first_name: parts[1], source: i }
      : { first_name: parts[0], last_name: parts.slice(1).join(" "), source: i };
  });
}
