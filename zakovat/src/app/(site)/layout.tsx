import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { getSiteContent } from "@/lib/public-data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-cream-50">
        Asosiy mazmunga oʻtish
      </a>
      <SiteHeader />
      <main id="main" className="min-h-[60vh]">{children}</main>
      <SiteFooter content={content} />
    </>
  );
}
