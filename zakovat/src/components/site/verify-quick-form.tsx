"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconQr, IconSearch } from "./icons";
import { t } from "@/i18n";

export function VerifyQuickForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        const value = code.trim();
        if (!value) return setError(t.verify.empty);
        setPending(true);
        router.push(`/verify?code=${encodeURIComponent(value)}`);
      }}
    >
      <label htmlFor="quick-code" className="text-sm font-semibold text-navy-900">{t.verify.label}</label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
          <input
            id="quick-code"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
            placeholder={t.verify.placeholder}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "quick-code-error" : undefined}
            className="h-13 w-full rounded-xl border border-line bg-white pr-4 pl-11 font-mono text-[15px] tracking-wider text-ink uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case focus:border-gold-500 focus:ring-3 focus:ring-gold-300/40 focus:outline-none"
          />
        </div>
        <Button type="submit" size="lg" loading={pending}>{t.verify.submit}</Button>
      </div>
      {error && <p id="quick-code-error" className="mt-2 text-sm text-danger-700">{error}</p>}
      <button type="button" onClick={() => router.push("/verify?scan=1")} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-navy-800 hover:text-gold-600">
        <IconQr className="size-4" /> {t.verify.scan}
      </button>
    </form>
  );
}
