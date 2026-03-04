"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ProductRow = {
  id: string;
  name: string;
  article_code: string | null;
  brand: string | null;
  image_url: string | null;
  sale_price: number | null;
};

const LIMIT = 500;

export default function AdminProductsClient() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => q.trim(), [q]);

  // debounce (rychlejší admin)
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);

      const base = supabase
        .from("products")
        .select("id,name,article_code,brand,image_url,sale_price")
        .order("name", { ascending: true })
        .limit(LIMIT);

      const { data, error } =
        debouncedQuery.length === 0
          ? await base
          : await supabase
              .from("products")
              .select("id,name,article_code,brand,image_url,sale_price")
              .or(
                `name.ilike.%${debouncedQuery}%,article_code.ilike.%${debouncedQuery}%,brand.ilike.%${debouncedQuery}%`
              )
              .order("name", { ascending: true })
              .limit(LIMIT);

      if (!alive) return;

      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows((data as ProductRow[]) ?? []);
      }

      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, [debouncedQuery]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* vyhledávání */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Hledej název, kód nebo značku (např. Nike, Mercurial, DJ4977)"
        style={{
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 10,
          fontSize: 14,
        }}
      />

      {loading ? <div>Načítám…</div> : null}

      <div style={{ opacity: 0.65, fontSize: 13 }}>
        Zobrazuji max {LIMIT} položek {debouncedQuery ? `pro „${debouncedQuery}“` : ""}.
      </div>

      {/* seznam produktů */}
      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((p) => (
          <Link
            key={p.id}
            href={`/admin/produkty/${p.id}`}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 12,
              textDecoration: "none",
              color: "inherit",
              transition: "all .15s ease",
              background: "#fff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#ddd";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.borderColor = "#eee";
            }}
          >
            {/* fotka */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 10,
                overflow: "hidden",
                background: "#f3f3f3",
                flexShrink: 0,
              }}
            >
              {p.image_url ? (
                <img
                  src={p.image_url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : null}
            </div>

            {/* text */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  fontSize: 15,
                }}
              >
                {p.name}
              </div>

              <div
                style={{
                  opacity: 0.65,
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {p.brand ?? ""} {p.article_code ?? ""}
              </div>
            </div>

            {/* cena */}
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                whiteSpace: "nowrap",
              }}
            >
              {p.sale_price != null ? `${p.sale_price} Kč` : ""}
            </div>
          </Link>
        ))}
      </div>

      {!loading && rows.length === 0 ? (
        <div style={{ opacity: 0.6, fontSize: 14 }}>
          Žádné produkty nebyly nalezeny.
        </div>
      ) : null}
    </div>
  );
}
