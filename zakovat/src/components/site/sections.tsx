import Link from "next/link";
import Image from "next/image";
import { LinkButton } from "@/components/ui/button";
import { HeroCertificate } from "./hero-certificate";
import { VerifyQuickForm } from "./verify-quick-form";
import { SocialLinks } from "./social-links";
import { IconArrowRight, IconCalendar, IconClock, IconMail, IconPhone, IconPin, IconQr, IconShield } from "./icons";
import type { SiteContent } from "@/lib/content";
import type { EventRow } from "@/lib/types";
import { dateBadge, formatDateTime, formatNumber } from "@/lib/format";
import { publicMediaUrl } from "@/lib/env";
import { cn } from "@/lib/cn";
import { t } from "@/i18n";

export function SectionHeading({ eyebrow, title, intro, align = "left", tone = "dark" }: {
  eyebrow?: string; title: string; intro?: string; align?: "left" | "center"; tone?: "dark" | "light";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <p className={cn("eyebrow", align === "center" && "justify-center")}>{eyebrow}</p>}
      <h2 className={cn("mt-3 font-display text-3xl font-semibold tracking-tight sm:text-[2.6rem] sm:leading-[1.12]", tone === "dark" ? "text-navy-900" : "text-cream-50")}>
        {title}
      </h2>
      {intro && <p className={cn("mt-4 text-base leading-7", tone === "dark" ? "text-muted" : "text-cream-100/75")}>{intro}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow?: string; title: string; intro?: string }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-cream-100">
      <div className="pattern-octagram pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="container-page relative py-14 sm:py-20">
        {eyebrow && <p className="eyebrow animate-rise">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl animate-rise font-display text-4xl font-semibold tracking-tight text-navy-900 [animation-delay:60ms] sm:text-5xl">
          {title}
        </h1>
        {intro && <p className="mt-4 max-w-2xl animate-rise text-base leading-7 text-muted [animation-delay:120ms] sm:text-lg">{intro}</p>}
      </div>
    </section>
  );
}

export function HeroSection({ hero }: { hero: SiteContent["hero"] }) {
  const image = publicMediaUrl(hero.image_path);
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 text-cream-50">
      <div className="pattern-octagram pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 right-[-10%] -z-10 size-[620px] rounded-full bg-[radial-gradient(circle,rgb(194_154_62/0.22),transparent_65%)]"
        aria-hidden="true"
      />
      <div className="container-page relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
        <div>
          <p className="inline-flex animate-rise items-center gap-2 rounded-full border border-gold-500/35 bg-gold-500/10 px-3.5 py-1 text-xs font-semibold tracking-[0.18em] text-gold-300 uppercase">
            <span className="size-1.5 rounded-full bg-gold-400" />
            {hero.eyebrow}
          </p>
          <h1 className="mt-6 animate-rise font-display text-[2.7rem] leading-[1.02] font-bold tracking-[0.01em] [animation-delay:60ms] sm:text-6xl lg:text-[4.4rem]">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-xl animate-rise font-display text-xl text-gold-300 italic [animation-delay:120ms] sm:text-2xl">
            {hero.slogan}
          </p>
          <p className="mt-5 max-w-lg animate-rise text-[15.5px] leading-7 text-cream-100/75 [animation-delay:180ms] sm:text-base">
            {hero.intro}
          </p>
          <div className="mt-9 flex animate-rise flex-col gap-3 [animation-delay:240ms] sm:flex-row">
            <LinkButton href="/events" variant="gold" size="lg">
              {t.hero.ctaEvents}
              <IconArrowRight className="size-5" />
            </LinkButton>
            <LinkButton href="/verify" variant="light" size="lg">
              <IconShield className="size-5" />
              {t.hero.ctaVerify}
            </LinkButton>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl animate-rise [animation-delay:200ms]">
          {image ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-gold-500/30">
              <Image src={image} alt="" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" priority />
            </div>
          ) : (
            <HeroCertificate />
          )}
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
    </section>
  );
}

export function AboutSection({ about }: { about: SiteContent["about"] }) {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <SectionHeading eyebrow={t.nav.about} title={about.title} />
          <p className="mt-6 font-display text-xl leading-8 text-navy-800 italic">{about.lead}</p>
        </div>
        <div>
          <div className="space-y-4 text-[15.5px] leading-7 text-muted">
            {about.body.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {about.values.length > 0 && (
            <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
              {about.values.map((v, i) => (
                <div key={i} className="bg-white p-5">
                  <dt className="flex items-baseline gap-2">
                    <span className="font-display text-sm text-gold-600">{["I", "II", "III", "IV", "V", "VI"][i] ?? i + 1}</span>
                    <span className="font-display text-lg font-semibold text-navy-900">{v.title}</span>
                  </dt>
                  <dd className="mt-2 text-sm leading-6 text-muted">{v.text}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}

export function ActivitiesSection({ activities }: { activities: SiteContent["activities"] }) {
  if (activities.items.length === 0) return null;
  return (
    <section className="border-y border-line bg-cream-100 py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading eyebrow="Yoʻnalishlar" title={activities.title} intro={activities.intro} />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {activities.items.map((item, i) => (
            <li
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-line bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold-400 hover:shadow-lift"
            >
              <span className="font-display text-4xl font-semibold text-gold-500/80 transition-colors group-hover:text-gold-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold text-navy-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
              <span className="absolute inset-x-6 bottom-0 h-[2px] origin-left scale-x-0 bg-gold-500 transition-transform duration-300 group-hover:scale-x-100" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function EventCard({ event }: { event: EventRow }) {
  const badge = event.starts_at ? dateBadge(event.starts_at) : null;
  const cover = publicMediaUrl(event.cover_image_path);
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-300 hover:-translate-y-1 hover:border-gold-400 hover:shadow-lift"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-navy-900">
        {cover ? (
          <Image src={cover} alt="" fill sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="pattern-octagram absolute inset-0 opacity-90" />
        )}
        {badge && (
          <div className="absolute top-4 left-4 flex flex-col items-center rounded-xl bg-cream-50 px-3 py-2 text-center shadow-soft">
            <span className="font-display text-2xl leading-none font-bold text-navy-900">{badge.day}</span>
            <span className="mt-1 text-[11px] font-semibold tracking-[0.15em] text-gold-600 uppercase">{badge.month}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl leading-snug font-semibold text-navy-900">{event.title}</h3>
        {event.summary && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{event.summary}</p>}
        <div className="mt-auto space-y-1.5 pt-5 text-[13px] text-muted">
          <p className="flex items-center gap-2">
            <IconCalendar className="size-4 text-gold-600" />
            {event.starts_at ? formatDateTime(event.starts_at) : t.events.tba}
          </p>
          {event.location && (
            <p className="flex items-center gap-2">
              <IconPin className="size-4 text-gold-600" />
              {event.location}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function UpcomingEventsSection({ events }: { events: EventRow[] }) {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading eyebrow={t.nav.events} title={t.home.upcoming} />
          <Link href="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-navy-800 hover:text-gold-600">
            {t.home.allEvents} <IconArrowRight className="size-4" />
          </Link>
        </div>
        {events.length > 0 ? (
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, 3).map((e) => (
              <li key={e.id}><EventCard event={e} /></li>
            ))}
          </ul>
        ) : (
          <div className="mt-12 flex items-center gap-4 rounded-2xl border border-dashed border-gold-400/70 bg-gold-50/60 p-6 text-sm leading-6 text-navy-800">
            <IconCalendar className="size-7 shrink-0 text-gold-600" />
            {t.home.upcomingEmpty}
          </div>
        )}
      </div>
    </section>
  );
}

export function StatsSection({ stats, computed }: { stats: SiteContent["stats"]; computed: { events: number; certificates: number } }) {
  const items: { value: string; label: string }[] = [];
  if (stats.show_computed) {
    if (computed.events > 0) items.push({ value: formatNumber(computed.events), label: t.home.statEvents });
    if (computed.certificates > 0) items.push({ value: formatNumber(computed.certificates), label: t.home.statCertificates });
  }
  for (const s of stats.items) if (s.value?.trim() && s.label?.trim()) items.push(s);
  if (items.length === 0) return null;
  return (
    <section className="relative overflow-hidden bg-navy-900 py-16 text-cream-50">
      <div className="pattern-octagram pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="container-page relative">
        <h2 className="sr-only">{stats.title}</h2>
        <dl className="flex flex-wrap justify-center gap-x-16 gap-y-10 text-center">
          {items.map((s, i) => (
            <div key={i} className="flex min-w-36 flex-col-reverse items-center">
              <dt className="mt-2 text-sm text-cream-100/70">{s.label}</dt>
              <dd className="font-display text-5xl font-semibold text-gold-300">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function VerifyCtaSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-3xl border border-gold-400/50 bg-gradient-to-br from-gold-50 via-cream-50 to-cream-100 p-7 sm:p-12">
          <div className="pointer-events-none absolute -right-16 -bottom-16 size-72 opacity-[0.08]" aria-hidden="true">
            <IconQr className="size-full text-navy-900" />
          </div>
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="eyebrow">{t.nav.verify}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-navy-900 sm:text-4xl">{t.home.verifyTitle}</h2>
              <p className="mt-3 max-w-lg text-[15.5px] leading-7 text-muted">{t.home.verifyText}</p>
            </div>
            <VerifyQuickForm />
          </div>
        </div>
      </div>
    </section>
  );
}

export function GallerySection({ gallery, showEmpty = true }: { gallery: SiteContent["gallery"]; showEmpty?: boolean }) {
  const items = gallery.items.filter((g) => g.path);
  if (items.length === 0 && !showEmpty) return null;
  return (
    <section className="border-t border-line bg-cream-100 py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading eyebrow="Lavhalar" title={gallery.title} intro={gallery.intro} />
        {items.length > 0 ? (
          <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {items.map((g, i) => (
              <li key={i} className={cn("group relative overflow-hidden rounded-xl bg-navy-100", i % 5 === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square")}>
                <Image src={publicMediaUrl(g.path)!} alt={g.caption || ""} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                {g.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/80 to-transparent p-3 pt-8 text-sm text-cream-50 opacity-0 transition-opacity group-hover:opacity-100">
                    {g.caption}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-label={t.home.galleryEmpty}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="pattern-octagram grid aspect-square place-items-center rounded-xl border border-line bg-white/60">
                {i === 0 && <span className="px-4 text-center text-sm text-muted">{t.home.galleryEmpty}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function ContactSection({ contact, social }: { contact: SiteContent["contact"]; social: SiteContent["social"] }) {
  const rows = [
    { Icon: IconPin, label: t.contact.address, value: contact.address, href: contact.map_url || undefined },
    { Icon: IconPhone, label: t.contact.phone, value: contact.phone, href: contact.phone ? `tel:${contact.phone.replace(/[^+\d]/g, "")}` : undefined },
    { Icon: IconMail, label: t.contact.email, value: contact.email, href: contact.email ? `mailto:${contact.email}` : undefined },
    { Icon: IconClock, label: t.contact.hours, value: contact.working_hours },
  ].filter((r) => r.value);
  return (
    <section className="py-20 sm:py-28">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <SectionHeading eyebrow={t.nav.contact} title={contact.title} intro={contact.intro} />
        <div className="rounded-2xl border border-line bg-white p-6 shadow-soft sm:p-8">
          <ul className="divide-y divide-line">
            {rows.map(({ Icon, label, value, href }) => (
              <li key={label} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-50 text-gold-600 ring-1 ring-gold-300/60">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">{label}</p>
                  {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="mt-0.5 block break-words text-[15.5px] font-medium text-navy-900 hover:text-gold-600">
                      {value}
                    </a>
                  ) : (
                    <p className="mt-0.5 text-[15.5px] font-medium text-navy-900">{value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {(social.telegram || social.instagram || social.youtube || social.facebook) && (
            <div className="mt-6 border-t border-line pt-6">
              <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-muted uppercase">{t.contact.social}</p>
              <SocialLinks social={social} tone="dark" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
