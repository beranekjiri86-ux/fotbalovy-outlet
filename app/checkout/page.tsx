"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCart, clearCart, CartItem } from "@/lib/cart";

type Payment = "dobirka" | "prevod" | "domluva";
type Shipping = "zasilkovna" | "ppl_dpd" | "osobni" | "domluva";

export default function Checkout() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ orderNumber: string } | null>(null);
  const [error, setError] = useState<string>("");

  const [payment, setPayment] = useState<Payment>("dobirka");
  const [shipping, setShipping] = useState<Shipping>("zasilkovna");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => { setItems(readCart()); }, []);
  const total = useMemo(() => items.reduce((s, x) => s + (x.sale_price || 0), 0), [items]);

  async function submit() {
    setError("");
    if (!items.length) { setError("Košík je prázdný."); return; }
    if (!name || !email || !phone) { setError("Vyplň jméno, e-mail a telefon."); return; }
    if (shipping !== "osobni" && shipping !== "domluva") {
      if (!line1 || !city || !zip) { setError("Vyplň doručovací adresu."); return; }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          payment, shipping,
          customer: { name, email, phone, line1, city, zip },
          note,
          items: items.map(i => ({ product_id: i.product_id }))
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Chyba při odeslání objednávky");
      setDone({ orderNumber: data.order_number });
      clearCart();
    } catch (e:any) {
      setError(e.message ?? "Něco se nepovedlo");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card" style={{marginTop:16}}>
        <h1 className="h1">Objednávka odeslána ✅</h1>
        <p className="muted">Číslo objednávky: <b>{done.orderNumber}</b></p>

        <div className="notice">
          <div style={{fontWeight:700}}>Rezervace</div>
          <div className="small">Položky jsou nyní rezervované na 24 hodin.</div>
        </div>

        <div className="hr" />
        <h2 className="h2">Další kroky</h2>
        <ul className="muted" style={{paddingLeft:18}}>
          <li>Dobírka: platba při převzetí.</li>
          <li>Převod: účet {process.env.NEXT_PUBLIC_SUPABASE_URL ? (process.env as any).SHOP_BANK_ACCOUNT : ""} • VS = číslo objednávky.</li>
          <li>Domluva: napiš nám na Instagram / zavolej a uveď číslo objednávky.</li>
        </ul>

        <div className="row" style={{marginTop:12}}>
          <Link className="btn btnPrimary" href="/produkty">Zpět na produkty</Link>
          <Link className="btn" href="/">Domů</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid2 grid" style={{gap:16, paddingTop:16}}>
      <div className="card">
        <h1 className="h1">Objednávka</h1>
        {items.length === 0 ? (
          <p className="muted">Košík je prázdný. <Link href="/produkty">Vyber produkty</Link>.</p>
        ) : (
          <>
            <table className="table">
              <thead><tr><th>Položka</th><th>Cena</th></tr></thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.product_id}>
                    <td><b>{i.name}</b><div className="small">{i.size_eu ? `EU ${String(i.size_eu).replace(".0","")}` : ""}</div></td>
                    <td style={{whiteSpace:"nowrap"}}>{Math.round(i.sale_price)} Kč</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="hr" />
            <div style={{fontWeight:800}}>Celkem: {Math.round(total)} Kč</div>
          </>
        )}

        <div className="hr" />
        <h2 className="h2">Platba</h2>
        <div className="row">
          <label className="btn"><input type="radio" name="pay" checked={payment==="dobirka"} onChange={()=>setPayment("dobirka")} /> Dobírka</label>
          <label className="btn"><input type="radio" name="pay" checked={payment==="prevod"} onChange={()=>setPayment("prevod")} /> Převod</label>
          <label className="btn"><input type="radio" name="pay" checked={payment==="domluva"} onChange={()=>setPayment("domluva")} /> Domluva</label>
        </div>

        <div className="hr" />
        <h2 className="h2">Doprava</h2>
        <div className="row">
          <label className="btn"><input type="radio" name="ship" checked={shipping==="zasilkovna"} onChange={()=>setShipping("zasilkovna")} /> Zásilkovna</label>
          <label className="btn"><input type="radio" name="ship" checked={shipping==="ppl_dpd"} onChange={()=>setShipping("ppl_dpd")} /> PPL/DPD</label>
          <label className="btn"><input type="radio" name="ship" checked={shipping==="osobni"} onChange={()=>setShipping("osobni")} /> Osobní</label>
          <label className="btn"><input type="radio" name="ship" checked={shipping==="domluva"} onChange={()=>setShipping("domluva")} /> Dle domluvy</label>
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Kontaktní údaje</h2>
        <div className="grid" style={{gap:10}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Jméno a příjmení *" />
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail *" />
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Telefon *" />
        </div>

        <div className="hr" />
        <h2 className="h2">Doručovací adresa</h2>
        <div className="grid" style={{gap:10}}>
          <input value={line1} onChange={e=>setLine1(e.target.value)} placeholder="Ulice a číslo" />
          <div className="row">
            <input value={city} onChange={e=>setCity(e.target.value)} placeholder="Město" style={{flex:1, minWidth:180}} />
            <input value={zip} onChange={e=>setZip(e.target.value)} placeholder="PSČ" style={{width:140}} />
          </div>
        </div>

        <div className="hr" />
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Poznámka (volitelné)" rows={4} style={{width:"100%"}} />

        {error ? <div className="notice" style={{borderColor:"#ef4444", marginTop:12}}><div style={{fontWeight:700}}>Chyba</div><div className="small">{error}</div></div> : null}

        <div className="row" style={{marginTop:12}}>
          <button className="btn btnPrimary" disabled={loading} onClick={submit}>{loading ? "Odesílám..." : "Odeslat objednávku"}</button>
          <Link className="btn" href="/kosik">Zpět do košíku</Link>
        </div>

        <div className="hr" />
        <div className="notice">
          <div style={{fontWeight:700}}>Kontaktovat</div>
          <div className="small">
            Když zvolíš „Domluva“, pošli nám zprávu na Instagram / zavolej a uveď číslo objednávky.
          </div>
        </div>
      </div>
    </div>
  );
}
