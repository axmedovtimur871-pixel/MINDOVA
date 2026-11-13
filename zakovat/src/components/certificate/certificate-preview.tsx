"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  FONTS,
  TEXT_LAYER_KEYS,
  layerText,
  normalizeLayout,
  pageDimensions,
  type BackgroundFit,
  type CertificateData,
  type PageSize,
  type TextLayerKey,
} from "@/lib/certificates/layout";
import { publicMediaUrl } from "@/lib/env";
import { cn } from "@/lib/cn";

export interface PreviewTemplate {
  background_path: string;
  page_size: PageSize;
  background_fit: BackgroundFit;
  layout: unknown;
}

interface Props {
  template: PreviewTemplate;
  data: CertificateData;
  qrValue: string;
  className?: string;
  /** Template editor: highlight a layer and allow selecting layers by click */
  selected?: string | null;
  onSelect?: (key: string) => void;
  /** Template editor: drag a layer – receives the new centre/anchor in % */
  onMove?: (key: string, x: number, y: number) => void;
  backgroundUrl?: string | null; // local preview of a not-yet-uploaded image
  watermark?: string;
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function CertificatePreview({ template, data, qrValue, className, selected, onSelect, onMove, backgroundUrl, watermark }: Props) {
  const layout = normalizeLayout(template.layout);
  const page = pageDimensions(template.page_size);
  const ptToCqw = (pt: number) => `${(pt / page.width) * 100}cqw`;
  const [qrSvg, setQrSvg] = useState<string>("");
  const [fit, setFit] = useState<Record<string, number>>({});
  const spans = useRef<Record<string, HTMLSpanElement | null>>({});
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    if (!layout.qr.enabled) return;
    QRCode.toString(qrValue, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: layout.qr.background ? 2 : 0,
      color: { dark: layout.qr.color || "#0f2044", light: layout.qr.background ? "#ffffff" : "#00000000" },
    }).then((svg) => alive && setQrSvg(svg));
    return () => {
      alive = false;
    };
  }, [qrValue, layout.qr.enabled, layout.qr.background, layout.qr.color]);

  // Shrink-to-fit exactly like the PDF renderer (ratio is independent of the preview width).
  const texts = TEXT_LAYER_KEYS.map((k) => [k, layout[k].enabled ? layerText(layout[k], data) : ""] as const);
  const fitKey = JSON.stringify([texts, TEXT_LAYER_KEYS.map((k) => [layout[k].font, layout[k].fontSize, layout[k].maxWidth, layout[k].letterSpacing])]);
  useIsoLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      const root = rootRef.current;
      if (!root || cancelled) return;
      const width = root.clientWidth;
      const next: Record<string, number> = {};
      for (const key of TEXT_LAYER_KEYS) {
        const el = spans.current[key];
        if (!el) continue;
        const natural = el.scrollWidth / (fit[key] ?? 1);
        const max = (layout[key].maxWidth / 100) * width;
        next[key] = natural > max && natural > 0 ? Math.max(6 / layout[key].fontSize, max / natural) : 1;
      }
      setFit((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    measure();
    if (typeof document !== "undefined" && document.fonts) document.fonts.ready.then(measure);
    return () => {
      cancelled = true;
    };
  }, [fitKey]);

  function startDrag(e: React.PointerEvent, key: string, x: number, y: number) {
    onSelect?.(key);
    if (!onMove || !rootRef.current) return;
    e.preventDefault();
    const rect = rootRef.current.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const move = (ev: PointerEvent) => {
      const nx = Math.round((x + ((ev.clientX - sx) / rect.width) * 100) * 10) / 10;
      const ny = Math.round((y + ((ev.clientY - sy) / rect.height) * 100) * 10) / 10;
      onMove(key, Math.min(100, Math.max(0, nx)), Math.min(100, Math.max(0, ny)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const bg = backgroundUrl ?? publicMediaUrl(template.background_path);

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full overflow-hidden bg-cream-100 select-none", className)}
      style={{ aspectRatio: `${page.width} / ${page.height}`, containerType: "inline-size" }}
    >
      {bg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bg}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full"
          style={{ objectFit: template.background_fit }}
        />
      )}

      {layout.signature.enabled && layout.signature.path && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={publicMediaUrl(layout.signature.path) ?? ""}
          alt=""
          draggable={false}
          onPointerDown={onSelect || onMove ? (e) => startDrag(e, "signature", layout.signature.x, layout.signature.y) : undefined}
          className={cn("absolute", onSelect && "cursor-move", selected === "signature" && "outline-2 outline-dashed outline-gold-500")}
          style={{
            touchAction: onMove ? "none" : undefined,
            left: `${layout.signature.x}%`,
            top: `${layout.signature.y}%`,
            width: `${layout.signature.width}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {texts.map(([key, text]) => {
        if (!text) return null;
        const l = layout[key as TextLayerKey];
        const f = FONTS[l.font] ?? FONTS.serif;
        const scale = fit[key] ?? 1;
        const tx = l.align === "center" ? "-50%" : l.align === "right" ? "-100%" : "0";
        return (
          <span
            key={key}
            ref={(el) => {
              spans.current[key] = el;
            }}
            onPointerDown={onSelect || onMove ? (e) => startDrag(e, key, l.x, l.y) : undefined}
            className={cn(
              "absolute whitespace-nowrap",
              onSelect && "cursor-move hover:outline-1 hover:outline-dashed hover:outline-gold-400",
              selected === key && "outline-2 outline-dashed outline-gold-500",
            )}
            style={{
              left: `${l.x}%`,
              top: `${l.y}%`,
              transform: `translate(${tx}, -50%)`,
              fontFamily: f.cssFamily,
              fontWeight: f.cssWeight,
              fontStyle: f.cssStyle,
              fontSize: ptToCqw(l.fontSize * scale),
              lineHeight: f.lineHeight,
              letterSpacing: l.letterSpacing ? ptToCqw(l.letterSpacing * scale) : undefined,
              color: l.color,
              textAlign: l.align,
              fontKerning: "normal",
              touchAction: onMove ? "none" : undefined,
            }}
          >
            {text}
          </span>
        );
      })}

      {layout.qr.enabled && (
        <div
          onPointerDown={onSelect || onMove ? (e) => startDrag(e, "qr", layout.qr.x, layout.qr.y) : undefined}
          className={cn("absolute [&>svg]:size-full", onSelect && "cursor-move", selected === "qr" && "outline-2 outline-dashed outline-gold-500")}
          style={{
            touchAction: onMove ? "none" : undefined,
            left: `${layout.qr.x}%`,
            top: `${layout.qr.y}%`,
            width: `${layout.qr.size}%`,
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
          }}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      )}

      {watermark && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span
            className="rotate-[-18deg] rounded border-2 border-danger-700/50 px-4 py-1 font-sans font-bold uppercase tracking-[0.3em] text-danger-700/50"
            style={{ fontSize: "5cqw" }}
          >
            {watermark}
          </span>
        </div>
      )}
    </div>
  );
}
