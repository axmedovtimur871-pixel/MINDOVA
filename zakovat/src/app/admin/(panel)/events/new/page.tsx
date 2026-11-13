import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/admin-shell";
import { EventForm } from "@/components/admin/event-form";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Yangi tadbir" };

export default async function NewEventPage() {
  await requireAdminPage("manageEvents");
  return (<><PageTitle title="Yangi tadbir" /><EventForm /></>);
}
