import type { Metadata } from "next";
import { VerifyLayout } from "@/components/certificate/verify-layout";
import { verifyCertificate } from "@/lib/verify";
import { t } from "@/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t.verify.title, robots: { index: true } };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ code?: string; scan?: string }> }) {
  const sp = await searchParams;
  const code = (sp.code ?? "").trim().slice(0, 128);
  const result = code ? await verifyCertificate(code, "manual") : null;
  return <VerifyLayout code={code} autoScan={sp.scan === "1"} result={result} />;
}

