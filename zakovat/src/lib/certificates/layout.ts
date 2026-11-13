// Shared (client + server) certificate layout model.
// All positions are percentages of the page (0–100) so the same layout renders
// identically in the HTML preview and in the generated PDF.

export type PageSize = "A4_LANDSCAPE" | "A4_PORTRAIT";
export type BackgroundFit = "cover" | "contain";
export type TextAlign = "left" | "center" | "right";
export type FontKey =
  | "display"
  | "display-bold"
  | "display-italic"
  | "serif"
  | "serif-bold"
  | "sans"
  | "sans-medium"
  | "sans-semibold";

export interface FontInfo {
  label: string;
  file: string;
  cssFamily: string; // CSS variable name set by next/font/local
  cssWeight: number;
  cssStyle: "normal" | "italic";
  // (ascent - descent) / unitsPerEm – used as CSS line-height so the HTML text
  // box matches the PDF text box exactly.
  lineHeight: number;
  ascent: number; // / unitsPerEm
  descent: number; // / unitsPerEm (negative)
}

export const FONTS: Record<FontKey, FontInfo> = {
  display: { label: "Playfair Display", file: "PlayfairDisplay_600SemiBold.ttf", cssFamily: "var(--font-display)", cssWeight: 600, cssStyle: "normal", lineHeight: 1.333, ascent: 1.082, descent: -0.251 },
  "display-bold": { label: "Playfair Display (qalin)", file: "PlayfairDisplay_700Bold.ttf", cssFamily: "var(--font-display)", cssWeight: 700, cssStyle: "normal", lineHeight: 1.333, ascent: 1.082, descent: -0.251 },
  "display-italic": { label: "Playfair Display (kursiv)", file: "PlayfairDisplay_400Regular_Italic.ttf", cssFamily: "var(--font-display)", cssWeight: 400, cssStyle: "italic", lineHeight: 1.333, ascent: 1.082, descent: -0.251 },
  serif: { label: "Noto Serif", file: "NotoSerif_400Regular.ttf", cssFamily: "var(--font-serif)", cssWeight: 400, cssStyle: "normal", lineHeight: 1.362, ascent: 1.069, descent: -0.293 },
  "serif-bold": { label: "Noto Serif (qalin)", file: "NotoSerif_700Bold.ttf", cssFamily: "var(--font-serif)", cssWeight: 700, cssStyle: "normal", lineHeight: 1.362, ascent: 1.069, descent: -0.293 },
  sans: { label: "Noto Sans", file: "NotoSans_400Regular.ttf", cssFamily: "var(--font-sans)", cssWeight: 400, cssStyle: "normal", lineHeight: 1.362, ascent: 1.069, descent: -0.293 },
  "sans-medium": { label: "Noto Sans (oʻrta)", file: "NotoSans_500Medium.ttf", cssFamily: "var(--font-sans)", cssWeight: 500, cssStyle: "normal", lineHeight: 1.362, ascent: 1.069, descent: -0.293 },
  "sans-semibold": { label: "Noto Sans (qalin)", file: "NotoSans_600SemiBold.ttf", cssFamily: "var(--font-sans)", cssWeight: 600, cssStyle: "normal", lineHeight: 1.362, ascent: 1.069, descent: -0.293 },
};

export const FONT_KEYS = Object.keys(FONTS) as FontKey[];

export interface TextLayer {
  enabled: boolean;
  /** Text with placeholders, e.g. "{full_name}" or "Sana: {date}" */
  text: string;
  x: number; // % of page width – anchor depends on align
  y: number; // % of page height – vertical centre of the text line
  fontSize: number; // points (on an A4 page)
  color: string; // #rrggbb
  align: TextAlign;
  font: FontKey;
  maxWidth: number; // % of page width – text shrinks to fit
  letterSpacing?: number; // points
  uppercase?: boolean;
}

export interface QrLayer {
  enabled: boolean;
  x: number; // % centre
  y: number; // % centre
  size: number; // % of page width
  color: string;
  background: boolean; // draw a white square behind the code
}

export interface ImageLayer {
  enabled: boolean;
  path: string | null; // object path in the "media" bucket
  x: number; // % centre
  y: number; // % centre
  width: number; // % of page width (height follows the image ratio)
  aspect: number; // width / height of the uploaded image
}

export const TEXT_LAYER_KEYS = [
  "name",
  "type",
  "event",
  "description",
  "date",
  "organizer",
  "number",
] as const;
export type TextLayerKey = (typeof TEXT_LAYER_KEYS)[number];

export type TemplateLayout = Record<TextLayerKey, TextLayer> & {
  qr: QrLayer;
  signature: ImageLayer;
};

export const TEXT_LAYER_LABELS: Record<TextLayerKey, string> = {
  name: "Ism-familiya",
  type: "Sertifikat turi",
  event: "Tadbir matni",
  description: "Qoʻshimcha izoh",
  date: "Sana",
  organizer: "Tashkilotchi",
  number: "Sertifikat raqami",
};

export const PLACEHOLDERS: { key: string; label: string }[] = [
  { key: "{full_name}", label: "Ism va familiya" },
  { key: "{first_name}", label: "Ism" },
  { key: "{last_name}", label: "Familiya" },
  { key: "{event}", label: "Tadbir nomi" },
  { key: "{type}", label: "Sertifikat turi" },
  { key: "{date}", label: "Berilgan sana" },
  { key: "{organizer}", label: "Tashkilotchi" },
  { key: "{description}", label: "Qoʻshimcha izoh" },
  { key: "{number}", label: "Sertifikat raqami" },
];

/** Page size in PDF points */
export function pageDimensions(size: PageSize): { width: number; height: number } {
  return size === "A4_PORTRAIT"
    ? { width: 595.28, height: 841.89 }
    : { width: 841.89, height: 595.28 };
}

/** Where the background image goes on the page (never distorted). */
export function backgroundRect(
  page: { width: number; height: number },
  img: { width: number; height: number },
  fit: BackgroundFit,
) {
  const scale =
    fit === "cover"
      ? Math.max(page.width / img.width, page.height / img.height)
      : Math.min(page.width / img.width, page.height / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  return { x: (page.width - w) / 2, y: (page.height - h) / 2, width: w, height: h };
}

export interface CertificateData {
  first_name: string;
  last_name: string;
  event_name: string;
  certificate_type: string;
  issue_date: string; // YYYY-MM-DD
  organizer: string;
  description: string;
  certificate_number: string;
}

const MONTHS_UZ = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

/** 2026-11-13 → "13-noyabr, 2026-yil" */
export function formatDateUz(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return iso || "";
  const [, y, mo, d] = m;
  return `${Number(d)}-${MONTHS_UZ[Number(mo) - 1]}, ${y}-yil`;
}

export function fillPlaceholders(text: string, data: CertificateData): string {
  const full = `${data.first_name} ${data.last_name}`.trim();
  return text
    .replaceAll("{full_name}", full)
    .replaceAll("{first_name}", data.first_name)
    .replaceAll("{last_name}", data.last_name)
    .replaceAll("{event}", data.event_name)
    .replaceAll("{type}", data.certificate_type)
    .replaceAll("{date}", formatDateUz(data.issue_date))
    .replaceAll("{organizer}", data.organizer)
    .replaceAll("{description}", data.description)
    .replaceAll("{number}", data.certificate_number)
    .replace(/\s+/g, " ")
    .trim();
}

/** Text that ends up empty after filling (e.g. "{description}" with no description) is skipped. */
export function layerText(layer: TextLayer, data: CertificateData): string {
  const tokens = layer.text.match(/\{[a-z_]+\}/g) ?? [];
  if (tokens.length > 0 && tokens.every((tok) => fillPlaceholders(tok, data) === "")) return "";
  const t = fillPlaceholders(layer.text, data);
  return layer.uppercase ? t.toLocaleUpperCase("uz") : t;
}

const NAVY = "#0f2044";
const GOLD = "#a8842c";

function text(partial: Partial<TextLayer> & Pick<TextLayer, "text" | "y">): TextLayer {
  return {
    enabled: true,
    x: 50,
    fontSize: 14,
    color: NAVY,
    align: "center",
    font: "serif",
    maxWidth: 70,
    letterSpacing: 0,
    uppercase: false,
    ...partial,
  };
}

/** Layout matching the built-in ZAKOVAT ANDIJON background (public/builtin/zakovat-certificate.jpg). */
export function defaultLayout(): TemplateLayout {
  return {
    name: text({ text: "{full_name}", y: 48.4, fontSize: 44, font: "display", maxWidth: 70 }),
    type: text({ text: "{type}", y: 35.6, fontSize: 13, font: "sans-semibold", color: GOLD, letterSpacing: 2.5, uppercase: true, maxWidth: 50 }),
    event: text({ text: "«{event}» intellektual oʻyinida faol ishtiroki uchun taqdirlanadi.", y: 61, fontSize: 14.5, font: "serif", maxWidth: 66 }),
    description: text({ text: "{description}", y: 66.4, fontSize: 11.5, font: "display-italic", color: "#3d4a66", maxWidth: 62 }),
    date: text({ text: "{date}", x: 24.5, y: 79.8, fontSize: 12, font: "serif-bold", maxWidth: 23 }),
    organizer: text({ text: "{organizer}", x: 75.5, y: 79.8, fontSize: 12, font: "serif-bold", maxWidth: 23 }),
    number: text({ text: "№ {number}", x: 50, y: 92.3, fontSize: 8.5, font: "sans-medium", color: "#3d4a66", letterSpacing: 0.6, maxWidth: 30 }),
    qr: { enabled: true, x: 50, y: 79.4, size: 9.4, color: NAVY, background: true },
    signature: { enabled: false, path: null, x: 75.5, y: 74.5, width: 14, aspect: 3 },
  };
}

/** Merge stored JSON with defaults so templates saved by older versions keep working. */
export function normalizeLayout(raw: unknown): TemplateLayout {
  const base = defaultLayout();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const out = { ...base } as TemplateLayout;
  for (const key of TEXT_LAYER_KEYS) {
    if (r[key] && typeof r[key] === "object") out[key] = { ...base[key], ...(r[key] as Partial<TextLayer>) };
  }
  if (r.qr && typeof r.qr === "object") out.qr = { ...base.qr, ...(r.qr as Partial<QrLayer>) };
  if (r.signature && typeof r.signature === "object")
    out.signature = { ...base.signature, ...(r.signature as Partial<ImageLayer>) };
  return out;
}

export const SAMPLE_DATA: CertificateData = {
  first_name: "Abdulloh",
  last_name: "Aliyev",
  event_name: "Zakovat Andijon kubogi",
  certificate_type: "Ishtirokchi",
  issue_date: new Date().toISOString().slice(0, 10),
  organizer: "Zakovat Andijon",
  description: "",
  certificate_number: "ZA-2026-XXXX-XXXX",
};
