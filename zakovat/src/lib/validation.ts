import { z } from "zod";

/** Uzbek Latin typography: o'/g' → oʻ/gʻ, other apostrophes → ʼ (tutuq belgisi). */
export function normalizeUzbekApostrophes(input: string): string {
  return input
    .replace(/([OoGg])['`\u2018\u2019\u02BC\u02BB]/g, "$1\u02BB")
    .replace(/['`\u2018\u2019]/g, "\u02BC");
}

export function normalizeName(input: string): string {
  return normalizeUzbekApostrophes(String(input ?? "").replace(/\s+/g, " ").trim());
}

const NAME_RE = /^[\p{L}\p{M}ʻʼ' .\-]+$/u;

export const nameSchema = z
  .string()
  .transform(normalizeName)
  .pipe(
    z
      .string()
      .min(1, "Toʻldirilishi shart")
      .max(80, "Juda uzun (80 belgigacha)")
      .regex(NAME_RE, "Faqat harflar, defis va apostrof boʻlishi mumkin"),
  );

const optionalText = (max: number) =>
  z
    .string()
    .optional()
    .default("")
    .transform((s) => normalizeUzbekApostrophes(s.replace(/\s+/g, " ").trim()))
    .pipe(z.string().max(max, `Juda uzun (${max} belgigacha)`));

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana notoʻgʻri");

export const certificateCommonSchema = z.object({
  event_id: z.string().uuid().nullable().optional().default(null),
  event_name: optionalText(200).pipe(z.string().min(1, "Tadbir nomini kiriting")),
  certificate_type: optionalText(120),
  issue_date: isoDate,
  organizer: optionalText(200),
  description: optionalText(500),
  template_id: z.string().uuid("Shablonni tanlang"),
});

export const singleCertificateSchema = certificateCommonSchema.extend({
  first_name: nameSchema,
  last_name: nameSchema,
  allow_duplicate: z.boolean().optional().default(false),
  idempotency_key: z.string().min(8).max(100).optional(),
});

export const bulkRowSchema = z.object({
  key: z.string().min(8).max(100),
  first_name: nameSchema,
  last_name: nameSchema,
});

export const bulkItemsSchema = certificateCommonSchema.extend({
  rows: z.array(bulkRowSchema).min(1).max(25),
});

export function duplicateKey(first: string, last: string, event: string) {
  const n = (s: string) => normalizeName(s).toLocaleLowerCase("uz");
  return `${n(first)}|${n(last)}|${n(event)}`;
}

export function firstZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Maʼlumotlar notoʻgʻri";
  const field = issue.path.join(".");
  return field ? `${field}: ${issue.message}` : issue.message;
}
