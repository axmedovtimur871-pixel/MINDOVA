import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assertSameOrigin, handle, jsonError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { defaultLayout } from "@/lib/certificates/layout";

const schema = z.object({
  name: z.string().trim().min(2, "Nomini kiriting").max(120),
  description: z.string().max(500).default(""),
  background_path: z.string().regex(/^templates\/[\w\-/]+\.(png|jpg)$/, "Avval rasm yuklang"),
  background_width: z.number().int().positive(),
  background_height: z.number().int().positive(),
});

export const POST = handle(async (req: Request) => {
  assertSameOrigin(req);
  await requireAdmin("manageTemplates");
  const body = schema.parse(await req.json());
  const page_size = body.background_height > body.background_width ? "A4_PORTRAIT" : "A4_LANDSCAPE";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("certificate_templates")
    .insert({ ...body, page_size, background_fit: "contain", layout: defaultLayout() })
    .select("id")
    .single();
  if (error) return jsonError("Shablonni saqlab boʻlmadi: " + error.message, 500);
  return NextResponse.json({ id: data.id }, { status: 201 });
});
