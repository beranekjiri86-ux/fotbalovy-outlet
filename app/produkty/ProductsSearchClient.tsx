"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ProductItem = {
  id: string;
  slug: string;
  name: string;
  article_code?: string | null;
  brand?: string | null;
  category?: string | null;
  boot_type?: string | null;
  size_eu?: number | null;
  velikost_rukavic?: number | null;
  velikost_obleceni?: string | null;
  typ_obleceni?: string | null;
  condition?: string | null;
  status?: string | null;
  sale_price?: number | null;
  original_price?: number | null;
  image_url?: string | null;
};

function formatEUSize(n: number) {
  if (!Number.isFinite(n)) return "";
  const whole = Math.floor(n);
  if (Math.abs(n - (whole + 0.5)) < 0.02) return `${whole} 1/2`;
  if (Math.abs(n - (whole + 1 / 3)) < 0.03) return `${whole} 1/3`;
  if (Math.abs(n - (whole + 2 / 3)) < 0.03) return `${whole} 2/3`;
  return String(n).replace(".0", "");
}

export default function ProductsSearchClient({
  products,
  initialQuery = "",
}: {
  products: ProductItem[];
  initialQuery?: string;
}) {
  const [q, setQ] = useState(initialQuery);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;

    return products.filter((p) => {
      const hay = [
        p.name ?? "",
        p.article_code ?? "",
        p.brand ?? "",
        p.category ?? "",
        p.boot_type ?? "",
        p.typ_obleceni ?? "",
        p.velikost_obleceni ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(term);
    });
  }, [products, q]);

  return (
    <>
      <div className="filters">
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Hledat (název / kód / značka)..."
          autoComplete="off"
          spellCheck={false}
        />
        <div className="small muted">
          Zobrazeno <b>{filtered.length}</b> z <b>{products.length}</b> produktů
        </div>
      </div>

      <div className="productGrid productsGridMobile" style={{ marginTop: 16 }}>
        {filtered.map((p) => (
          <Link key={p.id} href={`/p/${p.slug}`} className="card productCardLarge">
            <div className="productThumbLarge">
              <img
                src={p.image_url || "/no-photo.png"}
                alt={p.name}
                loading="lazy"
              />
            </div>

            <div style={{ fontWeight: 800, lineHeight: 1.3, fontSize: 15, minHeight: 40 }}>
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
              <span className="price">{Math.round(Number(p.sale_price ?? 0))} Kč</span>
              {p.original_price ? <span className="priceOld">{Math.round(Number(p.original_price))} Kč</span> : null}
            </div>

            <div className="small" style={{ marginTop: 6 }}>
              Kód: {p.article_code}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
