import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFString, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import {
  FONTS,
  TEXT_LAYER_KEYS,
  backgroundRect,
  layerText,
  normalizeLayout,
  pageDimensions,
  type BackgroundFit,
  type CertificateData,
  type FontKey,
  type PageSize,
  type TextLayer,
} from "./layout";
import { SITE_URL, SUPABASE_URL } from "@/lib/env";

export interface RenderTemplate {
  background_path: string;
  background_width: number;
  background_height: number;
  page_size: PageSize;
  background_fit: BackgroundFit;
  layout: unknown;
}

const PUBLIC_DIR = path.join(process.cwd(), "public");
const fontCache = new Map<string, Uint8Array>();
const imageCache = new Map<string, { bytes: Uint8Array; at: number }>();
const IMAGE_CACHE_MS = 5 * 60 * 1000;

/**
 * Reads a file shipped in /public. On a normal Node server it is on disk; on
 * serverless hosts (Netlify) /public lives on the CDN, so fall back to HTTP.
 */
async function readPublicFile(relPath: string): Promise<Uint8Array> {
  const safe = path.posix.normalize(relPath).replace(/^(\.\.(\/|$))+/, "").replace(/^\/+/, "");
  try {
    return new Uint8Array(await readFile(path.join(PUBLIC_DIR, safe)));
  } catch {
    const base = (process.env.URL || process.env.DEPLOY_PRIME_URL || SITE_URL).replace(/\/+$/, "");
    const res = await fetch(`${base}/${safe}`, { cache: "force-cache" });
    if (!res.ok) throw new Error(`Faylni yuklab boʻlmadi: /${safe} (${res.status})`);
    return new Uint8Array(await res.arrayBuffer());
  }
}

async function fontBytes(file: string): Promise<Uint8Array> {
  let b = fontCache.get(file);
  if (!b) {
    b = await readPublicFile(`fonts/${file}`);
    fontCache.set(file, b);
  }
  return b;
}

/** Loads a template image: "builtin/…" from /public, anything else from the public "media" bucket. */
export async function loadMediaBytes(storagePath: string): Promise<Uint8Array> {
  const cached = imageCache.get(storagePath);
  if (cached && Date.now() - cached.at < IMAGE_CACHE_MS) return cached.bytes;
  let bytes: Uint8Array;
  if (storagePath.startsWith("builtin/")) {
    bytes = await readPublicFile(storagePath);
  } else {
    const url = `${SUPABASE_URL}/storage/v1/object/public/media/${storagePath.split("/").map(encodeURIComponent).join("/")}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Shablon rasmini yuklab boʻlmadi (${res.status}).`);
    bytes = new Uint8Array(await res.arrayBuffer());
  }
  imageCache.set(storagePath, { bytes, at: Date.now() });
  return bytes;
}

export function clearMediaCache(storagePath?: string) {
  if (storagePath) imageCache.delete(storagePath);
  else imageCache.clear();
}

function isPng(b: Uint8Array) {
  return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
}
function isJpeg(b: Uint8Array) {
  return b[0] === 0xff && b[1] === 0xd8;
}

async function embedImage(doc: PDFDocument, bytes: Uint8Array): Promise<PDFImage> {
  if (isPng(bytes)) return doc.embedPng(bytes);
  if (isJpeg(bytes)) return doc.embedJpg(bytes);
  throw new Error("Faqat PNG yoki JPG rasmlar qoʻllab-quvvatlanadi.");
}

function hexToRgb(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0x0f2044;
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** Replace characters the font cannot draw with close equivalents instead of failing. */
function safeText(font: PDFFont, text: string): string {
  const supported = new Set(font.getCharacterSet());
  const fallback: Record<string, string> = { "\u02BB": "\u2018", "\u02BC": "\u2019", "`": "\u2018" };
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (supported.has(cp)) out += ch;
    else if (fallback[ch] && supported.has(fallback[ch].codePointAt(0)!)) out += fallback[ch];
    else if (ch.trim() === "") out += " ";
    else out += "?";
  }
  return out;
}

function textWidth(font: PDFFont, text: string, size: number, letterSpacing: number) {
  const chars = [...text].length;
  return font.widthOfTextAtSize(text, size) + Math.max(0, chars - 1) * letterSpacing;
}

function drawTextLayer(
  pdfPage: PDFPage,
  font: PDFFont,
  layer: TextLayer,
  raw: string,
  page: { width: number; height: number },
) {
  const text = safeText(font, raw);
  if (!text) return;
  const info = FONTS[layer.font] ?? FONTS.serif;
  const maxW = (layer.maxWidth / 100) * page.width;
  const spacing = layer.letterSpacing ?? 0;
  let size = layer.fontSize;
  const natural = textWidth(font, text, size, spacing);
  if (natural > maxW && natural > 0) size = Math.max(6, size * (maxW / natural));
  const spacingScaled = spacing * (size / layer.fontSize);
  const width = textWidth(font, text, size, spacingScaled);

  const anchorX = (layer.x / 100) * page.width;
  let x = anchorX;
  if (layer.align === "center") x = anchorX - width / 2;
  else if (layer.align === "right") x = anchorX - width;

  // y is the vertical centre of the text box (ascent→descent) measured from the top
  const centreFromTop = (layer.y / 100) * page.height;
  const baselineFromTop = centreFromTop + ((info.ascent + info.descent) / 2) * size;
  const y = page.height - baselineFromTop;
  const color = hexToRgb(layer.color);

  if (!spacingScaled) {
    pdfPage.drawText(text, { x, y, size, font, color });
    return;
  }
  let cx = x;
  for (const ch of text) {
    pdfPage.drawText(ch, { x: cx, y, size, font, color });
    cx += font.widthOfTextAtSize(ch, size) + spacingScaled;
  }
}

export interface RenderOptions {
  verifyUrl: string;
  title?: string;
}

/** Builds a real, vector PDF: background image + text layers + QR code. */
export async function renderCertificatePdf(
  template: RenderTemplate,
  data: CertificateData,
  options: RenderOptions,
): Promise<Uint8Array> {
  const layout = normalizeLayout(template.layout);
  const page = pageDimensions(template.page_size);

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const fullName = `${data.first_name} ${data.last_name}`.trim();
  doc.setTitle(options.title ?? `Sertifikat — ${fullName}`);
  doc.setAuthor(data.organizer || "Zakovat Andijon");
  doc.setSubject(`${data.event_name} · ${data.certificate_number}`);
  doc.setKeywords(["sertifikat", "Zakovat Andijon", data.certificate_number]);
  doc.setCreator("Zakovat Andijon sertifikat tizimi");
  doc.setProducer("Zakovat Andijon");
  doc.setCreationDate(new Date());

  const pdfPage = doc.addPage([page.width, page.height]);

  // Cream base so "contain" templates have a clean margin instead of white gaps.
  pdfPage.drawRectangle({ x: 0, y: 0, width: page.width, height: page.height, color: rgb(0.984, 0.969, 0.933) });

  const bg = await embedImage(doc, await loadMediaBytes(template.background_path));
  const rect = backgroundRect(page, { width: bg.width, height: bg.height }, template.background_fit);
  // drawImage with a rect larger than the page simply gets clipped by the page box (cover).
  pdfPage.drawImage(bg, { x: rect.x, y: page.height - rect.y - rect.height, width: rect.width, height: rect.height });

  // Signature image
  const sig = layout.signature;
  if (sig.enabled && sig.path) {
    try {
      const img = await embedImage(doc, await loadMediaBytes(sig.path));
      const w = (sig.width / 100) * page.width;
      const h = w * (img.height / img.width);
      const cx = (sig.x / 100) * page.width;
      const cy = (sig.y / 100) * page.height;
      pdfPage.drawImage(img, { x: cx - w / 2, y: page.height - cy - h / 2, width: w, height: h });
    } catch {
      // A missing signature must not block certificate generation.
    }
  }

  // Text layers
  const fonts = new Map<FontKey, PDFFont>();
  for (const key of TEXT_LAYER_KEYS) {
    const layer = layout[key];
    if (!layer.enabled) continue;
    const text = layerText(layer, data);
    if (!text) continue;
    const fontKey = FONTS[layer.font] ? layer.font : "serif";
    let font = fonts.get(fontKey);
    if (!font) {
      font = await doc.embedFont(await fontBytes(FONTS[fontKey].file), { subset: true });
      fonts.set(fontKey, font);
    }
    drawTextLayer(pdfPage, font, layer, text, page);
  }

  // QR code (high resolution PNG, error correction M)
  const qr = layout.qr;
  if (qr.enabled) {
    const size = (qr.size / 100) * page.width;
    const png = await QRCode.toBuffer(options.verifyUrl, {
      errorCorrectionLevel: "M",
      margin: qr.background ? 2 : 0,
      width: 1024,
      color: { dark: qr.color || "#0f2044", light: qr.background ? "#ffffff" : "#00000000" },
    });
    const img = await doc.embedPng(new Uint8Array(png));
    const cx = (qr.x / 100) * page.width;
    const cy = (qr.y / 100) * page.height;
    pdfPage.drawImage(img, { x: cx - size / 2, y: page.height - cy - size / 2, width: size, height: size });
    pdfPage.node.addAnnot(
      doc.context.register(
        doc.context.obj({
          Type: "Annot",
          Subtype: "Link",
          Rect: [cx - size / 2, page.height - cy - size / 2, cx + size / 2, page.height - cy + size / 2],
          Border: [0, 0, 0],
          A: { Type: "Action", S: "URI", URI: PDFString.of(options.verifyUrl) },
        }),
      ),
    );
  }

  return doc.save();
}
