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

/** EU velikosti jako zlomek: 41.5 -> 41 1/2, 41.33 -> 41 1/3, 41.67 -> 41 2/3 */
function formatEUSize(n: number) {
  if (!Number.isFinite(n)) return "";
  const whole = Math.floor(n);
  if (Math.abs(n - (whole + 0.5)) < 0.02) return `${whole} 1/2`;
  if (Math.abs(n - (whole + 1 / 3)) < 0.03) return `${whole} 1/3`;
  if (Math.abs(n - (whole + 2 / 3)) < 0.03) return `${whole} 2/3`;
  return String(n).replace(".0", "");
}

/** text velikosti (XS..XXXL) */
const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

/** rukavice 6..11 */
const GLOVE_SIZES = [6, 7, 8, 9, 10, 11] as const;

export default async function Produkty({ searchParams }: SP) {
  const q = getString(searchParams, "q");

  // Hlavní kategorie
  const category = getString(searchParams, "cat"); // kopačky / běžecké boty / tenisky / rukavice / dresy / oblečení

  // univerzální filtry
  const condition = getMulti(searchParams, "cond"); // nové/použité
  const brands = getMulti(searchParams, "brand");

  // kopačky
  const boot = getMulti(searchParams, "boot"); // FG/AG...
  const sizeEU = getMulti(searchParams, "eu"); // "41 1/3" apod.

  // oblečení/dresy
  const apparelSize = getMulti(searchParams, "as"); // XS..XXXL

  // oblečení
  const apparelType = getMulti(searchParams, "at"); // mikina/bunda/...

  // rukavice
  const gloveSize = getMulti(searchParams, "gs"); // 6..11 (string)

  const supabase = getSupabaseServerClient();

  // --- načtení hodnot pro filtry (distinct) ---
  const [
    { data: brandsRows },
    { data: sizesEURows },
    { data: apparelSizeRows },
    { data: apparelTypeRows },
    { data: gloveSizeRows },
  ] = await Promise.all([
    supabase.from("products").select("brand").not("brand", "is", null),
    supabase.from("products").select("size_eu").not("size_eu", "is", null),
    supabase.from("products").select("velikost_obleceni").not("velikost_obleceni", "is", null),
    supabase.from("products").select("typ_obleceni").not("typ_obleceni", "is", null),
    supabase.from("products").select("velikost_rukavic").not("velikost_rukavic", "is", null),
  ]);

  const allBrands = Array.from(
  new Set((brandsRows ?? []).map((r) => (r as any).brand).filter(Boolean))
).sort();

  const allSizesEU = Array.from(
    new Set((sizesEURows ?? []).map((r) => (r as any).size_eu).filter((x: any) => x !== null))
  )
    .map((x: any) => Number(x))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  // apparel sizes – necháme jen standardní XS..XXXL (aby se to nerozbilo překlepy)
  const allApparelSizes = Array.from(
    new Set((apparelSizeRows ?? []).map((r) => (r as any).velikost_obleceni).filter(Boolean))
  )
    .map((s: string) => String(s).toUpperCase().trim())
    .filter((s: string) => (APPAREL_SIZES as readonly string[]).includes(s))
    .sort((a: string, b: string) => (APPAREL_SIZES as readonly string[]).indexOf(a) - (APPAREL_SIZES as readonly string[]).indexOf(b));

  const allApparelTypes = Array.from(
    new Set((apparelTypeRows ?? []).map((r) => (r as any).typ_obleceni).filter(Boolean))
  )
    .map((s: string) => String(s).trim())
    .filter(Boolean)
    .sort((a: string, b: string) => a.localeCompare(b, "cs"));

  const allGloveSizes = Array.from(
    new Set((gloveSizeRows ?? []).map((r) => (r as any).velikost_rukavic).filter((x: any) => x !== null))
  )
    .map((x: any) => Number(x))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  // --- dotaz na produkty ---
  let query = supabase
    .from("products")
    .select("*")
    .in("status", ["available", "reserved"])
    .order("sale_price", { ascending: true });

  // fulltext-ish search: název, kód, značka
  if (q) {
    query = query.or(`nazev.ilike.%${q}%,kod_produktu.ilike.%${q}%,znacka.ilike.%${q}%`);
  }

  if (category) query = query.eq("category", category);
  if (condition.length) query = query.in("condition", condition); // pokud máš condition sloupec; když ne, dej vědět
  const brandsQ = supabase.from("products").select("brand").not("brand", "is", null);
const { data: brandsRows } = category ? await brandsQ.eq("category", category) : await brandsQ;

  // --- kopačky filtry ---
  if (category === "kopačky") {
    if (boot.length) query = query.in("boot_type", boot);

    if (sizeEU.length) {
      const toNum = (s: string) => {
        const t = s.trim();
        if (t.includes("1/2")) return Number(t.replace("1/2", "").trim()) + 0.5;
        if (t.includes("1/3")) return Number(t.replace("1/3", "").trim()) + 1 / 3;
        if (t.includes("2/3")) return Number(t.replace("2/3", "").trim()) + 2 / 3;
        const n = Number(t.replace(",", "."));
        return Number.isFinite(n) ? n : NaN;
      };
      const nums = sizeEU.map(toNum).filter((n) => Number.isFinite(n));
      if (nums.length) query = query.in("size_eu", nums);
    }
  }

  // --- rukavice filtry ---
  if (category === "rukavice") {
    if (gloveSize.length) {
      const nums = gloveSize.map((x) => Number(x)).filter((n) => Number.isFinite(n));
      if (nums.length) query = query.in("velikost_rukavic", nums);
    }
  }

  // --- dresy/oblečení filtry ---
  if (category === "dresy" || category === "oblečení") {
    if (apparelSize.length) query = query.in("velikost_obleceni", apparelSize.map((x) => x.toUpperCase()));
  }

  // --- oblečení typ ---
  if (category === "oblečení") {
    if (apparelType.length) query = query.in("typ_obleceni", apparelType);
  }

  const { data } = await query;
  const products = (data ?? []) as unknown as Product[];

  // --- URL helper ---
  const base = new URL("https://example.local/produkty");
  const urlFor = (up: (u: URL) => void) => {
    const u = new URL(base.toString());

    if (q) u.searchParams.set("q", q);
    if (category) u.searchParams.set("cat", category);

    if (condition.length) u.searchParams.set("cond", condition.join(","));
    if (brands.length) u.searchParams.set("brand", brands.join(","));

    if (boot.length) u.searchParams.set("boot", boot.join(","));
    if (sizeEU.length) u.searchParams.set("eu", sizeEU.join(","));

    if (apparelSize.length) u.searchParams.set("as", apparelSize.join(","));
    if (apparelType.length) u.searchParams.set("at", apparelType.join(","));

    if (gloveSize.length) u.searchParams.set("gs", gloveSize.join(","));

    up(u);
    return u.pathname + (u.search ? u.search : "");
  };

  const cats = ["kopačky", "běžecké boty", "tenisky", "rukavice", "dresy", "oblečení"];

  const showBootFilters = category === "kopačky";
  const showGloveFilters = category === "rukavice";
  const showApparelSizeFilters = category === "dresy" || category === "oblečení";
  const showApparelTypeFilters = category === "oblečení";

  return (
    <div className="container" style={{ paddingTop: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 className="h1" style={{ marginBottom: 0 }}>
          Produkty
        </h1>
        <div className="badge">{products.length} ks</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 18, alignItems: "start" }}>
        {/* FILTRY */}
        <div
          className="card"
          style={{
            position: "sticky",
            top: 86,
            maxHeight: "calc(100vh - 110px)",
            overflow: "auto",
          }}
        >
          <form action="/produkty" method="get" className="filters">
            <input name="q" defaultValue={q} placeholder="Hledat (název / kód / značka)..." />
            <button className="btn" type="submit">
              Hledat
            </button>

            {/* zachovej parametry */}
            {category ? <input type="hidden" name="cat" value={category} /> : null}
            {condition.length ? <input type="hidden" name="cond" value={condition.join(",")} /> : null}
            {brands.length ? <input type="hidden" name="brand" value={brands.join(",")} /> : null}
            {boot.length ? <input type="hidden" name="boot" value={boot.join(",")} /> : null}
            {sizeEU.length ? <input type="hidden" name="eu" value={sizeEU.join(",")} /> : null}
            {apparelSize.length ? <input type="hidden" name="as" value={apparelSize.join(",")} /> : null}
            {apparelType.length ? <input type="hidden" name="at" value={apparelType.join(",")} /> : null}
            {gloveSize.length ? <input type="hidden" name="gs" value={gloveSize.join(",")} /> : null}
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

            {/* Značka */}
            <details>
              <summary style={{ fontWeight: 800, cursor: "pointer" }}>Značka</summary>
              <div className="filters" style={{ marginTop: 10, maxHeight: 240, overflow: "auto", paddingRight: 6 }}>
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

            {/* Kopačky */}
            {showBootFilters ? (
              <>
                <details open>
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

                <details>
                  <summary style={{ fontWeight: 800, cursor: "pointer" }}>Velikost EU</summary>
                  <div className="filters" style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {allSizesEU.map((s) => {
                      const ss = formatEUSize(s);
                      return (
                        <Link
                          key={ss}
                          className={"btn" + (sizeEU.includes(ss) ? " btnPrimary" : "")}
                          href={urlFor((u) => qpSet(u, "eu", toggle(sizeEU, ss)))}
                        >
                          EU {ss}
                        </Link>
                      );
                    })}
                  </div>
                </details>
              </>
            ) : null}

            {/* Rukavice */}
            {showGloveFilters ? (
              <details open>
                <summary style={{ fontWeight: 800, cursor: "pointer" }}>Velikost rukavic</summary>
                <div className="filters" style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(allGloveSizes.length ? allGloveSizes : [...GLOVE_SIZES]).map((s) => {
                    const ss = String(s);
                    return (
                      <Link
                        key={ss}
                        className={"btn" + (gloveSize.includes(ss) ? " btnPrimary" : "")}
                        href={urlFor((u) => qpSet(u, "gs", toggle(gloveSize, ss)))}
                      >
                        {ss}
                      </Link>
                    );
                  })}
                </div>
              </details>
            ) : null}

            {/* Dresy / Oblečení */}
            {showApparelSizeFilters ? (
              <details open>
                <summary style={{ fontWeight: 800, cursor: "pointer" }}>Velikost</summary>
                <div className="filters" style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(allApparelSizes.length ? allApparelSizes : [...APPAREL_SIZES]).map((s) => (
                    <Link
                      key={s}
                      className={"btn" + (apparelSize.includes(s) ? " btnPrimary" : "")}
                      href={urlFor((u) => qpSet(u, "as", toggle(apparelSize, s)))}
                    >
                      {s}
                    </Link>
                  ))}
                </div>
              </details>
            ) : null}

            {/* Oblečení typ */}
            {showApparelTypeFilters ? (
              <details>
                <summary style={{ fontWeight: 800, cursor: "pointer" }}>Typ oblečení</summary>
                <div className="filters" style={{ marginTop: 10, maxHeight: 220, overflow: "auto", paddingRight: 6 }}>
                  {allApparelTypes.length ? (
                    allApparelTypes.map((t) => (
                      <Link
                        key={t}
                        className={"btn" + (apparelType.includes(t) ? " btnPrimary" : "")}
                        href={urlFor((u) => qpSet(u, "at", toggle(apparelType, t)))}
                      >
                        {t}
                      </Link>
                    ))
                  ) : (
                    <div className="small muted">Doplň v adminu pár typů (mikina/bunda/…), pak se tu ukážou.</div>
                  )}
                </div>
              </details>
            ) : null}
          </div>
        </div>

        {/* PRODUKTY */}
        <div className="productGrid">
          {products.map((p: any) => (
            <Link key={p.id} href={`/p/${p.slug}`} className="card product">
              <div className="thumb">
                <img
                  src={p.image_url || `https://loremflickr.com/800/800/football,boots?lock=${p.id}`}
                  alt={p.name}
                  style={{ width: "100%", height: "220px", objectFit: "cover" }}
                />
              </div>

              <div style={{ fontWeight: 800, lineHeight: 1.25 }}>{p.nazev ?? p.name}</div>

              <div className="tagRow">
                <span className="tag">{p.kategorie ?? p.category}</span>
                {p.znacka ? <span className="tag">{p.znacka}</span> : null}
                {p.boot_type ? <span className="tag">{p.boot_type}</span> : null}
                {p.size_eu ? <span className="tag">EU {formatEUSize(Number(p.size_eu))}</span> : null}
                {p.velikost_rukavic ? <span className="tag">Rukavice {p.velikost_rukavic}</span> : null}
                {p.velikost_obleceni ? <span className="tag">{String(p.velikost_obleceni).toUpperCase()}</span> : null}
                {p.typ_obleceni ? <span className="tag">{p.typ_obleceni}</span> : null}
                {p.status === "reserved" || p.stav === "reserved" ? <span className="tag">rezervováno</span> : null}
              </div>

              <div className="priceRow">
                <span className="price">{Math.round(p.prodejni_cena ?? p.sale_price)} Kč</span>
              </div>

              <div className="small">Kód: {p.kod_produktu ?? p.article_code}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
