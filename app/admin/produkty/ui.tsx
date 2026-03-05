"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ProductRow = {
  id: string;
  name: string;
  article_code: string | null;
  brand: string | null;
  category: string | null;

  boot_type: string | null;
  size_eu: number | null;
  size_uk: number | null;
  size_cm: number | null;

  condition: string | null; // nové/použité
  status: string | null; // available/reserved/sold

  image_url: string | null;
  sale_price: number | null;
};

function isShoesCategory(cat: string | null) {
  return cat === "kopačky" || cat === "běžecké boty" || cat === "tenisky";
}

/** EU velikosti jako zlomek: 41.5 -> 41 1/2, 41.33 -> 41 1/3, 41.67 -> 41 2/3 */
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
    whiteSpace: "nowrap" as const,
  };
}

// Supabase "or" filter string je citlivý na čárky, závorky apod.
// Tohle je jednoduché, praktické minimum pro fulltext-like vyhledávání přes ilike.
function escapeForIlike(input: string) {
  // escape backslash + uvozovky a odstraň nejproblematičtější oddělovače v or() syntaxi
  return input
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll(",", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .trim();
}

export default function AdminProductsClient() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);

  // stránkování (pro 500+)
  const PAGE_SIZE = 50;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // debounce, ať to není pomalé/žravé
  const query = useMemo(() => q.trim(), [q]);
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // když se změní dotaz, resetni stránkování + hasMore
  useEffect(() => {
    setPage(0);
    setHasMore(true);
  }, [debounced]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let s = supabase
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
            "image_url",
            "sale_price",
          ].join(",")
        )
        .order("name", { ascending: true })
        .range(from, to)
        // ✅ Tohle odstraní TS uniony typu GenericStringError[] atd.
        .returns<ProductRow[]>();

      if (debounced.length > 0) {
        const term = escapeForIlike(debounced);

        // hledání v názvu/kódu/značce (vždy používej EN názvy sloupců z DB)
        // Pozn.: ilike s %...% je ok, ale dávej pozor na special chars v term.
        s = s.or(
          `name.ilike.%${term}%,article_code.ilike.%${term}%,brand.ilike.%${term}%`
        );
      }

      const { data, error } = await s;

      if (!alive) return;

      if (error) {
        console.error(error);
        setRows([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      const incoming = data ?? [];

      setHasMore(incoming.length === PAGE_SIZE);

      if (page === 0) setRows(incoming);
      else setRows((prev) => [...prev, ...incoming]);

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [debounced, page]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        className="card"
        style={{
          display: "grid",
          gap: 10,
          position: "sticky",
          top: 86,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledej: název / kód (article_code) / značka"
            style={{ flex: 1 }}
          />
          <Link className="btn btnPrimary" href="/admin/produkty/new">
            + Nový produkt
          </Link>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span className="small muted">
            Zobrazuji: <b>{rows.length}</b> {rows.length === 1 ? "položku" : "položek"}
            {debounced ? (
              <>
                {" "}
                • filtr: <b>{debounced}</b>
              </>
            ) : null}
          </span>
          {loading ? <span className="small muted">Načítám…</span> : null}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((p) => {
          const showShoes = isShoesCategory(p.category);
          const eu = formatEUSize(p.size_eu);
          const uk = p.size_uk != null ? String(p.size_uk).replace(".0", "") : "";
          const cm = p.size_cm != null ? String(p.size_cm).replace(".0", "") : "";

          return (
            <Link
              key={p.id}
              href={`/admin/produkty/${p.id}`}
              className="card"
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                padding: 12,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
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
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : null}
              </div>

              <div style={{ flex: 1, display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 900, lineHeight: 1.2 }}>{p.name}</div>

                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={badgeStyle()}>{p.category ?? "—"}</span>
                  {p.brand ? <span style={badgeStyle()}>{p.brand}</span> : null}
                  {p.article_code ? <span style={badgeStyle()}>{p.article_code}</span> : null}
                  {p.condition ? <span style={badgeStyle()}>{p.condition}</span> : null}
                  {p.status ? (
                    <span
                      style={badgeStyle(p.status === "reserved")}
                      title="available / reserved / sold"
                    >
                      {p.status}
                    </span>
                  ) : null}

                  {/* BOTY: boot_type + velikosti */}
                  {showShoes ? (
                    <>
                      {p.boot_type ? <span style={badgeStyle(true)}>{p.boot_type}</span> : null}
                      {eu ? <span style={badgeStyle()}>EU {eu}</span> : null}
                      {uk ? <span style={badgeStyle()}>UK {uk}</span> : null}
                      {cm ? <span style={badgeStyle()}>{cm} cm</span> : null}
                    </>
                  ) : null}
                </div>
              </div>

              <div style={{ fontWeight: 900, whiteSpace: "nowrap" }}>
                {p.sale_price != null ? `${Math.round(p.sale_price)} Kč` : ""}
              </div>
            </Link>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "6px 0 18px" }}>
        {hasMore ? (
          <button
            type="button"
            className="btn"
            disabled={loading}
            onClick={() => setPage((x) => x + 1)}
          >
            {loading ? "Načítám…" : "Načíst další"}
          </button>
        ) : (
          <div className="small muted">Konec seznamu.</div>
        )}
      </div>
    </div>
  );
}
