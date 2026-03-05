"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  id: string;
  name: string;
  article_code: string | null;
  brand: string | null;
  category: string | null;

  velikost_obleceni: string | null;
  typ_obleceni: string | null;
  velikost_rukavic: number | null;

  image_url: string | null;
  images: string[] | null;

  note: string | null;
  sale_price: number | null;
  original_price: number | null;

  status: string | null;
};

const CATEGORIES = [
  "kopačky",
  "běžecké boty",
  "tenisky",
  "rukavice",
  "dresy",
  "oblečení",
] as const;

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
const GLOVE_SIZES = [6, 7, 8, 9, 10, 11] as const;

export default function AdminProductEditClient({ id }: { id: string }) {
  const [p, setP] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          article_code,
          brand,
          category,
          velikost_obleceni,
          typ_obleceni,
          velikost_rukavic,
          image_url,
          images,
          note,
          sale_price,
          original_price,
          status
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setMsg(error.message);
        return;
      }

      setP(data as Product);
    }

    load();
  }, [id]);

  const gallery = useMemo(() => p?.images ?? [], [p]);

  async function uploadFiles(files: FileList) {
    if (!p) return;

    const urls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${p.id}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type });

      if (error) {
        console.error(error);
        continue;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      urls.push(data.publicUrl);
    }

    const merged = [...gallery, ...urls].slice(0, 10);

    setP({
      ...p,
      images: merged,
      image_url: p.image_url ?? merged[0] ?? null,
    });
  }

  function removeImage(url: string) {
    if (!p) return;

    const next = gallery.filter((x) => x !== url);

    setP({
      ...p,
      images: next,
      image_url: next[0] ?? null,
    });
  }

  async function save() {
    if (!p) return;

    setSaving(true);
    setMsg(null);

    const { error } = await supabase
      .from("products")
      .update({
        category: p.category,
        velikost_obleceni: p.velikost_obleceni,
        typ_obleceni: p.typ_obleceni,
        velikost_rukavic: p.velikost_rukavic,
        image_url: p.image_url,
        images: p.images ?? [],
        note: p.note,
        sale_price: p.sale_price,
        original_price: p.original_price,
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
      {msg && (
        <div
          style={{
            padding: 10,
            border: "1px solid #233044",
            borderRadius: 10,
          }}
        >
          {msg}
        </div>
      )}

      <div style={{ fontWeight: 800, fontSize: 18 }}>{p.name}</div>

      <label>
        Kategorie
        <select
          value={p.category ?? ""}
          onChange={(e) => setP({ ...p, category: e.target.value })}
        >
          <option value="">— vyber —</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>

      {(p.category === "oblečení" || p.category === "dresy") && (
        <label>
          Velikost
          <select
            value={p.velikost_obleceni ?? ""}
            onChange={(e) =>
              setP({ ...p, velikost_obleceni: e.target.value })
            }
          >
            <option value="">— vyber —</option>
            {APPAREL_SIZES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      )}

      {p.category === "rukavice" && (
        <label>
          Velikost rukavic
          <select
            value={p.velikost_rukavic ?? ""}
            onChange={(e) =>
              setP({
                ...p,
                velikost_rukavic: Number(e.target.value),
              })
            }
          >
            <option value="">— vyber —</option>
            {GLOVE_SIZES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      )}

      <label>
        Prodejní cena
        <input
          type="number"
          value={p.sale_price ?? ""}
          onChange={(e) =>
            setP({ ...p, sale_price: Number(e.target.value) })
          }
        />
      </label>

      <label>
        Doporučená cena
        <input
          type="number"
          value={p.original_price ?? ""}
          onChange={(e) =>
            setP({ ...p, original_price: Number(e.target.value) })
          }
        />
      </label>

      <label>
        Stav
        <select
          value={p.status ?? "available"}
          onChange={(e) => setP({ ...p, status: e.target.value })}
        >
          <option value="available">available</option>
          <option value="reserved">reserved</option>
          <option value="sold">sold</option>
        </select>
      </label>

      <label>
        Popis
        <textarea
          value={p.note ?? ""}
          onChange={(e) => setP({ ...p, note: e.target.value })}
        />
      </label>

      <div>
        <div style={{ fontWeight: 800 }}>Galerie</div>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) =>
            e.target.files && uploadFiles(e.target.files)
          }
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 8,
            marginTop: 8,
          }}
        >
          {gallery.map((url) => (
            <div
              key={url}
              style={{
                border: "1px solid #233044",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <img
                src={url}
                style={{
                  width: "100%",
                  height: 120,
                  objectFit: "cover",
                }}
              />

              <button
                type="button"
                onClick={() => removeImage(url)}
                style={{
                  width: "100%",
                  padding: 8,
                  border: 0,
                  background: "#fff",
                  cursor: "pointer",
                }}
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
        style={{
          padding: 12,
          borderRadius: 12,
          border: "1px solid #233044",
          fontWeight: 800,
        }}
      >
        {saving ? "Ukládám…" : "Uložit"}
      </button>
    </div>
  );
}
