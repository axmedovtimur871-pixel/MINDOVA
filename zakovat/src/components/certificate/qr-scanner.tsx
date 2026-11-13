"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Button } from "@/components/ui/button";
import { IconCamera, IconClose } from "@/components/site/icons";
import { t } from "@/i18n";

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

/** Camera QR scanner: native BarcodeDetector when available, jsQR everywhere else (incl. iPhone). */
export function QrScanner({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const doneRef = useRef(false);

  const finish = useCallback((text: string) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (navigator.vibrate) navigator.vibrate(60);
    onResult(text);
  }, [onResult]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;
    let detector: Detector | null = null;
    const W = window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector };
    if (W.BarcodeDetector) {
      try { detector = new W.BarcodeDetector({ formats: ["qr_code"] }); } catch { detector = null; }
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(t.verify.scanUnsupported);
        setStarting(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (cancelled) return stream.getTracks().forEach((tr) => tr.stop());
        const video = videoRef.current!;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play();
        setStarting(false);
        tick();
      } catch (e) {
        const name = (e as DOMException)?.name;
        setError(name === "NotAllowedError" || name === "SecurityError" ? t.verify.scanDenied : t.verify.scanUnsupported);
        setStarting(false);
      }
    }

    let busy = false;
    async function tick() {
      if (cancelled || doneRef.current) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2 && !busy) {
        busy = true;
        try {
          if (detector) {
            const codes = await detector.detect(video);
            if (codes[0]?.rawValue) return finish(codes[0].rawValue);
          } else {
            const w = video.videoWidth, h = video.videoHeight;
            const scale = Math.min(1, 720 / Math.max(w, h));
            const cw = Math.round(w * scale), ch = Math.round(h * scale);
            const canvas = (canvasRef.current ??= document.createElement("canvas"));
            canvas.width = cw; canvas.height = ch;
            const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
            ctx.drawImage(video, 0, 0, cw, ch);
            const img = ctx.getImageData(0, 0, cw, ch);
            const code = jsQR(img.data, cw, ch, { inversionAttempts: "dontInvert" });
            if (code?.data) return finish(code.data);
          }
        } catch {
          /* keep scanning */
        } finally {
          busy = false;
        }
      }
      raf = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [finish]);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-navy-950">
      <div className="relative aspect-square max-h-[420px] w-full sm:aspect-[4/3]">
        <video ref={videoRef} className="absolute inset-0 size-full object-cover" muted playsInline />
        {!error && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative size-[62%] max-w-[300px] rounded-2xl shadow-[0_0_0_9999px_rgb(8_19_41/0.55)]">
              {["top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl", "right-0 bottom-0 border-r-4 border-b-4 rounded-br-2xl"].map((c) => (
                <span key={c} className={`absolute size-10 border-gold-400 ${c}`} />
              ))}
              <span className="absolute inset-x-4 top-1/2 h-0.5 animate-pulse bg-gold-400/80" />
            </div>
          </div>
        )}
        {(starting || error) && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm leading-6 text-cream-100">
            {error ? <p>{error}</p> : <p className="flex items-center gap-2"><IconCamera className="size-5" /> Kamera ishga tushirilmoqda…</p>}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 bg-navy-900 px-4 py-3">
        <p className="text-sm text-cream-100/80">{t.verify.scanHint}</p>
        <Button variant="light" size="sm" onClick={onClose}>
          <IconClose className="size-4" /> {t.verify.scanStop}
        </Button>
      </div>
    </div>
  );
}

/** Decode a QR code from a photo (fallback when live camera is unavailable). */
export async function decodeQrFromFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(data.data, canvas.width, canvas.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
