import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/site/logo";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin panelga kirish", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/admin") && !sp.next.startsWith("//") ? sp.next : "/admin";
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-950 lg:block">
        <div className="pattern-octagram absolute inset-0 opacity-80" />
        <div className="relative flex h-full flex-col justify-between p-12 text-cream-50">
          <Logo tone="light" />
          <div>
            <p className="font-display text-4xl leading-tight font-semibold">Sertifikatlar va tadbirlarni<br />bir joydan boshqaring.</p>
            <p className="mt-4 max-w-md text-cream-100/70">Ism kiriting → “Yaratish” tugmasini bosing → PDF tayyor. Qolganini tizim oʻzi bajaradi.</p>
          </div>
          <p className="text-sm text-cream-100/50">Faqat vakolatli administratorlar uchun.</p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-cream-50 px-4 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden"><Logo /></Link>
          <h1 className="mt-8 font-display text-3xl font-semibold text-navy-900 lg:mt-0">Admin panelga kirish</h1>
          <p className="mt-2 text-[15px] text-muted">Email va parolingizni kiriting.</p>
          <LoginForm next={next} initialError={sp.error === "no-access" ? "Bu hisobga admin panelga kirish huquqi berilmagan." : null} />
        </div>
      </div>
    </div>
  );
}
