"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Product = {
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

  sale_price: number | null;
  original_price: number | null;

  note: string | null;

  image_url: string | null;
  images: string[] | null;

  velikost_rukavic: number | null;
  velikost_obleceni: string | null;
  typ_obleceni: string | null;
};

const CATEGORIES = ["kopačky", "běžecké boty", "tenisky", "rukavice", "dresy", "oblečení"] as const;
const CONDITIONS = ["nové", "použité"] as const;
const STATUSES = ["available", "reserved", "sold"] as const;
const BOOT_TYPES = ["FG", "AG", "SG", "TF", "IC"] as const;

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
const GLOVE_SIZES = [6, 7, 8, 9, 10, 11] as const;

function isShoesCategory(cat: string | null) {
  return cat === "kopačky" || cat === "běžecké boty" || cat === "tenisky";
}

function makeEmptyProduct(): Product {
  return {
    id: "new",
    name: "",
    article_code: null,
    brand: null,
    category: null,

    boot_type: null,
    size_eu: null,
    size_uk: null,
    size_cm: null,

    condition: null,
    status: "available",

    sale_price: null,
    original_price: null,

    note: null,

    image_url: null,
    images: [],

    velikost_rukavic: null,
    velikost_obleceni: null,
    typ_obleceni: null,
  };
}

export default function AdminProductEditClient({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === "new";

  const [p, setP] = useState<Product | null>(isNew ? makeEmptyProduct() : null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;

    let alive = true;
    (async () => {
      setMsg(null);

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
            "sale_price",
            "original_price",
            "note",
            "image_url",
            "images",
            "velikost_rukavic",
            "velikost_obleceni",
            "typ_obleceni",
          ].join(",")
        )
        .eq("id", id)
        .single();

      if (!alive) return;

      if (error) {
        console.error(error);
        setMsg(error.message);
        return;
      }

      const normalized: Product = {
        ...(data as any),
        images: Array.isArray((data as any).images) ? (data as any).images : [],
      };

      setP(normalized);
    })();

    return () => {
      alive = false;
    };
  }, [id, isNew]);

  const gallery = useMemo(() => (p?.images ?? []) as string[], [p]);

  async function persistImages(nextImages: string[], nextThumb: string | null) {
    if (!p || p.id === "new") return;

    const { data: saved, error: dbErr } = await supabase
      .from("products")
      .update({ images: nextImages, image_url: nextThumb })
      .eq("id", p.id)
      .select("images,image_url")
      .single();

    if (dbErr) {
      console.error("DB UPDATE IMAGES ERROR:", dbErr);
      setMsg(`DB update selhal: ${dbErr.message}`);
      return;
    }

    setP({
      ...p,
      images: (saved as any).images ?? [],
      image_url: (saved as any).image_url ?? null,
    });
  }

  async function uploadFiles(files: FileList | null) {
    if (!p) return;

    if (!files || files.length === 0) {
      setMsg("Nebyl vybrán žádný soubor.");
      return;
    }

    if (p.id === "new") {
      setMsg("Nejdřív vytvoř produkt, potom můžeš nahrávat fotky.");
      return;
    }

    try {
      const list = Array.from(files);
      setMsg(`Nahrávám ${list.length} fotek...`);

      const newUrls: string[] = [];

      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        setMsg(`Nahrávám ${i + 1}/${list.length}: ${file.name}`);

        const ext = file.name.split(".").pop() || "jpg";
        const path = `${p.id}/${crypto.randomUUID()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file, { upsert: false, contentType: file.type || "image/jpeg" });

        if (upErr) {
          console.error("UPLOAD ERROR:", upErr);
          setMsg(`Upload selhal: ${upErr.message}`);
          return;
        }

        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }

      if (newUrls.length === 0) {
        setMsg("Nenahrála se žádná fotka (0 URL).");
        return;
      }

      const current = Array.isArray(p.images) ? p.images : [];
      const merged = [...current, ...newUrls].slice(0, 10);
      const thumb = p.image_url || merged[0] || null;

      setMsg("Ukládám odkazy do DB...");
      await persistImages(merged, thumb);

      setMsg(`Hotovo: nahráno ${newUrls.length} fotek`);
    } catch (e: any) {
      console.error("UPLOAD EXCEPTION:", e);
      setMsg(`Chyba při uploadu: ${e?.message ?? "neznámá chyba"}`);
    }
  }

  async function removeImage(url: string) {
    if (!p) return;
    const next = gallery.filter((x) => x !== url);
    const thumb = next[0] ?? null;

    setP({ ...p, images: next, image_url: thumb });
    await persistImages(next, thumb);
  }

  async function save() {
    if (!p) return;

    setSaving(true);
    setMsg(null);

    const payload = {
      name: p.name.trim(),
      article_code: p.article_code?.trim() || null,
      brand: p.brand?.trim() || null,
      category: p.category || null,

      boot_type: isShoesCategory(p.category) ? (p.boot_type || null) : null,
      size_eu: isShoesCategory(p.category) ? (p.size_eu ?? null) : null,
      size_uk: isShoesCategory(p.category) ? (p.size_uk ?? null) : null,
      size_cm: isShoesCategory(p.category) ? (p.size_cm ?? null) : null,

      condition: p.condition || null,
      status: p.status || "available",
      sale_price: p.sale_price ?? null,
      original_price: p.original_price ?? null,

      note: p.note?.trim() || null,
      image_url: p.image_url?.trim() || null,
      images: p.images ?? [],

      velikost_rukavic: p.category === "rukavice" ? (p.velikost_rukavic ?? null) : null,
      velikost_obleceni:
        p.category === "dresy" || p.category === "oblečení" ? (p.velikost_obleceni || null) : null,
      typ_obleceni: p.category === "oblečení" ? (p.typ_obleceni?.trim() || null) : null,
    };

    try {
      if (isNew) {
        if (!payload.name) {
          setMsg("Vyplň název produktu.");
          return;
        }

        const { data, error } = await supabase.from("products").insert(payload).select("id").single();

        if (error) {
          console.error(error);
          setMsg(error.message);
          return;
        }

        setMsg("Vytvořeno. Teď můžeš přidat fotky.");
        router.replace(`/admin/produkty/${(data as any).id}`);
        router.refresh();
        return;
      }

      const { error } = await supabase.from("products").update(payload).eq("id", p.id);

      if (error) {
        console.error(error);
        setMsg(error.message);
      } else {
        setMsg("Uloženo.");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!p) return <div>Načítám...</div>;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {msg ? (
        <div style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 12, background: "var(--card)" }}>
          {msg}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>{isNew ? "Nový produkt" : p.name}</div>
        <div style={{ opacity: 0.8, fontSize: 13 }}>
          {p.brand ?? ""} {p.article_code ? `• ${p.article_code}` : ""}
        </div>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        Název
        <input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Kód artiklu
          <input value={p.article_code ?? ""} onChange={(e) => setP({ ...p, article_code: e.target.value || null })} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Značka
          <input value={p.brand ?? ""} onChange={(e) => setP({ ...p, brand: e.target.value || null })} />
        </label>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        Kategorie
        <select value={p.category ?? ""} onChange={(e) => setP({ ...p, category: e.target.value || null })}>
          <option value="">- vyber -</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {/* Fotky */}
      <div className="card" style={{ display: "grid", gap: 10, padding: 12 }}>
        <div style={{ fontWeight: 800 }}>Fotky (max 10)</div>

        {p.id === "new" ? (
          <div className="small muted">Nejdřív vytvoř produkt, potom můžeš nahrávat fotky.</div>
        ) : (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = e.currentTarget.files;

              if (!files || files.length === 0) {
                setMsg("Nebyl vybrán žádný soubor.");
                return;
              }

              setMsg(`Vybráno: ${Array.from(files).map((f) => f.name).join(", ")}`);

              const copy = files;

              setTimeout(() => {
                uploadFiles(copy);
                e.currentTarget.value = "";
              }, 50);
            }}
          />
        )}

        {gallery.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {gallery.map((url) => (
              <div key={url} style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                />
                <button
                  type="button"
                  className="btn"
                  style={{ width: "100%", borderRadius: 0, border: 0, borderTop: "1px solid var(--border)" }}
                  onClick={() => removeImage(url)}
                >
                  Smazat
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="small muted">Zatím žádné fotky.</div>
        )}
      </div>

      <button type="button" onClick={save} disabled={saving} className="btn btnPrimary" style={{ padding: 12 }}>
        {saving ? (isNew ? "Vytvářím..." : "Ukládám...") : isNew ? "Vytvořit produkt" : "Uložit změny"}
      </button>
    </div>
  );
}
