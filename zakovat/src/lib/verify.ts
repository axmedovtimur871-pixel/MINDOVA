import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import type { VerifyResult } from "@/lib/types";

export async function clientFingerprint() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const salt = process.env.VERIFY_LOG_SALT ?? "zakovat";
  return {
    ip,
    ipHash: createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32),
    userAgent: (h.get("user-agent") ?? "").slice(0, 300),
  };
}

export type VerifyOutcome = VerifyResult | { status: "rate_limited" } | { status: "unavailable" };

/** Always checks the database – a QR code alone never proves anything. */
export async function verifyCertificate(query: string, method: "qr" | "manual"): Promise<VerifyOutcome> {
  if (!isSupabaseConfigured) return { status: "unavailable" };
  const fp = await clientFingerprint();
  if (!rateLimit(`verify:${fp.ipHash}`, 40, 60_000)) return { status: "rate_limited" };
  const { data, error } = await createPublicClient().rpc("verify_certificate", {
    p_query: query.trim().slice(0, 128),
    p_method: method,
    p_ip_hash: fp.ipHash,
    p_user_agent: fp.userAgent,
  });
  if (error) {
    console.error("verify_certificate:", error.message);
    return { status: "unavailable" };
  }
  return data as VerifyResult;
}
