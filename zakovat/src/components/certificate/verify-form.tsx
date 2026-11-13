"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { IconCamera, IconQr, IconSearch } from "@/components/site/icons";
import { QrScanner, decodeQrFromFile } from "./qr-scanner";
import { t } from "@/i18n";

/** Extract a token from a scanned QR text: our /verify/<token> URL, or a plain certificate number. */
function parseScanned(text: string): { kind: "token" | "code"; value: string } | null {
  const s = text.trim();
  try {
    const url = new URL(s);
    const m = /\/verify\/([A-Za-z0-9_-]{16,128})\/?$/.exec(url.pathname);
    if (m) return { kind: "token", value: m[1] };
    return null;
  } catch {
    /* not a URL */
  }
  if (/^ZA-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(s)) return { kind: "code", value: s.toUpperCase() };
  return null;
}

export function VerifyForm({ initialCode = "", autoScan = false }: { initialCode?: string; autoScan?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(autoScan);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function go(target: string) {
    startTransition(() => router.push(target));
  }

  function handleScanned(text: string) {
    setScanning(false);
    const parsed = parseScanned(text);
    if (!parsed) return setError(t.verify.scanForeign);
    setError(null);
    if (parsed.kind === "token") go(`/verify/${parsed.value}`);
    else {
      setCode(parsed.value);
      go(`/verify?code=${encodeURIComponent(parsed.value)}`);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = code.trim();
          if (!value) return setError(t.verify.empty);
          setError(null);
          const parsed = parseScanned(value);
          if (parsed?.kind === "token") return go(`/verify/${parsed.value}`);
          go(`/verify?code=${encodeURIComponent(value)}`);
        }}
      >
        <label htmlFor="verify-code" className="text-sm font-semibold text-navy-900">{t.verify.label}</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
            <input
              id="verify-code"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(null); }}
              placeholder={t.verify.placeholder}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              inputMode="text"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "verify-error" : undefined}
              className="h-14 w-full rounded-xl border border-line bg-white pr-4 pl-12 font-mono text-base tracking-wider text-ink placeholder:font-sans placeholder:tracking-normal focus:border-gold-500 focus:ring-3 focus:ring-gold-300/40 focus:outline-none"
            />
          </div>
          <Button type="submit" size="lg" className="h-14" loading={pending}>
            {pending ? t.verify.checking : t.verify.submit}
          </Button>
        </div>
        {error && <p id="verify-error" role="alert" className="mt-2 text-sm text-danger-700">{error}</p>}
      </form>

      {scanning ? (
        <QrScanner onResult={handleScanned} onClose={() => setScanning(false)} />
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="lg" className="flex-1" onClick={() => { setError(null); setScanning(true); }}>
            <IconQr className="size-5" /> {t.verify.scan}
          </Button>
          <Button variant="ghost" size="lg" className="flex-1" onClick={() => fileRef.current?.click()}>
            <IconCamera className="size-5" /> Rasmdan skanerlash
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const text = await decodeQrFromFile(file).catch(() => null);
              if (!text) return setError("Rasmda QR kod topilmadi. Aniqroq rasm oling yoki raqamni qoʻlda kiriting.");
              handleScanned(text);
            }}
          />
        </div>
      )}
    </div>
  );
}
