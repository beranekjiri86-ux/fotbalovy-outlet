"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readCart, removeFromCart, CartItem } from "@/lib/cart";

export default function Kosik() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => { setItems(readCart()); }, []);

  const total = useMemo(() => items.reduce((s, x) => s + (x.sale_price || 0), 0), [items]);

  return (
    <div className="grid" style={{gap:16, paddingTop:16}}>
      <div className="card">
        <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
          <h1 className="h1" style={{marginBottom:0}}>Košík</h1>
          <div className="badge">{items.length} ks</div>
        </div>
        {items.length === 0 ? (
          <div className="muted" style={{marginTop:10}}>
            Košík je prázdný. <Link href="/produkty" className="btn" style={{marginLeft:8}}>Vybrat produkty</Link>
          </div>
        ) : (
          <>
            <div className="hr" />
            <table className="table">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Cena</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.product_id}>
                    <td>
                      <div style={{fontWeight:700}}><Link href={`/p/${i.slug}`}>{i.name}</Link></div>
                      <div className="small">
                        {i.size_eu ? `EU ${String(i.size_eu).replace(".0","")}` : ""} {i.boot_type ? `• ${i.boot_type}` : ""} {i.condition ? `• ${i.condition}` : ""}
                      </div>
                    </td>
                    <td style={{whiteSpace:"nowrap"}}>{Math.round(i.sale_price)} Kč</td>
                    <td>
                      <button className="btn" onClick={() => setItems(removeFromCart(i.product_id))}>Odebrat</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="hr" />
            <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
              <div style={{fontWeight:800}}>Celkem: {Math.round(total)} Kč</div>
              <Link className="btn btnPrimary" href="/checkout">Pokračovat k objednávce</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
