import { VerifyForm } from "./verify-form";
import { VerifyResultView } from "./verify-result";
import { IconShield } from "@/components/site/icons";
import type { VerifyOutcome } from "@/lib/verify";
import { t } from "@/i18n";

export function VerifyLayout({ code, autoScan, result }: { code: string; autoScan?: boolean; result: VerifyOutcome | null }) {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 -z-10 h-80 border-b border-line bg-cream-100">
        <div className="pattern-octagram absolute inset-0 opacity-60" />
      </div>
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-2xl bg-navy-900 text-gold-300 shadow-soft">
              <IconShield className="size-7" />
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold text-navy-900 sm:text-4xl">{t.verify.title}</h1>
              <p className="mt-1 text-[15px] text-muted">{t.verify.intro}</p>
            </div>
          </div>
          <div className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-7">
            <VerifyForm key={code} initialCode={code} autoScan={autoScan && !result} />
          </div>
          {result && <div className="mt-8"><VerifyResultView result={result} query={code} /></div>}
        </div>
      </div>
    </div>
  );
}
