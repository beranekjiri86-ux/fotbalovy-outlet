"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  id: string;
  kod: string;
  nazev: string;
  kod_produktu: string | null;
  znacka: string | null;

  kategorie: string | null;

  // ✅ NOVÉ
  velikost_obleceni: string | null; // XS..XXXL
  typ_obleceni: string | null; // mikina/bunda/...
  velikost_rukavic: number | null; // 6..11

  image_url: string | null;
  images: string[] | null;
  poznamka: string | null;
  prodejni_cena: number | null;
  doporucena_cena: number | null;
  stav: string | null;
};

const CATEGORIES = ["kopačky", "běžecké boty", "tenisky", "rukavice", "dresy", "oblečení"] as const;
const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
const GLOVE_SIZES = [6, 7, 8, 9, 10, 11] as const;

export default function AdminProductEditClient({ id }: { id: string }) {
  const [p, setP] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id,kod,nazev,kod_produktu,znacka,kategorie,velikost_obleceni,typ_obleceni,velikost_rukavic,image_url,images,poznamka,prodejni_cena,doporucena_cena,stav"
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setMsg(error.message);
        return;
      }

      setP(data as Product);
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

  function removeImage(url: string) {
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
        kategorie: p.kategorie,

        // ✅ NOVÉ
        velikost_obleceni: p.velikost_obleceni,
        typ_obleceni: p.typ_obleceni,
        velikost_rukavic: p.velikost_rukavic,

        image_url: p.image_url,
        images: p.images ?? [],
        poznamka: p.poznamka,
        prodejni_cena: p.prodejni_cena,
        doporucena_cena: p.doporucena_cena,
        stav: p.stav,
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
      {msg ? (
        <div style={{ padding: 10, border: "1px solid #eee", borderRadius: 10 }}>
          {msg}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>{p.nazev}</div>
        <div style={{ opacity: 0.7, fontSize: 13 }}>
          {p.znacka ?? ""} • {p.kod_produktu ?? ""}
        </div>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        Kategorie
        <select
          value={p.kategorie ?? ""}
          onChange={(e) => setP({ ...p, kategorie: e.target.value || null })}
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
        >
          <option value="">— vyber —</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {/* ✅ Oblečení / Dresy */}
      {(p.kategorie === "oblečení" || p.kategorie === "dresy") ? (
        <>
          <label style={{ display: "grid", gap: 6 }}>
            Velikost (oblečení/dres)
            <select
              value={p.velikost_obleceni ?? ""}
              onChange={(e) => setP({ ...p, velikost_obleceni: e.target.value || null })}
              style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
            >
              <option value="">— vyber —</option>
              {APPAREL_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          {p.kategorie === "oblečení" ? (
            <label style={{ display: "grid", gap: 6 }}>
              Typ oblečení (např. mikina/bunda/tričko…)
              <input
                value={p.typ_obleceni ?? ""}
                onChange={(e) => setP({ ...p, typ_obleceni: e.target.value || null })}
                placeholder="mikina"
                style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
              />
            </label>
          ) : null}
        </>
      ) : null}

      {/* ✅ Rukavice */}
      {p.kategorie === "rukavice" ? (
        <label style={{ display: "grid", gap: 6 }}>
          Velikost rukavic (6–11)
          <select
            value={p.velikost_rukavic ?? ""}
            onChange={(e) =>
              setP({ ...p, velikost_rukavic: e.target.value === "" ? null : Number(e.target.value) })
            }
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
          >
            <option value="">— vyber —</option>
            {GLOVE_SIZES.map((s) => (
              <option key={s} value={String(s)}>
                {s}
              </option>
            ))}
          </select>
        </label>
      ) : null}

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
          value={p.prodejni_cena ?? ""}
          onChange={(e) =>
            setP({ ...p, prodejni_cena: e.target.value === "" ? null : Number(e.target.value) })
          }
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        Doporučená cena
        <input
          type="number"
          value={p.doporucena_cena ?? ""}
          onChange={(e) =>
            setP({ ...p, doporucena_cena: e.target.value === "" ? null : Number(e.target.value) })
          }
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        Stav
        <select
          value={p.stav ?? "available"}
          onChange={(e) => setP({ ...p, stav: e.target.value })}
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
          value={p.poznamka ?? ""}
          onChange={(e) => setP({ ...p, poznamka: e.target.value })}
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
                type="button"
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
        type="button"
        onClick={save}
        disabled={saving}
        style={{ padding: 12, borderRadius: 12, border: "1px solid #ddd", fontWeight: 800 }}
      >
        {saving ? "Ukládám…" : "Uložit"}
      </button>
    </div>
  );
}
