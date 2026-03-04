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

export default function AdminProductsClient() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => q.trim(), [q]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);

      const base = supabase
        .from("products")
        .select("id,nazev,kod_produktu,znacka,image_url,prodejni_cena")
        .order("nazev", { ascending: true })
        .limit(200);

      const { data, error } =
        query.length === 0
          ? await base
          : await supabase
              .from("products")
              .select("id,nazev,kod_produktu,znacka,image_url,prodejni_cena")
              .or(`nazev.ilike.%${query}%,kod_produktu.ilike.%${query}%`)
              .order("nazev", { ascending: true })
              .limit(200);

      if (!alive) return;

      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows((data as ProductRow[]) ?? []);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [query]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Hledej podle názvu nebo kódu (např. DJ4977-780)"
        style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
      />

      {loading ? <div>Načítám…</div> : null}

      <div style={{ display: "grid", gap: 10 }}>
        {rows.map((p) => (
          <Link
            key={p.id}
            href={`/admin/produkty/${p.id}`}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 12,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
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
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : null}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, lineHeight: 1.2 }}>{p.nazev}</div>
              <div style={{ opacity: 0.75, fontSize: 13 }}>
                {p.znacka ?? ""} {p.kod_produktu ?? ""}
              </div>
            </div>

            <div style={{ fontWeight: 800 }}>
              {p.prodejni_cena != null ? `${p.prodejni_cena} Kč` : ""}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
