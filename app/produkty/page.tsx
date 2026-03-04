import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase";
import { Product } from "@/lib/types";

type SP = { searchParams?: Record<string, string | string[] | undefined> };

function getString(sp: SP["searchParams"], key: string) {
  const v = sp?.[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function getMulti(sp: SP["searchParams"], key: string): string[] {
  const v = sp?.[key];
  if (!v) return [];
  if (Array.isArray(v)) return v.flatMap((x) => x.split(",")).filter(Boolean);
  return v.split(",").filter(Boolean);
}

function qpSet(url: URL, key: string, values: string[] | string) {
  if (Array.isArray(values)) {
    if (values.length) url.searchParams.set(key, values.join(","));
    else url.searchParams.delete(key);
  } else {
    if (values) url.searchParams.set(key, values);
    else url.searchParams.delete(key);
  }
}

function toggle(values: string[], v: string) {
  return values.includes(v) ? values.filter((x) => x !== v) : [...values, v];
}

export default async function Produkty({ searchParams }: SP) {
  const q = getString(searchParams, "q");
  const category = getString(searchParams, "cat"); // kopačky / běžecké boty / tenisky
  const condition = getMulti(searchParams, "cond"); // nové/použité
  const brands = getMulti(searchParams, "brand");
  const boot = getMulti(searchParams, "boot"); // FG/AG...
  const size = getMulti(searchParams, "eu");

  const supabase = getSupabaseServerClient();

  // load distinct lists for filters
  const [{ data: brandsRows }, { data: sizesRows }] = await Promise.all([
    supabase.from("products").select("brand").not("brand", "is", null),
    supabase.from("products").select("size_eu").not("size_eu", "is", null),
  ]);

  const allBrands = Array.from(
    new Set((brandsRows ?? []).map((r) => (r as any).brand).filter(Boolean))
  ).sort();

  const allSizes = Array.from(
    new Set((sizesRows ?? []).map((r) => (r as any).size_eu).filter((x: any) => x !== null))
  )
    .map((x: any) => Number(x))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  let query = supabase
    .from("products")
    .select("*")
    .in("status", ["available", "reserved"])
    .order("sale_price", { ascending: true });

  // vyhledávání: název / kód / značka
  if (q) {
    query = query.or(`name.ilike.%${q}%,article_code.ilike.%${q}%,brand.ilike.%${q}%`);

    // pokud zadá jen číslo (např. 44), zkus i size_eu
    const qNum = Number(q);
    if (Number.isFinite(qNum)) {
      query = query.or(`size_eu.eq.${qNum}`);
    }
  }

  if (category) query = query.eq("category", category);
  if (condition.length) query = query.in("condition", condition);
  if (brands.length) query = query.in("brand", brands);
  if (boot.length) query = query.in("boot_type", boot);
  if (size.length) query = query.in("size_eu", size.map((s) => Number(s)));

  const { data } = await query;
  const products = (data ?? []) as unknown as Product[];

  const base = new URL("https://example.local/produkty");

  const urlFor = (up: (u: URL) => void) => {
    const u = new URL(base.toString());
    if (q) u.searchParams.set("q", q);
    if (category) u.searchParams.set("cat", category);
    if (condition.length) u.searchParams.set("cond", condition.join(","));
    if (brands.length) u.searchParams.set("brand", brands.join(","));
    if (boot.length) u.searchParams.set("boot", boot.join(","));
    if (size.length) u.searchParams.set("eu", size.join(","));
    up(u);
    return u.pathname + (u.search ? u.search : "");
  };

  const cats = ["kopačky", "běžecké boty", "tenisky"];

  return (
    <div className="container" style={{ paddingTop: 16 }}>
      {/* Header řádek */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>
          Produkty
        </h1>
        <div className="badge">{products.length} ks</div>
      </div>

      {/* 2 sloupce: Filtr + Produkty */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 18, alignItems: "start" }}>
        {/* FILTRY */}
        <div
          className="card"
          style={{
            height: "fit-content",
            position: "sticky",
            top: 86,
          }}
        >
          {/* Hledání */}
          <form action="/produkty" method="get" className="filters">
            <input
              name="q"
              defaultValue={q}
              placeholder="Hledat (název / kód / značka / 44)..."
            />
            <button className="btn" type="submit">
              Hledat
            </button>

            {/* zachovej ostatní parametry při hledání */}
            {category ? <input type="hidden" name="cat" value={category} /> : null}
            {condition.length ? <input type="hidden" name="cond" value={condition.join(",")} /> : null}
            {brands.length ? <input type="hidden" name="brand" value={brands.join(",")} /> : null}
            {boot.length ? <input type="hidden" name="boot" value={boot.join(",")} /> : null}
            {size.length ? <input type="hidden" name="eu" value={size.join(",")} /> : null}
          </form>

          <div className="hr" />

          <div style={{ display: "grid", gap: 10 }}>
            <Link className="btn" href={urlFor((u) => (u.search = ""))}>
              Reset filtrů
            </Link>

            {/* Kategorie */}
            <details open>
              <summary style={{ fontWeight: 800, cursor: "pointer" }}>Kategorie</summary>
              <div className="filters" style={{ marginTop: 10 }}>
                {cats.map((c) => (
                  <Link
                    key={c}
                    className={"btn" + (category === c ? " btnPrimary" : "")}
                    href={urlFor((u) => qpSet(u, "cat", category === c ? "" : c))}
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </details>

            {/* Stav */}
            <details open>
              <summary style={{ fontWeight: 800, cursor: "pointer" }}>Stav</summary>
              <div className="filters" style={{ marginTop: 10 }}>
                {(["nové", "použité"] as const).map((c) => (
                  <Link
                    key={c}
                    className={"btn" + (condition.includes(c) ? " btnPrimary" : "")}
                    href={urlFor((u) => qpSet(u, "cond", toggle(condition, c)))}
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </details>

            {/* Typ kopaček */}
            <details>
              <summary style={{ fontWeight: 800, cursor: "pointer" }}>Typ kopaček / povrch</summary>
              <div className="filters" style={{ marginTop: 10 }}>
                {(["FG", "AG", "SG", "TF", "IC"] as const).map((t) => (
                  <Link
                    key={t}
                    className={"btn" + (boot.includes(t) ? " btnPrimary" : "")}
                    href={urlFor((u) => qpSet(u, "boot", toggle(boot, t)))}
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </details>

            {/* Značka */}
            <details>
              <summary style={{ fontWeight: 800, cursor: "pointer" }}>Značka</summary>
              <div
                className="filters"
                style={{
                  marginTop: 10,
                  maxHeight: 240,
                  overflow: "auto",
                  paddingRight: 6,
                }}
              >
                {allBrands.map((b) => (
                  <Link
                    key={b}
                    className={"btn" + (brands.includes(b) ? " btnPrimary" : "")}
                    href={urlFor((u) => qpSet(u, "brand", toggle(brands, b)))}
                  >
                    {b}
                  </Link>
                ))}
              </div>
            </details>

            {/* Velikost EU */}
            <details>
              <summary style={{ fontWeight: 800, cursor: "pointer" }}>Velikost EU</summary>
              <div
                className="filters"
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {allSizes.map((s) => {
                  const ss = String(s).replace(".0", "");
                  return (
                    <Link
                      key={ss}
                      className={"btn" + (size.includes(ss) ? " btnPrimary" : "")}
                      href={urlFor((u) => qpSet(u, "eu", toggle(size, ss)))}
                    >
                      EU {ss}
                    </Link>
                  );
                })}
              </div>
            </details>
          </div>
        </div>

        {/* PRODUKTY */}
        <div className="productGrid">
          {products.map((p) => (
            <Link key={p.id} href={`/p/${p.slug}`} className="card product">
              <div className="thumb">
                <img
                  src={p.image_url || `https://loremflickr.com/800/800/football,boots?lock=${p.id}`}
                  alt={p.name}
                  style={{ width: "100%", height: "220px", objectFit: "cover" }}
                />
              </div>

              <div style={{ fontWeight: 800, lineHeight: 1.25 }}>{p.name}</div>

              <div className="tagRow">
                <span className="tag">{p.category}</span>
                {p.brand ? <span className="tag">{p.brand}</span> : null}
                {p.boot_type ? <span className="tag">{p.boot_type}</span> : null}
                {p.size_eu ? <span className="tag">EU {String(p.size_eu).replace(".0", "")}</span> : null}
                {p.condition ? <span className="tag">{p.condition}</span> : null}
                {p.status === "reserved" ? <span className="tag">rezervováno</span> : null}
              </div>

              <div className="priceRow">
                <span className="price">{Math.round(p.sale_price)} Kč</span>
                {p.original_price ? <span className="priceOld">{Math.round(p.original_price)} Kč</span> : null}
              </div>

              <div className="small">Kód: {p.article_code}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
