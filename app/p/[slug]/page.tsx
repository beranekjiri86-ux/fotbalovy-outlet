import { getSupabaseServerClient } from "@/lib/supabase";
import AddToCart from "./ui/AddToCart";

// Lokální typ pro tuto stránku – obsahuje vše, co tady používáš + images
type ProductPageRow = {
  id: string;
  slug: string;

  name: string;
  article_code: string | null;
  brand: string | null;

  category: string | null;
  boot_type: string | null;

  size_eu: number | null;
  size_uk: number | null;
  size_cm: number | null;

  condition: string | null;

  original_price: number | null;
  sale_price: number;

  status: "available" | "reserved" | "sold" | string;

  note: string | null;

  image_url: string | null;
  images: string[] | null;
};

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id,slug,name,article_code,brand,category,boot_type,size_eu,size_uk,size_cm,condition,original_price,sale_price,status,note,image_url,images"
    )
    .eq("slug", params.slug)
    .single();

  if (error || !data) {
    return <div className="card" style={{ marginTop: 16 }}>Produkt nebyl nalezen.</div>;
  }

  const p = data as ProductPageRow;

  return (
    <div className="grid2 grid" style={{ gap: 16, paddingTop: 16 }}>
      <div className="card">
        <div className="thumb" style={{ aspectRatio: "4/3" }}>
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} />
          ) : (
            <span className="muted">Bez fotky</span>
          )}
        </div>

        {(p.images?.length ?? 0) > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 10,
              marginTop: 20,
            }}
          >
            {p.images!.slice(0, 10).map((img) => (
              <img
                key={img}
                src={img}
                alt={p.name}
                style={{
                  width: "100%",
                  height: 200,
                  objectFit: "cover",
                  borderRadius: 10,
                }}
              />
            ))}
          </div>
        ) : null}

        <div className="hr" />
        <h1 className="h1">{p.name}</h1>

        <div className="tagRow">
          {p.category ? <span className="tag">{p.category}</span> : null}
          {p.brand ? <span className="tag">{p.brand}</span> : null}
          {p.boot_type ? <span className="tag">{p.boot_type}</span> : null}
          {p.size_eu ? <span className="tag">EU {String(p.size_eu).replace(".0", "")}</span> : null}
          {p.condition ? <span className="tag">{p.condition}</span> : null}
          {p.status === "reserved" ? <span className="tag">rezervováno</span> : null}
        </div>

        <div className="priceRow" style={{ marginTop: 10 }}>
          <span className="price" style={{ fontSize: 22 }}>
            {Math.round(p.sale_price)} Kč
          </span>
          {p.original_price != null ? (
            <span className="priceOld">{Math.round(p.original_price)} Kč</span>
          ) : null}
        </div>

        <div className="hr" />
        <table className="table">
          <tbody>
            <tr>
              <th>Kód artiklu</th>
              <td>{p.article_code ?? "—"}</td>
            </tr>
            <tr>
              <th>Velikost</th>
              <td>
                {p.size_eu ? `EU ${String(p.size_eu).replace(".0", "")}` : "—"}
                {p.size_uk ? ` • UK ${String(p.size_uk).replace(".0", "")}` : ""}
                {p.size_cm ? ` • ${String(p.size_cm).replace(".0", "")} cm` : ""}
              </td>
            </tr>
            <tr>
              <th>Stav</th>
              <td>{p.condition ?? "—"}</td>
            </tr>
            <tr>
              <th>Status</th>
              <td>
                {p.status === "available"
                  ? "Skladem"
                  : p.status === "reserved"
                  ? "Rezervováno"
                  : "Prodáno"}
              </td>
            </tr>
          </tbody>
        </table>

        {p.note ? (
          <>
            <div className="hr" />
            <div className="notice">
              <div style={{ fontWeight: 700 }}>Poznámka</div>
              <div className="small">{p.note}</div>
            </div>
          </>
        ) : null}
      </div>

      <div className="card">
        <h2 className="h2">Koupit / rezervovat</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Přidej do košíku a odešli objednávku (dobírka/převod), nebo zvol „Domluva“ a napiš nám.
          Po odeslání objednávky se položka automaticky rezervuje na 24 hodin.
        </p>

        {/* AddToCart očekává "product" – necháváme p jako objekt s potřebnými poli */}
        <AddToCart product={p as any} />

        <div className="hr" />
        <h2 className="h2">Kontaktovat</h2>
        <div className="row">
          <a className="btn" href={`tel:${(process.env.SHOP_PHONE ?? "").replaceAll(" ", "")}`}>
            Zavolat
          </a>
          <a
            className="btn"
            href={`https://instagram.com/${process.env.SHOP_IG ?? "fotbalovy_outlet_cz"}`}
            target="_blank"
            rel="noreferrer"
          >
            Instagram DM
          </a>
          {process.env.SHOP_FB ? (
            <a className="btn" href={process.env.SHOP_FB} target="_blank" rel="noreferrer">
              Messenger
            </a>
          ) : null}
        </div>

        <div className="hr" />
        <div className="notice">
          <div style={{ fontWeight: 700 }}>Platba převodem</div>
          <div className="small">
            Účet: {process.env.SHOP_BANK_ACCOUNT ?? "36493003/5500"} • VS = číslo objednávky
          </div>
        </div>
      </div>
    </div>
  );
}
