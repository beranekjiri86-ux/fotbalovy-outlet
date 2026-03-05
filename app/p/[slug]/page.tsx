import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createSupabaseServerClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !product) {
    notFound();
  }

  return (
    <main className="container" style={{ paddingTop: 20 }}>
      <h1>{product.name}</h1>

      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          style={{ maxWidth: 400, borderRadius: 12 }}
        />
      )}

      <p style={{ marginTop: 20 }}>{product.note}</p>

      {product.sale_price && (
        <p style={{ fontWeight: 700, fontSize: 20 }}>
          {product.sale_price} Kč
        </p>
      )}
    </main>
  );
}
