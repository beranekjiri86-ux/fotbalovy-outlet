import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = { q?: string };

export default async function ProduktyPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createSupabaseServerClient();
  const q = (searchParams?.q ?? "").trim();

  let s = supabase
    .from("products")
    .select("id,name,slug,image_url,sale_price,brand,category,condition,status")
    .order("name", { ascending: true })
    .limit(200);

  if (q) {
    s = s.or(`name.ilike.%${q}%,article_code.ilike.%${q}%,brand.ilike.%${q}%`);
  }

  const { data, error } = await s;

  if (error) {
    return (
      <div className="card" style={{ marginTop: 12, padding: 12 }}>
        <b>Chyba načtení produktů:</b> {error.message}
      </div>
    );
  }

  const rows = data ?? [];

  return (
    <div style={{ paddingTop: 16, display: "grid", gap: 12 }}>
      <h1 className="h1" style={{ margin: 0 }}>
        Produkty
      </h1>

      {q ? <div className="small muted">Filtr: <b>{q}</b></div> : null}

      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((p) => (
          <Link
            key={p.id}
            href={p.slug ? `/p/${p.slug}` : "#"}
            className="card"
            style={{ padding: 12, display: "flex", gap: 12, alignItems: "center", textDecoration: "none" }}
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
                <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

            <div style={{ fontWeight: 900, whiteSpace: "nowrap" }}>
              {p.sale_price != null ? `${Math.round(p.sale_price)} Kč` : ""}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
