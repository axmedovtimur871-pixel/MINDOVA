import { IconFacebook, IconInstagram, IconTelegram, IconYoutube } from "./icons";
import type { SiteContent } from "@/lib/content";
import { cn } from "@/lib/cn";

export function socialList(social: SiteContent["social"]) {
  return [
    { key: "telegram", label: "Telegram", href: social.telegram, Icon: IconTelegram },
    { key: "instagram", label: "Instagram", href: social.instagram, Icon: IconInstagram },
    { key: "youtube", label: "YouTube", href: social.youtube, Icon: IconYoutube },
    { key: "facebook", label: "Facebook", href: social.facebook, Icon: IconFacebook },
  ].filter((s) => /^https?:\/\//.test(s.href || ""));
}

export function SocialLinks({ social, className, tone = "light" }: { social: SiteContent["social"]; className?: string; tone?: "light" | "dark" }) {
  const items = socialList(social);
  if (items.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {items.map(({ key, label, href, Icon }) => (
        <li key={key}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className={cn(
              "grid size-10 place-items-center rounded-full ring-1 transition-colors",
              tone === "light"
                ? "text-cream-100 ring-white/20 hover:bg-gold-500 hover:text-navy-950 hover:ring-gold-500"
                : "text-navy-900 ring-line hover:bg-navy-900 hover:text-cream-50",
            )}
          >
            <Icon className="size-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}
