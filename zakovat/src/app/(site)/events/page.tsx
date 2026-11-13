import type { Metadata } from "next";
import { EventCard, PageHeader } from "@/components/site/sections";
import { EmptyState } from "@/components/ui/card";
import { getPublishedEvents, splitEvents } from "@/lib/public-data";
import { t } from "@/i18n";

export const revalidate = 60;
export const metadata: Metadata = { title: t.events.title };

export default async function EventsPage() {
  const { upcoming, past } = splitEvents(await getPublishedEvents());
  return (
    <>
      <PageHeader eyebrow={t.nav.events} title={t.events.title} intro={t.events.intro} />
      <div className="container-page py-16 sm:py-20">
        {upcoming.length === 0 && past.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white"><EmptyState title={t.events.empty} /></div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-semibold text-navy-900">{t.events.upcoming}</h2>
                <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map((e) => <li key={e.id}><EventCard event={e} /></li>)}
                </ul>
              </section>
            )}
            {past.length > 0 && (
              <section className={upcoming.length ? "mt-16" : ""}>
                <h2 className="font-display text-2xl font-semibold text-navy-900">{t.events.past}</h2>
                <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map((e) => <li key={e.id}><EventCard event={e} /></li>)}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
