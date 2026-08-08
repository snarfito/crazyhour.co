import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role key bypasses RLS entirely. Only use this for orders,
// order_items, and settings — categories/products/product_images go
// through @/lib/supabase/server (cookie-based, respects the authenticated
// RLS policies from 0004/0005), which is the client the rest of the admin
// panel already uses. See 0006's migration comment for why these three
// tables have no RLS policies at all instead.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
