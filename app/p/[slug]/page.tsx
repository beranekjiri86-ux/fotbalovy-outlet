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

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createSupabaseServerClient();
  const slug = decodeURIComponent(params.slug);

  const { data: product, error } = await supabase
    .from("products")
    .select(
      [
        "id",
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

  if (error || !product) notFound();

  const gallery: string[] = Array.isArray((product as any).images) ? ((product as any).images as string[]) : [];
  const mainImg = (product as any).image_url || gallery[0] || null;

  return (
    <main className="container" style={{ paddingTop: 18, paddingBottom: 30 }}>
      <h1 className="h1" style={{ margin: 0 }}>
        {(product as any).name}
      </h1>

      <div className="card" style={{ marginTop: 12, padding: 12, display: "grid", gap: 8 }}>
        <div className="small muted" style={{ display: "grid", gap: 6 }}>
          <div>
            <b>Značka:</b> {(product as any).brand ?? "—"}
          </div>
          <div>
            <b>Kód:</b> {(product as any).article_code ?? "—"}
          </div>
          <div>
            <b>Kategorie:</b> {(product as any).category ?? "—"}
          </div>
          <div>
            <b>Stav:</b> {(product as any).condition ?? "—"}
          </div>
          <div>
            <b>Status:</b> {(product as any).status ?? "—"}
          </div>
          <div>
            <b>Prodejní cena:</b> {money((product as any).sale_price ?? null)}
          </div>
          <div>
            <b>Původní cena:</b> {money((product as any).original_price ?? null)}
          </div>
        </div>
      </div>

      {mainImg ? (
        <div className="card" style={{ marginTop: 12, overflow: "hidden" }}>
          <img
            src={mainImg}
            alt={(product as any).name}
            style={{ width: "100%", maxHeight: 520, objectFit: "cover", display: "block" }}
          />
        </div>
      ) : (
        <div className="card small muted" style={{ marginTop: 12, padding: 12 }}>
          Bez fotky.
        </div>
      )}

      {isShoesCategory((product as any).category ?? null) ? (
        <div className="card" style={{ marginTop: 12, padding: 12, display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800 }}>Velikosti</div>
          <div className="small muted">
            <b>Typ:</b> {(product as any).boot_type ?? "—"}
          </div>
          <div className="small muted">
            <b>EU:</b> {formatEUSize((product as any).size_eu ?? null)}
          </div>
          <div className="small muted">
            <b>UK:</b> {(product as any).size_uk ?? "—"}
          </div>
          <div className="small muted">
            <b>CM:</b> {(product as any).size_cm ?? "—"}
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 12, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>Popis</div>
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
          {(product as any).note ? (product as any).note : "—"}
        </div>
      </div>

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
                  style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
