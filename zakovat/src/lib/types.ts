import type { BackgroundFit, PageSize } from "@/lib/certificates/layout";

export type AdminRole = "super_admin" | "admin" | "certificate_manager";
export type CertificateStatus = "active" | "revoked";
export type EventStatus = "draft" | "published" | "archived";

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  location: string;
  starts_at: string | null;
  ends_at: string | null;
  cover_image_path: string | null;
  registration_url: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export interface TemplateRow {
  id: string;
  name: string;
  description: string;
  background_path: string;
  background_width: number;
  background_height: number;
  page_size: PageSize;
  background_fit: BackgroundFit;
  layout: unknown;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificateRow {
  id: string;
  certificate_number: string;
  verification_token: string;
  first_name: string;
  last_name: string;
  event_id: string | null;
  event_name: string;
  certificate_type: string;
  template_id: string | null;
  issue_date: string;
  organizer: string;
  description: string;
  pdf_path: string | null;
  status: CertificateStatus;
  revoked_at: string | null;
  revoked_by: string | null;
  revoke_reason: string | null;
  batch_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface VerificationLogRow {
  id: number;
  certificate_id: string | null;
  query: string;
  method: "qr" | "manual";
  result: "verified" | "revoked" | "not_found";
  user_agent: string | null;
  created_at: string;
}

export interface ActivityLogRow {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface VerifyResult {
  status: "verified" | "revoked" | "not_found";
  certificate?: {
    certificate_number: string;
    verification_token: string;
    first_name: string;
    last_name: string;
    event_name: string;
    certificate_type: string;
    issue_date: string;
    organizer: string;
    description: string;
    revoked_at: string | null;
  };
  template?: {
    background_path: string;
    background_width: number;
    background_height: number;
    page_size: PageSize;
    background_fit: BackgroundFit;
    layout: unknown;
  } | null;
}
