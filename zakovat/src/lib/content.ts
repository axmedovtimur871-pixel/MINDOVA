// Editable website content. Defaults below are neutral placeholders – no invented
// achievements, partners or numbers. Everything is editable in Admin → Sozlamalar.

export interface SiteContent {
  general: { site_name: string; tagline: string; footer_note: string };
  hero: { eyebrow: string; title: string; slogan: string; intro: string; image_path: string | null };
  about: { title: string; lead: string; body: string; values: { title: string; text: string }[] };
  activities: { title: string; intro: string; items: { title: string; text: string }[] };
  stats: { title: string; show_computed: boolean; items: { value: string; label: string }[] };
  gallery: { title: string; intro: string; items: { path: string; caption: string }[] };
  contact: {
    title: string;
    intro: string;
    address: string;
    phone: string;
    email: string;
    working_hours: string;
    map_url: string;
  };
  social: { telegram: string; instagram: string; youtube: string; facebook: string };
}

export type ContentKey = keyof SiteContent;
export const CONTENT_KEYS: ContentKey[] = ["general", "hero", "about", "activities", "stats", "gallery", "contact", "social"];

export const DEFAULT_CONTENT: SiteContent = {
  general: {
    site_name: "ZAKOVAT ANDIJON",
    tagline: "Intellektual oʻyinlar va tadbirlar",
    footer_note: "Andijon, Oʻzbekiston",
  },
  hero: {
    eyebrow: "Andijon · Intellektual oʻyinlar",
    title: "ZAKOVAT ANDIJON",
    slogan: "Bilim — kuch, mantiq — kalit, zakovat — gʻalaba.",
    intro:
      "Biz bilimga chanqoq, mantiqiy fikrlashni sevadigan insonlarni intellektual oʻyinlar va tadbirlar atrofida birlashtiramiz.",
    image_path: null,
  },
  about: {
    title: "Biz haqimizda",
    lead: "Zakovat Andijon — Andijonda intellektual oʻyinlar va bilim tadbirlarini tashkil etuvchi jamoa.",
    body:
      "Bu matn admin paneldan tahrirlanadi. Bu yerga tashkilot tarixi, maqsadi va faoliyati haqida haqiqiy maʼlumot yozing.",
    values: [
      { title: "Bilim", text: "Har bir savol — yangi narsani oʻrganish imkoniyati." },
      { title: "Mantiq", text: "Toʻgʻri javobga tez emas, toʻgʻri fikrlash orqali yetiladi." },
      { title: "Jamoa", text: "Eng yaxshi gʻoyalar birgalikda fikrlashda tugʻiladi." },
    ],
  },
  activities: {
    title: "Faoliyatimiz",
    intro: "Quyidagi yoʻnalishlar namunaviy. Ularni admin paneldan oʻzingizning haqiqiy faoliyatingizga moslang.",
    items: [
      { title: "Zakovat oʻyinlari", text: "Jamoalar oʻrtasida bilim, tezkorlik va mantiqqa asoslangan bellashuvlar." },
      { title: "Intellektual turnirlar", text: "Bir necha bosqichdan iborat musobaqalar va mavsumiy chempionatlar." },
      { title: "Bilim kechalari", text: "Yangi ishtirokchilar uchun doʻstona muhitdagi ochiq oʻyinlar." },
      { title: "Sertifikatlar", text: "Ishtirokchi va gʻoliblarga QR kod orqali tekshiriladigan sertifikatlar." },
    ],
  },
  stats: {
    title: "Raqamlarda",
    show_computed: true,
    items: [],
  },
  gallery: {
    title: "Galereya",
    intro: "Tadbirlarimizdan lavhalar.",
    items: [],
  },
  contact: {
    title: "Bogʻlanish",
    intro: "Savol, taklif yoki hamkorlik boʻyicha biz bilan bogʻlaning.",
    address: "Andijon shahri",
    phone: "",
    email: "",
    working_hours: "",
    map_url: "",
  },
  social: { telegram: "", instagram: "", youtube: "", facebook: "" },
};

/** Deep-ish merge: stored values override defaults key by key (arrays are replaced). */
export function mergeContent(rows: { key: string; value: unknown }[]): SiteContent {
  const out = structuredClone(DEFAULT_CONTENT) as unknown as Record<string, Record<string, unknown>>;
  for (const row of rows) {
    if (!(row.key in out) || !row.value || typeof row.value !== "object") continue;
    out[row.key] = { ...out[row.key], ...(row.value as Record<string, unknown>) };
  }
  return out as unknown as SiteContent;
}
