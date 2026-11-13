import Link from "next/link";
import { Logo } from "./logo";
import { SocialLinks } from "./social-links";
import type { SiteContent } from "@/lib/content";
import { t } from "@/i18n";

export function SiteFooter({ content }: { content: SiteContent }) {
  const year = new Date().getFullYear();
  const { contact, social, general } = content;
  return (
    <footer className="relative overflow-hidden bg-navy-950 text-cream-100">
      <div className="pattern-octagram pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="container-page relative grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-cream-100/70">{general.tagline}</p>
          <SocialLinks social={social} className="mt-6" />
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">{t.footer.quick}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              ["/about", t.nav.about],
              ["/events", t.nav.events],
              ["/certificates", t.nav.certificates],
              ["/verify", t.nav.verify],
              ["/contact", t.nav.contact],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-cream-100/80 transition-colors hover:text-gold-300">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">{t.contact.title}</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-cream-100/80">
            {contact.address && <li>{contact.address}</li>}
            {contact.phone && (
              <li><a className="hover:text-gold-300" href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}>{contact.phone}</a></li>
            )}
            {contact.email && (
              <li><a className="hover:text-gold-300" href={`mailto:${contact.email}`}>{contact.email}</a></li>
            )}
            {contact.working_hours && <li>{contact.working_hours}</li>}
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-cream-100/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {general.site_name}. {t.footer.rights}</p>
          <p>{general.footer_note}</p>
        </div>
      </div>
    </footer>
  );
}
