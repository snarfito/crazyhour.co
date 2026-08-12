import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminRole = "full" | "limited";

export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const admin = createServiceClient();
  const { data: adminUser } = await admin
    .from("admin_users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminUser) {
    redirect("/admin/login");
  }

  return { userId: user.id, email: user.email ?? "", role: adminUser.role as AdminRole };
});

export async function requireFullAdmin() {
  const session = await verifySession();
  if (session.role !== "full") {
    redirect("/admin/pedidos");
  }
  return session;
}
