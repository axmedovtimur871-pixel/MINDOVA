import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { IconArrowRight, IconCalendar, IconExternal, IconPin } from "@/components/site/icons";
import { getEventBySlug } from "@/lib/public-data";
import { formatDateTime } from "@/lib/format";
import { publicMediaUrl } from "@/lib/env";
import { t } from "@/i18n";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const event = await getEventBySlug((await params).slug);
  return event ? { title: event.title, description: event.summary || undefined } : { title: t.common.notFoundTitle };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const event = await getEventBySlug((await params).slug);
  if (!event) notFound();
  const cover = publicMediaUrl(event.cover_image_path);
  return (
    <article>
      <header className="relative overflow-hidden bg-navy-950 text-cream-50">
        <div className="pattern-octagram pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="container-page relative py-14 sm:py-20">
          <Link href="/events" className="inline-flex items-center gap-2 text-sm text-cream-100/70 hover:text-gold-300">
            <IconArrowRight className="size-4 rotate-180" /> {t.events.back}
          </Link>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">{event.title}</h1>
          {event.summary && <p className="mt-4 max-w-2xl text-lg leading-8 text-cream-100/75">{event.summary}</p>}
          <dl className="mt-8 flex flex-col gap-3 text-sm sm:flex-row sm:gap-8">
            <div className="flex items-center gap-2">
              <IconCalendar className="size-5 text-gold-400" />
              <dt className="sr-only">{t.events.date}</dt>
              <dd>{event.starts_at ? formatDateTime(event.starts_at) : t.events.tba}</dd>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <IconPin className="size-5 text-gold-400" />
                <dt className="sr-only">{t.events.location}</dt>
                <dd>{event.location}</dd>
              </div>
            )}
          </dl>
          {event.registration_url && (
            <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className={buttonClass("gold", "lg", "mt-8")}>
              {t.events.register} <IconExternal className="size-4" />
            </a>
          )}
        </div>
      </header>
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4 text-[16px] leading-8 text-ink/85">
          {(event.description || event.summary || "").split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
        </div>
        {cover && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-line">
            <Image src={cover} alt="" fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" />
          </div>
        )}
      </div>
    </article>
  );
}
