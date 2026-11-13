import {
  AboutSection, ActivitiesSection, ContactSection, GallerySection, HeroSection,
  StatsSection, UpcomingEventsSection, VerifyCtaSection,
} from "@/components/site/sections";
import { getPublicStats, getPublishedEvents, getSiteContent, splitEvents } from "@/lib/public-data";

export const revalidate = 60;

export default async function HomePage() {
  const [content, events, stats] = await Promise.all([getSiteContent(), getPublishedEvents(), getPublicStats()]);
  const { upcoming } = splitEvents(events);
  return (
    <>
      <HeroSection hero={content.hero} />
      <AboutSection about={content.about} />
      <ActivitiesSection activities={content.activities} />
      <UpcomingEventsSection events={upcoming} />
      <StatsSection stats={content.stats} computed={stats} />
      <VerifyCtaSection />
      <GallerySection gallery={content.gallery} />
      <ContactSection contact={content.contact} social={content.social} />
    </>
  );
}
