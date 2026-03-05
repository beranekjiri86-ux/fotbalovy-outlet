export const revalidate = 300; // ✅ ISR: přegeneruje max 1× za 5 min

import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

function isShoesCategory(cat: string | null) {
  return cat === "kopačky" || cat === "běžecké boty" || cat === "tenisky";
}

function money(n: number | null) {
  if (n == null) return "—";
  return `${Math.round(n)} Kč`;
}

// EU velikosti jako zlomek: 41.5 -> 41 1/2, 41.33 -> 41 1/3, 41.67 -> 41 2/3
function formatEUSize(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  const whole = Math.floor(n);

  if (Math.abs(n - (whole + 0.5)) < 0.02) return `${whole} 1/2`;
  if (Math.abs(n - (whole + 1 / 3)) < 0.03) return `${whole} 1/3`;
  if (Math.abs(n - (whole + 2 / 3)) < 0.03) return `${whole} 2/3`;

  return String(n).replace(".0", "");
}

// ✅ Cache dotazu na produkt podle slugu
const getProductBySlug = unstable_cache(
  async (slug: string) => {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("products")
      .select(
        [
          "id",
          "slug",
          "name",
          "article_code",
          "brand",
          "category",
          "boot_type",
          "size_eu",
          "size_uk",
          "size_cm",
          "condition",
          "status",
          "sale_price",
          "original_price",
          "note",
          "image_url",
          "images",
        ].join(",")
      )
      .eq("slug", slug)
      .single();

    if (error) return null;
    return data as any;
  },
  ["product-by-slug-v2"],
  { revalidate: 300 }
);

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const gallery: string[] = Array.isArray(product.images) ? product.images : [];
  const mainImg = product.image_url || gallery[0] || null;

  return (
    <main className="container" style={{ paddingTop: 18, paddingBottom: 30 }}>
      <h1 className="h1" style={{ margin: 0 }}>
        {product.name}
      </h1>

      {/* INFO BLOK (bez slugu) */}
      <div className="card" style={{ marginTop: 12, padding: 12, display: "grid", gap: 8 }}>
        <div className="small muted" style={{ display: "grid", gap: 6 }}>
          <div>
            <b>Značka:</b> {product.brand ?? "—"}
          </div>
          <div>
            <b>Kód:</b> {product.article_code ?? "—"}
          </div>
          <div>
            <b>Kategorie:</b> {product.category ?? "—"}
          </div>

          {/* ✅ Typ (FG/AG/SG...) nahoře */}
          <div>
            <b>Typ:</b> {product.boot_type ?? "—"}
          </div>

          <div>
            <b>Stav:</b> {product.condition ?? "—"}
          </div>
          <div>
            <b>Status:</b> {product.status ?? "—"}
          </div>
          <div>
            <b>Prodejní cena:</b> {money(product.sale_price ?? null)}
          </div>
          <div>
            <b>Původní cena:</b> {money(product.original_price ?? null)}
          </div>
        </div>
      </div>

      {/* FOTO */}
      {mainImg ? (
        <div className="card" style={{ marginTop: 12, overflow: "hidden" }}>
          <img
            src={mainImg}
            alt={product.name}
            loading="eager"
            style={{ width: "100%", maxHeight: 520, objectFit: "cover", display: "block" }}
          />
        </div>
      ) : (
        <div className="card small muted" style={{ marginTop: 12, padding: 12 }}>
          Bez fotky.
        </div>
      )}

      {/* BOTY */}
      {isShoesCategory(product.category ?? null) ? (
        <div className="card" style={{ marginTop: 12, padding: 12, display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800 }}>Velikosti</div>

          {/* ❌ Typ je pryč z velikostí */}
          <div className="small muted">
            <b>EU:</b> {formatEUSize(product.size_eu ?? null)}
          </div>
          <div className="small muted">
            <b>UK:</b> {product.size_uk ?? "—"}
          </div>
          <div className="small muted">
            <b>CM:</b> {product.size_cm ?? "—"}
          </div>
        </div>
      ) : null}

      {/* POPIS */}
      <div className="card" style={{ marginTop: 12, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>Popis</div>
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{product.note ? product.note : "—"}</div>
      </div>

      {/* GALERIE */}
      {gallery.length ? (
        <div className="card" style={{ marginTop: 12, padding: 12, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>Galerie</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {gallery.slice(0, 10).map((url) => (
              <div
                key={url}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* ✅ MOBILE BUY BAR */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "var(--card)",
          borderTop: "1px solid var(--border)",
          padding: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginTop: 14,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 18 }}>{money(product.sale_price ?? null)}</div>

        <a href="https://wa.me/420605171216" className="btn btnPrimary" style={{ whiteSpace: "nowrap" }}>
          Kontaktovat
        </a>
      </div>
    </main>
  );
}
