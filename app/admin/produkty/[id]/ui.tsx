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

export default function AdminProductEditClient({ id }: { id: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [p, setP] = useState<ProductRow | null>(null);

  // form state (jednoduše jako stringy)
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

      const { data, error } = await supabase
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
        .eq("id", id)
        .single();

      if (!alive) return;

      if (error) {
        console.error("LOAD FAILED:", error);
        setErrorMsg(error.message);
        setP(null);
        setLoading(false);
        return;
      }

      const row = data as ProductRow;
      setP(row);

      // naplň formulář
      setName(row.name ?? "");
      setArticleCode(row.article_code ?? "");
      setBrand(row.brand ?? "");
      setCategory(row.category ?? "");

      setBootType(row.boot_type ?? "");
      setSizeEu(row.size_eu != null ? String(row.size_eu) : "");
      setSizeUk(row.size_uk != null ? String(row.size_uk) : "");
      setSizeCm(row.size_cm != null ? String(row.size_cm) : "");

      setCondition(row.condition ?? "");
      setStatus(row.status ?? "");

      setImageUrl(row.image_url ?? "");
      setSalePrice(row.sale_price != null ? String(row.sale_price) : "");

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

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", p.id)
      // ✅ Tohle je důležité: vrátí ti reálně uložený řádek
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
      .single();

    if (error) {
      console.error("UPDATE FAILED:", error);
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    const updated = data as ProductRow;

    // ✅ Okamžitě promítni do UI (ať vidíš změny hned bez reloadu)
    setP(updated);

    // ✅ Pokud někde výš/list používá Server Components, tohle to přenačte
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
