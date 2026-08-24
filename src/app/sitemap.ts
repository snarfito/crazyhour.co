import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("slug, created_at"),
    supabase.from("products").select("id, created_at").eq("is_active", true),
  ]);

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...(categories ?? []).map((c) => ({
      url: `${SITE_URL}/${c.slug}`,
      lastModified: new Date(c.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(products ?? []).map((p) => ({
      url: `${SITE_URL}/producto/${p.id}`,
      lastModified: new Date(p.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
