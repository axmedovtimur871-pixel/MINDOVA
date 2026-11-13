import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handle } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { findDuplicates } from "@/lib/certificates/issue";

const schema = z.object({
  event_name: z.string().min(1).max(200),
  names: z.array(z.object({ first_name: z.string().max(80), last_name: z.string().max(80) })).max(5000),
});

export const POST = handle(async (req: Request) => {
  await requireAdmin("issueCertificates");
  const { event_name, names } = schema.parse(await req.json());
  const supabase = await createClient();
  const dupes = await findDuplicates(supabase, event_name, names);
  return NextResponse.json({ duplicates: Object.fromEntries(dupes) });
});
