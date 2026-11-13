import type { Metadata } from "next";
import { VerifyLayout } from "@/components/certificate/verify-layout";
import { verifyCertificate } from "@/lib/verify";
import { t } from "@/i18n";

export const dynamic = "force-dynamic";
// Personal data – keep individual verification pages out of search engines.
export const metadata: Metadata = { title: t.verify.title, robots: { index: false, follow: false } };

export default async function VerifyTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const token = decodeURIComponent((await params).token).slice(0, 128);
  const result = await verifyCertificate(token, "qr");
  return <VerifyLayout code="" result={result} />;
}
