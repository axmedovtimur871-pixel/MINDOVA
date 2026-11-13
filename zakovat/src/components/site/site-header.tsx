"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { IconClose, IconMenu, IconShield } from "./icons";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

const NAV = [
  { href: "/", label: t.nav.home },
  { href: "/about", label: t.nav.about },
  { href: "/events", label: t.nav.events },
  { href: "/certificates", label: t.nav.certificates },
  { href: "/verify", label: t.nav.verify },
  { href: "/contact", label: t.nav.contact },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background,border-color,box-shadow] duration-300",
        scrolled ? "border-line bg-cream-50/92 shadow-[0_6px_20px_-16px_rgb(15_32_68/0.5)] backdrop-blur-md" : "border-transparent bg-cream-50",
      )}
    >
      <div className="container-page flex h-[68px] items-center justify-between gap-4">
        <Link href="/" aria-label="ZAKOVAT ANDIJON — bosh sahifa" className="rounded-md">
          <Logo />
        </Link>

        <nav aria-label="Asosiy menyu" className="hidden items-center gap-0.5 lg:flex">
          {NAV.filter((n) => n.href !== "/verify").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "relative rounded-md px-3 py-2 text-[14.5px] font-medium transition-colors",
                isActive(item.href) ? "text-navy-900" : "text-muted hover:text-navy-900",
              )}
            >
              {item.label}
              {isActive(item.href) && <span className="absolute inset-x-3 -bottom-[3px] h-[2px] rounded-full bg-gold-500" />}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/verify"
            className={cn(
              "hidden h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors sm:inline-flex",
              isActive("/verify") ? "bg-gold-500 text-navy-950" : "bg-navy-900 text-cream-50 hover:bg-navy-800",
            )}
          >
            <IconShield className="size-4" />
            {t.nav.verify}
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-lg text-navy-900 hover:bg-navy-50 lg:hidden"
            aria-label={open ? t.nav.close : t.nav.menu}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconClose className="size-6" /> : <IconMenu className="size-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-[68px] bottom-0 z-40 animate-fade bg-cream-50 lg:hidden">
          <nav aria-label="Mobil menyu" className="container-page flex flex-col py-4">
            {NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                style={{ animationDelay: `${i * 35}ms` }}
                className={cn(
                  "flex animate-rise items-center justify-between border-b border-line py-4 font-display text-xl",
                  isActive(item.href) ? "text-gold-600" : "text-navy-900",
                )}
              >
                {item.label}
                <span className="text-gold-500" aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
