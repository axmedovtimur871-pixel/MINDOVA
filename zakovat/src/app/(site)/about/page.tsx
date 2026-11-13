import type { Metadata } from "next";
import { AboutSection, ActivitiesSection, PageHeader, StatsSection, VerifyCtaSection } from "@/components/site/sections";
import { getPublicStats, getSiteContent } from "@/lib/public-data";
import { t } from "@/i18n";

export const revalidate = 60;
export const metadata: Metadata = { title: t.nav.about };

export default async function AboutPage() {
  const [content, stats] = await Promise.all([getSiteContent(), getPublicStats()]);
  return (
    <>
      <PageHeader eyebrow={content.general.site_name} title={content.about.title} intro={content.about.lead} />
      <AboutSection about={{ ...content.about, lead: content.hero.slogan }} />
      <ActivitiesSection activities={content.activities} />
      <StatsSection stats={content.stats} computed={stats} />
      <VerifyCtaSection />
    </>
  );
}
