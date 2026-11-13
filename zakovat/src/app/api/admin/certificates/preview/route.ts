import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handle } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { loadTemplate } from "@/lib/certificates/issue";
import { renderCertificatePdf } from "@/lib/certificates/render-pdf";
import { pdfResponse } from "@/lib/certificates/pdf-file";
import { normalizeName } from "@/lib/validation";
import { SITE_URL } from "@/lib/env";

export const runtime = "nodejs";

const schema = z.object({
  template_id: z.string().uuid(),
  layout: z.unknown().optional(), // unsaved layout from the template editor
  page_size: z.enum(["A4_LANDSCAPE", "A4_PORTRAIT"]).optional(),
  background_fit: z.enum(["cover", "contain"]).optional(),
  first_name: z.string().max(80).default(""),
  last_name: z.string().max(80).default(""),
  event_name: z.string().max(200).default(""),
  certificate_type: z.string().max(120).default(""),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  organizer: z.string().max(200).default(""),
  description: z.string().max(500).default(""),
});

// Real PDF preview (nothing is saved, the QR points to a sample address).
export const POST = handle(async (req: Request) => {
  await requireAdmin("issueCertificates");
  const body = schema.parse(await req.json());
  const supabase = await createClient();
  const template = await loadTemplate(supabase, body.template_id);
  const bytes = await renderCertificatePdf(
    {
      ...template,
      layout: body.layout ?? template.layout,
      page_size: body.page_size ?? template.page_size,
      background_fit: body.background_fit ?? template.background_fit,
    },
    {
      first_name: normalizeName(body.first_name) || "Ism",
      last_name: normalizeName(body.last_name) || "Familiya",
      event_name: body.event_name || "Tadbir nomi",
      certificate_type: body.certificate_type,
      issue_date: body.issue_date,
      organizer: body.organizer,
      description: body.description,
      certificate_number: "ZA-NAMUNA-0000",
    },
    { verifyUrl: `${SITE_URL}/verify`, title: "Namuna (saqlanmagan)" },
  );
  return pdfResponse(bytes, "namuna.pdf", true);
});
