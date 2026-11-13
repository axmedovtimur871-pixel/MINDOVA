import Link from "next/link";
import { LogoMark } from "@/components/site/logo";
import { buttonClass } from "@/components/ui/button";
import { t } from "@/i18n";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-cream-50 px-4">
      <div className="text-center">
        <LogoMark className="mx-auto size-16" />
        <p className="mt-6 font-display text-6xl font-semibold text-gold-500">404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-navy-900">{t.common.notFoundTitle}</h1>
        <p className="mt-2 text-muted">{t.common.notFoundText}</p>
        <Link href="/" className={buttonClass("primary", "md", "mt-8")}>{t.common.backHome}</Link>
      </div>
    </div>
  );
}
