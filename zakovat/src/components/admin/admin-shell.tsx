"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/site/logo";
import { IconClose, IconMenu } from "@/components/site/icons";
import { ToastProvider } from "@/components/ui/toast";
import { getBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/cn";
import type { AdminRole } from "@/lib/types";
import {
  ICalendar, IDashboard, IEye, IGlobe, IList, ILogout, IPlus, ISettings, IStack, ITemplate, IUsers,
} from "./admin-icons";

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Bosh administrator",
  admin: "Administrator",
  certificate_manager: "Sertifikat menejeri",
};

const NAV: { href: string; label: string; Icon: (p: { className?: string }) => React.ReactNode; roles?: AdminRole[]; exact?: boolean }[] = [
  { href: "/admin", label: "Bosh panel", Icon: IDashboard, exact: true },
  { href: "/admin/certificates/new", label: "Sertifikat yaratish", Icon: IPlus },
  { href: "/admin/certificates/bulk", label: "Ommaviy yaratish", Icon: IStack },
  { href: "/admin/certificates", label: "Barcha sertifikatlar", Icon: IList, exact: true },
  { href: "/admin/templates", label: "Sertifikat shablonlari", Icon: ITemplate, roles: ["super_admin", "admin"] },
  { href: "/admin/events", label: "Tadbirlar", Icon: ICalendar, roles: ["super_admin", "admin"] },
  { href: "/admin/logs", label: "Tekshiruvlar tarixi", Icon: IEye },
  { href: "/admin/users", label: "Foydalanuvchilar", Icon: IUsers, roles: ["super_admin", "admin"] },
  { href: "/admin/settings", label: "Sozlamalar", Icon: ISettings },
];

export function AdminShell({ admin, children }: { admin: { fullName: string; email: string; role: AdminRole }; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const items = NAV.filter((n) => !n.roles || n.roles.includes(admin.role));
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  // "/admin/certificates" must not light up for /new or /bulk, but should for a detail page
  const active = (n: (typeof NAV)[number]) =>
    n.href === "/admin/certificates"
      ? pathname === n.href || (/^\/admin\/certificates\/[^/]+$/.test(pathname) && !/\/(new|bulk)$/.test(pathname))
      : isActive(n.href, n.exact);

  async function signOut() {
    setSigningOut(true);
    await getBrowserClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/admin" aria-label="Bosh panel"><Logo tone="light" /></Link>
        <button className="grid size-10 place-items-center rounded-lg text-cream-100 lg:hidden" onClick={() => setOpen(false)} aria-label="Menyuni yopish">
          <IconClose className="size-5" />
        </button>
      </div>
      <nav aria-label="Admin menyu" className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3">
        {items.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active(n) ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14.5px] font-medium transition-colors",
              active(n) ? "bg-white/10 text-white shadow-[inset_3px_0_0_var(--color-gold-400)]" : "text-cream-100/70 hover:bg-white/5 hover:text-white",
            )}
          >
            <n.Icon className={cn("size-5", active(n) ? "text-gold-400" : "")} />
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 p-3">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-cream-100/70 hover:bg-white/5 hover:text-white">
          <IGlobe className="size-5" /> Saytni ochish
        </Link>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-500 text-sm font-bold text-navy-950">
            {(admin.fullName || admin.email).slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{admin.fullName || admin.email}</p>
            <p className="truncate text-xs text-gold-300">{ROLE_LABELS[admin.role]}</p>
          </div>
          <button onClick={signOut} disabled={signingOut} className="grid size-9 place-items-center rounded-lg text-cream-100/70 hover:bg-white/10 hover:text-white" aria-label="Chiqish" title="Chiqish">
            <ILogout className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-[#f6f3ec]">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-navy-950 lg:block">{sidebar}</aside>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 animate-fade bg-navy-950/60" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-rise bg-navy-950">{sidebar}</aside>
          </div>
        )}
        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
            <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-lg text-navy-900 hover:bg-cream-100" aria-label="Menyuni ochish">
              <IconMenu className="size-6" />
            </button>
            <Logo compact />
            <span className="font-display font-semibold text-navy-900">Admin panel</span>
          </header>
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}

export function PageTitle({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[1.75rem] leading-tight font-semibold text-navy-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[15px] leading-6 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
