"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Product } from "@/lib/types";

type Props = {
  initialQuery: string;
  initialCategory: string;
  initialCondition: string[];
  initialBrands: string[];
  initialBoot: string[];
  initialSizeEU: string[];
  initialApparelSize: string[];
  initialApparelType: string[];
  initialGloveSize: string[];
  products: Product[];
  allBrands: string[];
  allSizesEU: string[];
  allApparelSizes: string[];
  allApparelTypes: string[];
  allGloveSizes: number[];
  cats: string[];
};

function toggle(values: string[], v: string) {
  return values.includes(v) ? values.filter((x) => x !== v) : [...values, v];
}

function formatEUSize(n: number) {
  if (!Number.isFinite(n)) return "";
  const whole = Math.floor(n);
  if (Math.abs(n - (whole + 0.5)) < 0.02) return `${whole} 1/2`;
  if (Math.abs(n - (whole + 1 / 3)) < 0.03) return `${whole} 1/3`;
  if (Math.abs(n - (whole + 2 / 3)) < 0.03) return `${whole} 2/3`;
  return String(n).replace(".0", "");
}

function parseEUSizeLabel(s: string) {
  const t = s.trim();
  if (t.includes("1/2")) return Number(t.replace("1/2", "").trim()) + 0.5;
  if (t.includes("1/3")) return Number(t.replace("1/3", "").trim()) + 1 / 3;
  if (t.includes("2/3")) return Number(t.replace("2/3", "").trim()) + 2 / 3;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function normalizeText(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const SCROLL_KEY = "productsScroll";

export default function ProductsClient({
  initialQuery,
  initialCategory,
  initialCondition,
  initialBrands,
  initialBoot,
  initialSizeEU,
  initialApparelSize,
  initialApparelType,
  initialGloveSize,
  products,
  allBrands,
  allSizesEU,
  allApparelSizes,
  allApparelTypes,
  allGloveSizes,
  cats,
}: Props) {
  const [q, setQ] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [condition, setCondition] = useState<string[]>(initialCondition);
  const [brands, setBrands] = useState<string[]>(initialBrands);
  const [boot, setBoot] = useState<string[]>(initialBoot);
  const [sizeEU, setSizeEU] = useState<string[]>(initialSizeEU);
  const [apparelSize, setApparelSize] = useState<string[]>(initialApparelSize);
  const [apparelType, setApparelType] = useState<string[]>(initialApparelType);
  const [gloveSize, setGloveSize] = useState<string[]>(initialGloveSize);
  const [sort, setSort] = useState("price_asc");

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (!saved) return;

    const y = Number(saved);
    if (!Number.isFinite(y) || y <= 0) {
      sessionStorage.removeItem(SCROLL_KEY);
      return;
    }

    let tries = 0;
    const maxTries = 12;

    const restore = () => {
      window.scrollTo(0, y);
      tries += 1;

      if (tries >= maxTries) {
        sessionStorage.removeItem(SCROLL_KEY);
        return;
      }

      setTimeout(restore, 120);
    };

    const start = setTimeout(restore, 80);

    return () => {
      clearTimeout(start);
    };
  }, []);

  const isShoesCategory =
    category === "kopačky" ||
    category === "běžecké boty" ||
    category === "tenisky";

  const showShoesFilters = isShoesCategory;
  const showGloveFilters = category === "rukavice";
  const showApparelSizeFilters = category === "dresy" || category === "oblečení";
  const showApparelTypeFilters = category === "oblečení";

  const filteredProducts = useMemo(() => {
    const term = normalizeText(q);
    const words = term.split(/\s+/).filter(Boolean);

    let result = products.filter((p: any) => {
      if (words.length) {
        const hay = normalizeText(
          [
            p.name ?? "",
            p.article_code ?? "",
            p.brand ?? "",
            p.category ?? "",
            p.typ_obleceni ?? "",
            p.boot_type ?? "",
          ].join(" ")
        );

        const matchesAllWords = words.every((word) => hay.includes(word));
        if (!matchesAllWords) return false;
      }

      if (category && p.category !== category) return false;
      if (condition.length && !condition.includes(p.condition ?? "")) return false;
      if (brands.length && !brands.includes(p.brand ?? "")) return false;

      if (showShoesFilters) {
        if (boot.length && !boot.includes(p.boot_type ?? "")) return false;

        if (sizeEU.length) {
          const current = Number(p.size_eu);
          const labels = sizeEU.map(parseEUSizeLabel).filter((n) => Number.isFinite(n));
          if (!labels.some((n) => Math.abs(current - n) < 0.03)) return false;
        }
      }

      if (showGloveFilters && gloveSize.length) {
        if (!gloveSize.includes(String(p.velikost_rukavic ?? ""))) return false;
      }

      if (showApparelSizeFilters && apparelSize.length) {
        const current = String(p.velikost_obleceni ?? "").toUpperCase();
        if (!apparelSize.includes(current)) return false;
      }

      if (showApparelTypeFilters && apparelType.length) {
        if (!apparelType.includes(String(p.typ_obleceni ?? ""))) return false;
      }

      return true;
    });

    if (sort === "price_asc") {
      result.sort((a: any, b: any) => (a.sale_price ?? 0) - (b.sale_price ?? 0));
    }

    if (sort === "price_desc") {
      result.sort((a: any, b: any) => (b.sale_price ?? 0) - (a.sale_price ?? 0));
    }

    if (sort === "discount") {
      result.sort((a: any, b: any) => {
        const discountA = (a.original_price ?? 0) - (a.sale_price ?? 0);
        const discountB = (b.original_price ?? 0) - (b.sale_price ?? 0);
        return discountB - discountA;
      });
    }

    return result;
  }, [
    products,
    q,
    category,
    condition,
    brands,
    boot,
    sizeEU,
    apparelSize,
    apparelType,
    gloveSize,
    showShoesFilters,
    showGloveFilters,
    showApparelSizeFilters,
    showApparelTypeFilters,
    sort,
  ]);

  const backHref = useMemo(() => {
    const params = new URLSearchParams();

    const trimmedQ = q.trim();
    if (trimmedQ) params.set("q", trimmedQ);
    if (category) params.set("cat", category);
    if (condition.length) params.set("cond", condition.join(","));
    if (brands.length) params.set("brand", brands.join(","));
    if (boot.length) params.set("boot", boot.join(","));
    if (sizeEU.length) params.set("eu", sizeEU.join(","));
    if (apparelSize.length) params.set("as", apparelSize.join(","));
    if (apparelType.length) params.set("at", apparelType.join(","));
    if (gloveSize.length) params.set("gs", gloveSize.join(","));

    const qs = params.toString();
    return qs ? `/produkty?${qs}` : "/produkty";
  }, [q, category, condition, brands, boot, sizeEU, apparelSize, apparelType, gloveSize]);

  function resetFilters() {
    setQ("");
    setCategory("");
    setCondition([]);
    setBrands([]);
    setBoot([]);
    setSizeEU([]);
    setApparelSize([]);
    setApparelType([]);
    setGloveSize([]);
    setSort("price_asc");
    sessionStorage.removeItem(SCROLL_KEY);
  }

  return (
    <div className="container" style={{ paddingTop: 16, paddingBottom: 24 }}>
      <div
        className="row"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <h1 className="h1" style={{ marginBottom: 0 }}>Produkty</h1>
        <div className="badge">{filteredProducts.length} ks</div>
      </div>

      <div className="productsStickyTools">
        <div className="productsStickyToolsInner">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat produkty..."
            className="headerSearch"
            autoComplete="off"
            spellCheck={false}
          />

          <div className="productsSortWrap">
            <span className="small muted">Řazení:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="productsSortSelect"
            >
              <option value="price_asc">Od nejlevnějšího</option>
              <option value="price_desc">Od nejdražšího</option>
              <option value="discount">Dle slevy</option>
            </select>
          </div>
        </div>
      </div>

      <div className="productsLayout">
        <div className="card filtersCard">
          <button className="btn" type="button" onClick={resetFilters}>
            Reset filtrů
          </button>

          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <details open>
              <summary style={{ fontWeight: 800, cursor: "pointer" }}>Kategorie</summary>
              <div className="filters" style={{ marginTop: 10 }}>
                {cats.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={"btn" + (category === c ? " btnPrimary" : "")}
                    onClick={() => {
                      setCategory(category === c ? "" : c);
                      setBoot([]);
                      setSizeEU([]);
                      setApparelSize([]);
                      setApparelType([]);
                      setGloveSize([]);
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </details>

            <details open>
              <summary style={{ fontWeight: 800, cursor: "pointer" }}>Stav</summary>
              <div className="filters" style={{ marginTop: 10 }}>
                {(["nové", "použité"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={"btn" + (condition.includes(c) ? " btnPrimary" : "")}
                    onClick={() => setCondition(toggle(condition, c))}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </details>

            <details open>
              <summary style={{ fontWeight: 800, cursor: "pointer" }}>Značka</summary>
              {allBrands.length ? (
                <div className="filters" style={{ marginTop: 10, maxHeight: 260, overflow: "auto", paddingRight: 6 }}>
                  {allBrands.map((b) => (
                    <button
                      key={b}
                      type="button"
                      className={"btn" + (brands.includes(b) ? " btnPrimary" : "")}
                      onClick={() => setBrands(toggle(brands, b))}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              ) : null}
            </details>

            {showShoesFilters ? (
              <>
                <details open>
                  <summary style={{ fontWeight: 800, cursor: "pointer" }}>Typ / povrch</summary>
                  <div className="filters" style={{ marginTop: 10 }}>
                    {(["FG", "AG", "SG", "TF", "IC"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={"btn" + (boot.includes(t) ? " btnPrimary" : "")}
                        onClick={() => setBoot(toggle(boot, t))}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </details>

                <details>
                  <summary style={{ fontWeight: 800, cursor: "pointer" }}>Velikost EU</summary>
                  <div className="filters" style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {allSizesEU.map((label) => (
                      <button
                        key={label}
                        type="button"
                        className={"btn" + (sizeEU.includes(label) ? " btnPrimary" : "")}
                        onClick={() => setSizeEU(toggle(sizeEU, label))}
                      >
                        EU {label}
                      </button>
                    ))}
                  </div>
                </details>
              </>
            ) : null}

            {showGloveFilters ? (
              <details open>
                <summary style={{ fontWeight: 800, cursor: "pointer" }}>Velikost rukavic</summary>
                <div className="filters" style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(allGloveSizes.length ? allGloveSizes : [6, 7, 8, 9, 10, 11]).map((s) => {
                    const ss = String(s);
                    return (
                      <button
                        key={ss}
                        type="button"
                        className={"btn" + (gloveSize.includes(ss) ? " btnPrimary" : "")}
                        onClick={() => setGloveSize(toggle(gloveSize, ss))}
                      >
                        {ss}
                      </button>
                    );
                  })}
                </div>
              </details>
            ) : null}

            {showApparelSizeFilters ? (
              <details open>
                <summary style={{ fontWeight: 800, cursor: "pointer" }}>Velikost</summary>
                <div className="filters" style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {allApparelSizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={"btn" + (apparelSize.includes(s) ? " btnPrimary" : "")}
                      onClick={() => setApparelSize(toggle(apparelSize, s))}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </details>
            ) : null}

            {showApparelTypeFilters ? (
              <details>
                <summary style={{ fontWeight: 800, cursor: "pointer" }}>Typ oblečení</summary>
                {allApparelTypes.length ? (
                  <div className="filters" style={{ marginTop: 10, maxHeight: 220, overflow: "auto", paddingRight: 6 }}>
                    {allApparelTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className={"btn" + (apparelType.includes(t) ? " btnPrimary" : "")}
                        onClick={() => setApparelType(toggle(apparelType, t))}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : null}
              </details>
            ) : null}
          </div>
        </div>

        <div className="productGrid productsGridMobile">
          {filteredProducts.map((p: any) => (
            <Link
              key={p.id}
              href={`/p/${p.slug}?back=${encodeURIComponent(backHref)}`}
              className="card productCardLarge"
              onClick={() => {
                sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
              }}
            >
          <div className="productThumbLarge">

  {p.image_url ? (
    <img
      src={p.image_url}
      alt={p.name}
      loading="lazy"
      onError={(e)=>{
        e.currentTarget.style.display="none"
      }}
    />
  ) : (
    <div className="productThumbPlaceholder">
      Bez fotky
    </div>
  )}

</div>

              <div
                style={{
                  fontWeight: 800,
                  lineHeight: 1.3,
                  fontSize: 15,
                  minHeight: 40,
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {p.name}
              </div>

              <div className="tagRow" style={{ marginTop: 8 }}>
                <span className="tag">{p.category}</span>
                {p.brand ? <span className="tag">{p.brand}</span> : null}
                {p.boot_type ? <span className="tag">{p.boot_type}</span> : null}
                {p.size_eu ? <span className="tag">EU {formatEUSize(Number(p.size_eu))}</span> : null}
                {p.velikost_rukavic ? <span className="tag">Rukavice {p.velikost_rukavic}</span> : null}
                {p.velikost_obleceni ? <span className="tag">{String(p.velikost_obleceni).toUpperCase()}</span> : null}
                {p.typ_obleceni ? <span className="tag">{p.typ_obleceni}</span> : null}
                {p.condition ? <span className="tag">{p.condition}</span> : null}
                {p.status === "reserved" ? <span className="tag">rezervováno</span> : null}
              </div>

              <div className="priceRow" style={{ marginTop: 10 }}>
                <span className="price">{Math.round(p.sale_price)} Kč</span>
                {p.original_price ? <span className="priceOld">{Math.round(p.original_price)} Kč</span> : null}
              </div>

              <div className="small" style={{ marginTop: 6 }}>Kód: {p.article_code}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
