import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServerClient();

  const slug = decodeURIComponent(params.slug);

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !product) {
    notFound();
  }

  return (
    <main className="container" style={{ paddingTop: 20 }}>
      <h1>{product.name}</h1>
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} style={{ maxWidth: 420, borderRadius: 12 }} />
      ) : null}
      {product.note ? <p style={{ marginTop: 16 }}>{product.note}</p> : null}
    </main>
  );
}
