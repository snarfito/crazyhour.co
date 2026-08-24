import { redirect } from "next/navigation";
import { verifySession, firstAllowedPath } from "@/lib/supabase/dal";

export default async function AdminHomePage() {
  const session = await verifySession();
  redirect(firstAllowedPath(session.permissions));
}
