import "server-only";
import { randomBytes, randomInt } from "node:crypto";

// No 0/O, 1/I/L – easy to read aloud and type from a printed certificate.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function block(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

/** Public certificate ID, e.g. ZA-2026-7K3F-9QMX (31^8 ≈ 8.5·10¹¹ combinations per year). */
export function generateCertificateNumber(issueDate: string): string {
  const year = /^\d{4}/.exec(issueDate)?.[0] ?? String(new Date().getFullYear());
  return `ZA-${year}-${block(4)}-${block(4)}`;
}

/** Unpredictable verification token used in the QR link (192 bits). */
export function generateVerificationToken(): string {
  return randomBytes(24).toString("base64url");
}
