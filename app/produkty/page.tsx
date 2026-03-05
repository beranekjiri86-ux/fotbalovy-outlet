export const revalidate = 300; // ✅ ISR: přegeneruje max 1× za 5 min

import Link from "next/link";
import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  name: string;
  slug: string | null;
  image_url: string | null;
  sale_price: number | null;
  brand: string | null;
  category: string | null;
  condition: string | null;
  status: string | null;
};

function money(n: number | null) {
  if (n == null) return "";
  return `${Math.round(n)} Kč`;
}

// ✅ Cache dotazu na produkty (včetně search q)
const getProducts = unstable_cache(
  async (q: string) => {
    const supabase = createSupabaseServerClient();

    let s = supabase
      .from("products")
      .select("id,name,slug,image_url,sale_price,brand,category,condition,status,article_code")
      .order("name", { ascending: true })
      .limit(300);

    if (q) {
      // hledání v názvu/kódu/značce
      s = s.or(`name.ilike.%${q}%,article_code.ilike.%${q}%,brand.ilike.%${q}%`);
    }

    const { data, error } = await s;
    if (error) throw error;

    return (data ?? []) as Row[];
  },
  ["products-list-v1"],
  { revalidate: 300 }
);

export default async function ProduktyPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = (searchParams?.q ?? "").trim();

  let rows: Row[] = [];
  try {
    rows = await getProducts(q);
  } catch (e: any) {
    return (
      <div className="card" style={{ marginTop: 12, padding: 12 }}>
        <b>Chyba načtení produktů:</b> {e?.message ?? "Neznámá chyba"}
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 16, display: "grid", gap: 12 }}>
      <h1 className="h1" style={{ margin: 0 }}>
        Produkty
      </h1>

      {q ? (
        <div className="small muted">
          Filtr: <b>{q}</b>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((p) => (
          <Link
            key={p.id}
            href={p.slug ? `/p/${p.slug}` : "/produkty"}
            className="card"
            style={{
              padding: 12,
              display: "flex",
              gap: 12,
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid var(--border)",
                background: "#0e1522",
                flexShrink: 0,
              }}
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt=""
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : null}
            </div>

            <div style={{ flex: 1, display: "grid", gap: 4 }}>
              <div style={{ fontWeight: 900 }}>{p.name}</div>
              <div className="small muted" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {p.brand ? <span>{p.brand}</span> : null}
                {p.category ? <span>{p.category}</span> : null}
                {p.condition ? <span>{p.condition}</span> : null}
                {p.status ? <span>{p.status}</span> : null}
              </div>
            </div>

            <div style={{ fontWeight: 900, whiteSpace: "nowrap" }}>{money(p.sale_price)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
