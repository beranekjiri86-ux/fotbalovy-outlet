import type { MetadataRoute } from "next";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabasePublicClient();

  const { data: products } = await supabase
    .from("products")
    .select("slug");

  const baseUrl = "https://www.fotbalovyoutletcz.cz";

  const productUrls =
    products?.map((p) => ({
      url: `${baseUrl}/p/${p.slug}`,
      lastModified: new Date(),
    })) ?? [];

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/produkty`,
      lastModified: new Date(),
    },
    ...productUrls,
  ];
}
