"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type ProductRow = {
  id: string;
  nazev: string;
  kod_produktu: string | null;
  znacka: string | null;
  image_url: string | null;
  prodejni_cena: number | null; // uprav názvy podle DB
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
        .select("id,name,article_code,brand,image_url,sale_price")
        .order("name", { ascending: true })
        .limit(200);

      const { data, error } =
        query.length === 0
          ? await base
          : await supabase
              .from("products")
              .select("id,name,article_code,brand,image_url,sale_price")
              .or(`name.ilike.%${query}%,article_code.ilike.%${query}%`)
              .order("name", { ascending: true })
              .limit(200);

      if (!alive) return;
      if (error) {
        console.error(error);
        setRows([]);
      } else {
        setRows((data as any) ?? []);
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
            <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", background: "#f3f3f3" }}>
              {p.image_url ? (
                <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : null}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, lineHeight: 1.2 }}>{p.name}</div>
              <div style={{ opacity: 0.75, fontSize: 13 }}>
                {p.brand ?? ""} {p.article_code ?? ""}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
