import { uz, type Dictionary } from "./uz";

export const LOCALES = ["uz"] as const; // future: "ru", "en"
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";

const dictionaries: Record<Locale, Dictionary> = { uz };

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale] ?? uz;
}

/** Current dictionary. When more languages are added, resolve the locale from a cookie here. */
export const t = getDictionary();
