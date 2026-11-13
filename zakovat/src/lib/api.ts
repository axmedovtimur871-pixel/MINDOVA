import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "@/lib/auth";
import { IssueError } from "@/lib/certificates/issue";
import { firstZodError } from "@/lib/validation";

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Uniform error handling for admin API routes. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return jsonError(e.message, e.status);
      if (e instanceof IssueError) return jsonError(e.message, e.status);
      if (e instanceof ZodError) return jsonError(firstZodError(e), 422);
      if (e instanceof SyntaxError) return jsonError("Soʻrov formati notoʻgʻri.", 400);
      console.error(e);
      return jsonError("Kutilmagan xatolik yuz berdi. Qayta urinib koʻring.", 500);
    }
  };
}

/** Rejects cross-site form posts to state-changing admin endpoints. */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    if (new URL(origin).host !== host) throw new HttpError(403, "Notoʻgʻri manba.");
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(403, "Notoʻgʻri manba.");
  }
}
