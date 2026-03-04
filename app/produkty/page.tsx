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
  if (Array.isArray(v)) return v.flatMap(x => x.split(",")).filter(Boolean);
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
  return values.includes(v) ? values.filter(x => x !== v) : [...values, v];
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
    supabase.from("products").select("brand").not("brand","is", null),
    supabase.from("products").select("size_eu").not("size_eu","is", null),
  ]);

  const allBrands = Array.from(new Set((brandsRows ?? []).map(r => (r as any).brand).filter(Boolean))).sort();
  const allSizes = Array.from(new Set((sizesRows ?? []).map(r => (r as any).size_eu).filter((x:any)=>x!==null))).sort((a:any,b:any)=>a-b);

  let query = supabase
    .from("products")
    .select("*")
    .in("status", ["available","reserved"])
    .order("sale_price", { ascending: true });

  if (q) query = query.ilike("name", `%${q}%`);
  if (category) query = query.eq("category", category);
  if (condition.length) query = query.in("condition", condition);
  if (brands.length) query = query.in("brand", brands);
  if (boot.length) query = query.in("boot_type", boot);
  if (size.length) query = query.in("size_eu", size.map(s => Number(s)));

  const { data } = await query;
  const products = (data ?? []) as unknown as Product[];

  const base = new URL("https://example.local/produkty");
  // UI state urls
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

  const cats = ["kopačky","běžecké boty","tenisky"];

  return (
    <div className="grid" style={{gap:16, paddingTop:16}}>
      <div className="card">
        <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
          <h1 className="h1" style={{marginBottom:0}}>Produkty</h1>
          <div className="badge">{products.length} ks</div>
        </div>
        <div className="filters" style={{marginTop:12}}>
          <div className="row">
            <input name="q" defaultValue={q} placeholder="Hledat (název / kód)..." style={{flex:1, minWidth:240}} />
            <button className="btn" formAction="/produkty" formMethod="get">Hledat</button>
          </div>

          <div className="row">
            {cats.map(c => (
              <Link key={c}
                className={"btn" + (category===c ? " btnPrimary" : "")}
                href={urlFor(u => qpSet(u, "cat", category===c ? "" : c))}
              >
                {c}
              </Link>
            ))}
            <Link className="btn" href={urlFor(u => { u.search = ""; })}>Reset</Link>
          </div>

          <div className="row">
            {(["nové","použité"] as const).map(c => (
              <Link key={c} className={"btn" + (condition.includes(c) ? " btnPrimary" : "")}
                href={urlFor(u => qpSet(u, "cond", toggle(condition, c)))}
              >
                {c}
              </Link>
            ))}
            {(["FG","AG","SG","TF","IC"] as const).map(t => (
              <Link key={t} className={"btn" + (boot.includes(t) ? " btnPrimary" : "")}
                href={urlFor(u => qpSet(u, "boot", toggle(boot, t)))}
              >
                {t}
              </Link>
            ))}
          </div>

          <div className="row">
            <select
              defaultValue={brands[0] ?? ""}
              name="brand_select"
              style={{minWidth:220}}
            >
              <option value="">Značka (rychlý výběr)</option>
              {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <span className="small">Tip: pro více značek klikni níže.</span>
          </div>

          <div className="row" style={{gap:8}}>
            {allBrands.slice(0, 18).map(b => (
              <Link key={b} className={"btn" + (brands.includes(b) ? " btnPrimary" : "")}
                href={urlFor(u => qpSet(u, "brand", toggle(brands, b)))}
              >
                {b}
              </Link>
            ))}
          </div>

          <div className="row" style={{gap:8}}>
            {allSizes.slice(0, 22).map(s => (
              <Link key={String(s)} className={"btn" + (size.includes(String(s)) ? " btnPrimary" : "")}
                href={urlFor(u => qpSet(u, "eu", toggle(size, String(s))))}
              >
                EU {String(s).replace(".0","")}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="productGrid">
        {products.map(p => (
          <Link key={p.id} href={`/p/${p.slug}`} className="card product">
            <div className="thumb">
              {p.image_url ? <img src={p.image_url} alt={p.name} /> : <span className="muted">Bez fotky</span>}
            </div>
            <div style={{fontWeight:800, lineHeight:1.25}}>{p.name}</div>
            <div className="tagRow">
              <span className="tag">{p.category}</span>
              {p.brand ? <span className="tag">{p.brand}</span> : null}
              {p.boot_type ? <span className="tag">{p.boot_type}</span> : null}
              {p.size_eu ? <span className="tag">EU {String(p.size_eu).replace(".0","")}</span> : null}
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
  );
}
