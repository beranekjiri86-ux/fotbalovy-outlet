"use client";

import { useMemo, useState } from "react";
import { Product } from "@/lib/types";
import { addToCart } from "@/lib/cart";
import Link from "next/link";

export default function AddToCart({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const disabled = product.status !== "available";

  const item = useMemo(() => ({
    product_id: product.id,
    slug: product.slug,
    name: product.name,
    size_eu: product.size_eu,
    brand: product.brand,
    category: product.category,
    boot_type: product.boot_type,
    condition: product.condition,
    sale_price: product.sale_price,
    image_url: product.image_url,
  }), [product]);

  return (
    <div className="grid" style={{gap:10}}>
      <button
        className={"btn " + (disabled ? "" : "btnPrimary")}
        disabled={disabled}
        onClick={() => { addToCart(item); setAdded(true); }}
        title={disabled ? "Tento produkt není skladem (rezervováno/prodáno)" : "Přidat do košíku"}
      >
        {disabled ? "Není skladem (rezervováno)" : added ? "Přidáno ✔" : "Přidat do košíku"}
      </button>
      <Link className="btn" href="/kosik">Přejít do košíku</Link>
      <div className="small">Produkty jsou po objednávce automaticky rezervované na 24h.</div>
    </div>
  );
}
