"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  kod: string;
  nazev: string;
  kod_produktu: string | null;
  znacka: string | null;
  image_url: string | null;
  fotky: string[] | null;
  poznamka: string | null;
  prodejni_cena: number | null;
  doporucena_cna: number | null;
  stav: string | null;
};

export default function AdminProductEditClient({ id }: { id: string }) {
  const [p, setP] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,article_code,brand,image_url,images,note,sale_price,recommended_price,status")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setMsg(error.message);
        return;
      }
      setP(data as any);
    })();
  }, [id]);

  const gallery = useMemo(() => p?.images ?? [], [p]);

  async function uploadFiles(files: FileList) {
    if (!p) return;
    setMsg(null);

    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${p.id}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: false, contentType: file.type });

      if (upErr) {
        console.error(upErr);
        setMsg(upErr.message);
        continue;
      }

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }

    const merged = [...gallery, ...newUrls].slice(0, 10);
    const thumb = p.image_url || merged[0] || null;

    setP({ ...p, images: merged, image_url: thumb });
    setMsg(`Nahráno: ${newUrls.length} fotek`);
  }

  async function removeImage(url: string) {
    if (!p) return;
    const next = gallery.filter((x) => x !== url);
    const thumb = next[0] ?? null;
    setP({ ...p, images: next, image_url: thumb });
  }

  async function save() {
    if (!p) return;
    setSaving(true);
    setMsg(null);

    const { error } = await supabase
      .from("products")
      .update({
        image_url: p.image_url,
        images: p.images ?? [],
        note: p.note,
        sale_price: p.sale_price,
        recommended_price: p.recommended_price,
        status: p.status,
      })
      .eq("id", p.id);

    setSaving(false);

    if (error) {
      console.error(error);
      setMsg(error.message);
    } else {
      setMsg("Uloženo ✅");
    }
  }

  if (!p) return <div>Načítám…</div>;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {msg ? <div style={{ padding: 10, border: "1px solid #eee", borderRadius: 10 }}>{msg}</div> : null}

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>{p.name}</div>
        <div style={{ opacity: 0.7, fontSize: 13 }}>
          {p.brand ?? ""} • {p.article_code ?? ""}
        </div>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        Náhledová fotka (image_url)
        <input
          value={p.image_url ?? ""}
          onChange={(e) => setP({ ...p, image_url: e.target.value || null })}
          placeholder="URL"
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        Prodejní cena
        <input
          type="number"
          value={p.sale_price ?? ""}
          onChange={(e) => setP({ ...p, sale_price: e.target.value === "" ? null : Number(e.target.value) })}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        Doporučená cena
        <input
          type="number"
          value={p.recommended_price ?? ""}
          onChange={(e) =>
            setP({ ...p, recommended_price: e.target.value === "" ? null : Number(e.target.value) })
          }
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        Status
        <select
          value={p.status ?? "available"}
          onChange={(e) => setP({ ...p, status: e.target.value })}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
        >
          <option value="available">available</option>
          <option value="reserved">reserved</option>
          <option value="sold">sold</option>
        </select>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        Popis / poznámka
        <textarea
          value={p.note ?? ""}
          onChange={(e) => setP({ ...p, note: e.target.value })}
          rows={5}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
        />
      </label>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>Galerie (max 10)</div>
        <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && uploadFiles(e.target.files)} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {gallery.map((url) => (
            <div key={url} style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
              <img src={url} alt="" style={{ width: "100%", height: 120, objectFit: "cover" }} />
              <button
                onClick={() => removeImage(url)}
                style={{ width: "100%", padding: 8, border: 0, background: "#fff", cursor: "pointer" }}
              >
                Smazat
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", fontWeight: 800 }}
      >
        {saving ? "Ukládám…" : "Uložit"}
      </button>
    </div>
  );
}
