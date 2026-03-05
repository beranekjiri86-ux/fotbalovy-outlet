"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

  condition: string | null;
  status: string | null;

  image_url: string | null;
  sale_price: number | null;
};

function numOrNull(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const PRODUCT_SELECT = [
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
].join(",");

export default function AdminProductEditClient({ id }: { id: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [p, setP] = useState<ProductRow | null>(null);

  // form state
  const [name, setName] = useState("");
  const [articleCode, setArticleCode] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");

  const [bootType, setBootType] = useState("");
  const [sizeEu, setSizeEu] = useState("");
  const [sizeUk, setSizeUk] = useState("");
  const [sizeCm, setSizeCm] = useState("");

  const [condition, setCondition] = useState("");
  const [status, setStatus] = useState("");

  const [imageUrl, setImageUrl] = useState("");
  const [salePrice, setSalePrice] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErrorMsg(null);

      const q = supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("id", id)
        .single();

      // ✅ returns() až na konci – typově data: ProductRow | null
      const { data, error } = await q.returns<ProductRow>();

      if (!alive) return;

      if (error) {
        console.error("LOAD FAILED:", error);
        setErrorMsg(error.message);
        setP(null);
        setLoading(false);
        return;
      }

      if (!data) {
        setErrorMsg("Produkt nenalezen.");
        setP(null);
        setLoading(false);
        return;
      }

      setP(data);

      // naplň formulář
      setName(data.name ?? "");
      setArticleCode(data.article_code ?? "");
      setBrand(data.brand ?? "");
      setCategory(data.category ?? "");

      setBootType(data.boot_type ?? "");
      setSizeEu(data.size_eu != null ? String(data.size_eu) : "");
      setSizeUk(data.size_uk != null ? String(data.size_uk) : "");
      setSizeCm(data.size_cm != null ? String(data.size_cm) : "");

      setCondition(data.condition ?? "");
      setStatus(data.status ?? "");

      setImageUrl(data.image_url ?? "");
      setSalePrice(data.sale_price != null ? String(data.sale_price) : "");

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!p) return;

    setSaving(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      article_code: articleCode.trim() || null,
      brand: brand.trim() || null,
      category: category.trim() || null,

      boot_type: bootType.trim() || null,
      size_eu: numOrNull(sizeEu),
      size_uk: numOrNull(sizeUk),
      size_cm: numOrNull(sizeCm),

      condition: condition.trim() || null,
      status: status.trim() || null,

      image_url: imageUrl.trim() || null,
      sale_price: numOrNull(salePrice),
    };

    const q = supabase
      .from("products")
      .update(payload)
      .eq("id", p.id)
      .select(PRODUCT_SELECT)
      .single();

    // ✅ typově data: ProductRow | null
    const { data, error } = await q.returns<ProductRow>();

    if (error) {
      console.error("UPDATE FAILED:", error);
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    if (!data) {
      setErrorMsg("Uložení proběhlo bez návratu dat (neočekávané).");
      setSaving(false);
      return;
    }

    // ✅ okamžitě promítni do UI
    setP(data);

    // ✅ přenačti případné server-cachované části
    router.refresh();

    setSaving(false);
  }

  if (loading) return <div className="small muted">Načítám…</div>;
  if (errorMsg) return <div className="small" style={{ color: "crimson" }}>{errorMsg}</div>;
  if (!p) return <div className="small muted">Produkt nenalezen.</div>;

  return (
    <form onSubmit={onSave} style={{ display: "grid", gap: 12, padding: 12 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <label className="small muted">Název</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label className="small muted">Article code</label>
          <input value={articleCode} onChange={(e) => setArticleCode(e.target.value)} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label className="small muted">Značka</label>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label className="small muted">Kategorie</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label className="small muted">Boot type</label>
          <input value={bootType} onChange={(e) => setBootType(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label className="small muted">EU</label>
          <input value={sizeEu} onChange={(e) => setSizeEu(e.target.value)} inputMode="decimal" />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label className="small muted">UK</label>
          <input value={sizeUk} onChange={(e) => setSizeUk(e.target.value)} inputMode="decimal" />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label className="small muted">CM</label>
          <input value={sizeCm} onChange={(e) => setSizeCm(e.target.value)} inputMode="decimal" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label className="small muted">Condition</label>
          <input value={condition} onChange={(e) => setCondition(e.target.value)} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label className="small muted">Status</label>
          <input value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label className="small muted">Image URL</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      </div>

      <div style={{ display: "grid", gap: 6, maxWidth: 240 }}>
        <label className="small muted">Sale price</label>
        <input value={salePrice} onChange={(e) => setSalePrice(e.target.value)} inputMode="decimal" />
      </div>

      {errorMsg ? <div className="small" style={{ color: "crimson" }}>{errorMsg}</div> : null}

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button className="btn btnPrimary" type="submit" disabled={saving}>
          {saving ? "Ukládám…" : "Uložit"}
        </button>
        <button className="btn" type="button" onClick={() => router.back()} disabled={saving}>
          Zpět
        </button>
      </div>
    </form>
  );
}
