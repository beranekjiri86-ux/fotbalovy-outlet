"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ProductRow = {
  id: string;
  name: string;
  slug: string | null;
  article_code: string | null;
  brand: string | null;
  category: string | null;

  boot_type: string | null;
  size_eu: number | null;
  size_uk: number | null;
  size_cm: number | null;

  condition: string | null;
  status: string | null;

  sale_price: number | null;
  original_price: number | null;

  note: string | null;

  image_url: string | null;
  images: string[] | null;

  velikost_rukavic: number | null;
  velikost_obleceni: string | null;
  typ_obleceni: string | null;
};

const CATEGORIES = ["kopačky", "běžecké boty", "tenisky", "rukavice", "dresy", "oblečení"] as const;
const CONDITIONS = ["nové", "použité"] as const;
const STATUSES = ["available", "reserved", "sold"] as const;
const BOOT_TYPES = ["FG", "AG", "SG", "TF", "IC"] as const;
const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
const GLOVE_SIZES = [6, 7, 8, 9, 10, 11] as const;

function isShoesCategory(cat: string | null) {
  return cat === "kopačky" || cat === "běžecké boty" || cat === "tenisky";
}

function formatEUSize(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "";
  const whole = Math.floor(n);
  if (Math.abs(n - (whole + 0.5)) < 0.02) return `${whole} 1/2`;
  if (Math.abs(n - (whole + 1 / 3)) < 0.03) return `${whole} 1/3`;
  if (Math.abs(n - (whole + 2 / 3)) < 0.03) return `${whole} 2/3`;
  return String(n).replace(".0", "");
}

function badgeStyle(active?: boolean) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: active ? "rgba(34,197,94,.12)" : "transparent",
    color: active ? "var(--text)" : "var(--muted)",
    fontSize: 12,
    whiteSpace: "normal" as const,
    wordBreak: "break-word" as const,
    maxWidth: "100%",
  };
}

export default function AdminProductsClient() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [status, setStatus] = useState("");
  const [brand, setBrand] = useState("");
  const [bootType, setBootType] = useState("");
  const [sizeEU, setSizeEU] = useState("");
  const [gloveSize, setGloveSize] = useState("");
  const [apparelSize, setApparelSize] = useState("");
  const [apparelType, setApparelType] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("products")
        .select(
          [
            "id",
            "name",
            "slug",
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
            "velikost_rukavic",
            "velikost_obleceni",
            "typ_obleceni",
          ].join(",")
        )
        .order("name", { ascending: true })
        .limit(1000);

      if (!alive) return;

      if (error) {
        console.error(error);
        setRows([]);
        setLoading(false);
        return;
      }

      setRows(((data ?? []) as unknown) as ProductRow[]);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth > 768) {
        setShowFilters(false);
      }
    };

    closeOnDesktop();
    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!showFilters) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [showFilters]);

  const allBrands = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.brand).filter(Boolean) as string[])).sort((a, b) =>
      a.localeCompare(b, "cs")
    );
  }, [rows]);

  const allApparelTypes = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.typ_obleceni).filter(Boolean) as string[])).sort((a, b) =>
      a.localeCompare(b, "cs")
    );
  }, [rows]);

  const allShoesSizes = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .map((r) => r.size_eu)
          .filter((x): x is number => x != null && Number.isFinite(x))
      )
    ).sort((a, b) => a - b);
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();

    return rows.filter((p) => {
      if (term) {
        const hay = [
          p.name,
          p.article_code ?? "",
          p.brand ?? "",
          p.note ?? "",
          p.category ?? "",
          p.typ_obleceni ?? "",
          p.boot_type ?? "",
        ]
          .join(" ")
          .toLowerCase();

        if (!hay.includes(term)) return false;
      }

      if (category && p.category !== category) return false;
      if (condition && p.condition !== condition) return false;
      if (status && p.status !== status) return false;
      if (brand && p.brand !== brand) return false;

      if (category && isShoesCategory(category)) {
        if (bootType && p.boot_type !== bootType) return false;

        if (sizeEU) {
          const wanted = Number(sizeEU.replace(",", "."));
          if (!Number.isFinite(wanted) || p.size_eu !== wanted) return false;
        }
      }

      if (category === "rukavice") {
        if (gloveSize) {
          const wanted = Number(gloveSize);
          if (!Number.isFinite(wanted) || p.velikost_rukavic !== wanted) return false;
        }
      }

      if (category === "dresy" || category === "oblečení") {
        if (apparelSize && String(p.velikost_obleceni ?? "").toUpperCase() !== apparelSize.toUpperCase()) {
          return false;
        }
      }

      if (category === "oblečení") {
        if (apparelType && (p.typ_obleceni ?? "") !== apparelType) return false;
      }

      return true;
    });
  }, [rows, q, category, condition, status, brand, bootType, sizeEU, gloveSize, apparelSize, apparelType]);

  const resetFilters = () => {
    setQ("");
    setCategory("");
    setCondition("");
    setStatus("");
    setBrand("");
    setBootType("");
    setSizeEU("");
    setGloveSize("");
    setApparelSize("");
    setApparelType("");
  };

  const showShoesFilters = isShoesCategory(category);
  const showGloveFilters = category === "rukavice";
  const showApparelSizeFilters = category === "dresy" || category === "oblečení";
  const showApparelTypeFilters = category === "oblečení";

  const activeFiltersCount = [
    category,
    condition,
    status,
    brand,
    bootType,
    sizeEU,
    gloveSize,
    apparelSize,
    apparelType,
  ].filter(Boolean).length;

  return (
    <div style={{ display: "grid", gap: 12, width: "100%", minWidth: 0 }}>
      <div className="adminProductsTopBar">
        <div style={{ display: "grid", gap: 10, width: "100%", minWidth: 0 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledej: název / kód / značka / popis"
            style={{ width: "100%", minWidth: 0 }}
          />

          <div className="adminProductsMobileActions">
            <button
              type="button"
              className="btn"
              onClick={() => setShowFilters(true)}
            >
              Filtry{activeFiltersCount ? ` (${activeFiltersCount})` : ""}
            </button>

            <Link className="btn btnPrimary" href="/admin/produkty/new">
              + Nový produkt
            </Link>
          </div>
        </div>
      </div>

      {showFilters ? (
        <div
          className="adminFilterBackdrop"
          onClick={() => setShowFilters(false)}
        />
      ) : null}

            <div
        className={`adminFilterDrawer ${showFilters ? "open" : ""}`}
        aria-hidden={!showFilters}
      >
        <div className="adminFilterDrawerInner">
          <div className="adminFilterDrawerHeader">
            <div className="drawerHandle" />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 18 }}>Filtry</div>

              <button
                type="button"
                className="btn"
                onClick={() => setShowFilters(false)}
              >
                ✕
              </button>
            </div>
          </div>

          <div
            className="card adminFiltersCard"
            style={{
              display: "grid",
              gap: 10,
              width: "100%",
              minWidth: 0,
            }}
          >
            <div
              className="adminDesktopActions"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 10,
                width: "100%",
                minWidth: 0,
              }}
            >
              <Link className="btn btnPrimary" href="/admin/produkty/new">
                + Nový produkt
              </Link>

              <button type="button" className="btn" onClick={resetFilters}>
                Reset filtrů
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 10,
                width: "100%",
                minWidth: 0,
              }}
            >
              <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                Kategorie
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setBootType("");
                    setSizeEU("");
                    setGloveSize("");
                    setApparelSize("");
                    setApparelType("");
                  }}
                >
                  <option value="">Vše</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                Stav
                <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="">Vše</option>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                Status
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">Vše</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                Značka
                <select value={brand} onChange={(e) => setBrand(e.target.value)}>
                  <option value="">Vše</option>
                  {allBrands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="small muted">
              Zobrazuji: <b>{filtered.length}</b> položek {loading ? "• Načítám..." : ""}
            </div>

            {showShoesFilters ? (
              <div
                className="card"
                style={{ display: "grid", gap: 10, padding: 12, background: "transparent", minWidth: 0 }}
              >
                <div style={{ fontWeight: 800 }}>Filtry pro kopačky / běžecké boty / tenisky</div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: 10,
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                    Typ povrchu
                    <select value={bootType} onChange={(e) => setBootType(e.target.value)}>
                      <option value="">Vše</option>
                      {BOOT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                    Velikost EU
                    <select value={sizeEU} onChange={(e) => setSizeEU(e.target.value)}>
                      <option value="">Vše</option>
                      {allShoesSizes.map((s) => (
                        <option key={String(s)} value={String(s)}>
                          {formatEUSize(s)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="small muted" style={{ alignSelf: "end" }}>
                    Filtrování pro boty
                  </div>
                </div>
              </div>
            ) : null}

            {showGloveFilters ? (
              <div
                className="card"
                style={{ display: "grid", gap: 10, padding: 12, background: "transparent", minWidth: 0 }}
              >
                <div style={{ fontWeight: 800 }}>Filtry pro rukavice</div>
                <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  Velikost rukavic
                  <select value={gloveSize} onChange={(e) => setGloveSize(e.target.value)}>
                    <option value="">Vše</option>
                    {GLOVE_SIZES.map((s) => (
                      <option key={s} value={String(s)}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {showApparelSizeFilters ? (
              <div
                className="card"
                style={{ display: "grid", gap: 10, padding: 12, background: "transparent", minWidth: 0 }}
              >
                <div style={{ fontWeight: 800 }}>Filtry pro dresy / oblečení</div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: 10,
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                    Velikost oblečení
                    <select value={apparelSize} onChange={(e) => setApparelSize(e.target.value)}>
                      <option value="">Vše</option>
                      {APPAREL_SIZES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>

                  {showApparelTypeFilters ? (
                    <label style={{ display: "grid", gap: 6, minWidth: 0 }}>
                      Typ oblečení
                      <select value={apparelType} onChange={(e) => setApparelType(e.target.value)}>
                        <option value="">Vše</option>
                        {allApparelTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="adminFilterDrawerFooter">
              <button
                type="button"
                className="btn"
                onClick={resetFilters}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn btnPrimary"
                onClick={() => setShowFilters(false)}
              >
                Zobrazit {filtered.length} položek
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, width: "100%", minWidth: 0 }}>
        {filtered.map((p) => {
          const showShoes = isShoesCategory(p.category);
          const eu = formatEUSize(p.size_eu);
          const uk = p.size_uk != null ? String(p.size_uk).replace(".0", "") : "";
          const cm = p.size_cm != null ? String(p.size_cm).replace(".0", "") : "";
          const notePreview = (p.note ?? "").trim();

          return (
            <Link
              key={p.id}
              href={`/admin/produkty/${p.id}`}
              className="card"
              style={{
                display: "grid",
                gridTemplateColumns: "64px minmax(0, 1fr)",
                gap: 12,
                alignItems: "start",
                padding: 12,
                textDecoration: "none",
                width: "100%",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#0e1522",
                  border: "1px solid var(--border)",
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

              <div style={{ minWidth: 0, display: "grid", gap: 8 }}>
                <div style={{ display: "grid", gap: 6, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 900,
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                    }}
                  >
                    {p.name}
                  </div>

                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 15,
                    }}
                  >
                    {p.sale_price != null ? `${Math.round(p.sale_price)} Kč` : ""}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                    minWidth: 0,
                  }}
                >
                  <span style={badgeStyle()}>{p.category ?? "—"}</span>
                  {p.brand ? <span style={badgeStyle()}>{p.brand}</span> : null}
                  {p.article_code ? <span style={badgeStyle()}>{p.article_code}</span> : null}
                  {p.condition ? <span style={badgeStyle()}>{p.condition}</span> : null}
                  {p.status ? (
                    <span style={badgeStyle(p.status === "reserved")} title="available / reserved / sold">
                      {p.status}
                    </span>
                  ) : null}

                  {showShoes ? (
                    <>
                      {p.boot_type ? <span style={badgeStyle(true)}>{p.boot_type}</span> : null}
                      {eu ? <span style={badgeStyle()}>EU {eu}</span> : null}
                      {uk ? <span style={badgeStyle()}>UK {uk}</span> : null}
                      {cm ? <span style={badgeStyle()}>{cm} cm</span> : null}
                    </>
                  ) : null}

                  {p.category === "rukavice" && p.velikost_rukavic ? (
                    <span style={badgeStyle()}>Rukavice {p.velikost_rukavic}</span>
                  ) : null}

                  {(p.category === "dresy" || p.category === "oblečení") && p.velikost_obleceni ? (
                    <span style={badgeStyle()}>{String(p.velikost_obleceni).toUpperCase()}</span>
                  ) : null}

                  {p.category === "oblečení" && p.typ_obleceni ? (
                    <span style={badgeStyle(true)}>{p.typ_obleceni}</span>
                  ) : null}
                </div>

                {notePreview ? (
                  <div
                    className="small muted"
                    style={{
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                    }}
                  >
                    {notePreview.length > 180 ? `${notePreview.slice(0, 180)}...` : notePreview}
                  </div>
                ) : (
                  <div className="small muted">Bez popisu.</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
