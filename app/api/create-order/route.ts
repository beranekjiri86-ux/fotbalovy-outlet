import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

type Body = {
  payment: "dobirka" | "prevod" | "domluva";
  shipping: "zasilkovna" | "ppl_dpd" | "osobni" | "domluva";
  customer: { name: string; email: string; phone: string; line1?: string; city?: string; zip?: string };
  note?: string;
  items: { product_id: number }[];
};

function orderNumber() {
  // e.g. FO-20260303-AB12
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  const rand = Math.random().toString(36).slice(2,6).toUpperCase();
  return `FO-${y}${m}${day}-${rand}`;
}

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  export const getSupabaseServerClient = createSupabaseServerClient;
export const getSupabaseBrowserClient = createSupabaseBrowserClient;
  const body = (await req.json()) as Body;

  if (!body?.items?.length) {
    return NextResponse.json({ error: "Košík je prázdný." }, { status: 400 });
  }

  const on = orderNumber();

  // Load prices from DB to prevent tampering
  const ids = body.items.map(i => i.product_id);
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, sale_price, status")
    .in("id", ids);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const prodMap = new Map((products ?? []).map(p => [p.id, p]));
  const missing = ids.filter(id => !prodMap.has(id));
  if (missing.length) return NextResponse.json({ error: "Některé položky už nejsou dostupné." }, { status: 400 });

  const unavailable = (products ?? []).filter(p => p.status !== "available");
  if (unavailable.length) {
    return NextResponse.json({ error: "Některé položky už nejsou skladem (rezervováno/prodáno)." }, { status: 409 });
  }

  const total = (products ?? []).reduce((s, p:any) => s + Number(p.sale_price || 0), 0);

  const { data: order, error: oErr } = await supabase
    .from("orders")
    .insert({
      order_number: on,
      status: body.payment === "domluva" ? "needs_contact" : "new",
      payment: body.payment,
      shipping: body.shipping,
      customer_name: body.customer.name,
      customer_email: body.customer.email,
      customer_phone: body.customer.phone,
      address_line1: body.customer.line1 || null,
      address_city: body.customer.city || null,
      address_zip: body.customer.zip || null,
      note: body.note || null,
      total,
    })
    .select("id, order_number")
    .single();

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

  const itemsRows = ids.map(id => ({
    order_id: order.id,
    product_id: id,
    unit_price: Number((prodMap.get(id) as any).sale_price || 0),
    qty: 1,
  }));

  const { error: iErr } = await supabase.from("order_items").insert(itemsRows);
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  // Trigger in DB will reserve products after insert into orders (after order exists)
  // However the trigger runs on insert into orders; order_items inserted after.
  // We therefore also reserve here explicitly to match items:
  await supabase.from("products").update({
    status: "reserved",
    reserved_until: new Date(Date.now() + 24*60*60*1000).toISOString(),
  }).in("id", ids);

  return NextResponse.json({ order_number: order.order_number });
}
