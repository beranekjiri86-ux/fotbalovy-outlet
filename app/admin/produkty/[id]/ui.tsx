"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  id: string;
  slug: string | null;

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

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .trim();
}

function makeEmptyProduct(): Product {
  return {
    id: "new",
    slug: null,

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
            "slug",
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

      setP({
        ...(data as any),
        images: Array.isArray((data as any).images) ? (data as any).images : [],
      });
    })();

    return () => {
      alive = false;
    };
  }, [id, isNew]);

  const gallery = useMemo(() => p?.images ?? [], [p]);

  async function persistImages(nextImages: string[], nextThumb: string | null) {
    if (!p || p.id === "new") return;

    const { data, error } = await supabase
      .from("products")
      .update({ images: nextImages, image_url: nextThumb })
      .eq("id", p.id)
      .select("images,image_url")
      .single();

    if (error) {
      console.error(error);
      setMsg(`Uložení fotek selhalo: ${error.message}`);
      return;
    }

    setP({
      ...p,
      images: ((data as any).images ?? []) as string[],
      image_url: ((data as any).image_url ?? null) as string | null,
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
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${p.id}/${crypto.randomUUID()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file, {
            upsert: false,
            contentType: file.type || "image/jpeg",
          });

        if (upErr) {
          console.error(upErr);
          setMsg(`Upload selhal: ${upErr.message}`);
          return;
        }

        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }

      const merged = [...gallery, ...newUrls].slice(0, 10);
      const thumb = p.image_url || merged[0] || null;

      setP({ ...p, images: merged, image_url: thumb });
      await persistImages(merged, thumb);

      setMsg(`Hotovo: nahráno ${newUrls.length} fotek`);
    } catch (e: any) {
      console.error(e);
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

    const baseSlug = slugify(
      [
        p.name,
        p.article_code ?? "",
        p.brand ?? "",
        p.size_eu != null ? `eu${String(p.size_eu).replace(".", "")}` : "",
        p.condition ?? "",
      ]
        .filter(Boolean)
        .join(" ")
    );

    const payload = {
      slug: baseSlug || null,

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

        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();

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
        <div
          style={{
            padding: 10,
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--card)",
          }}
        >
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
        <input
          value={p.name}
          onChange={(e) => setP({ ...p, name: e.target.value })}
          placeholder="Např. Nike Mercurial Vapor 15"
        />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Kód artiklu
          <input
            value={p.article_code ?? ""}
            onChange={(e) => setP({ ...p, article_code: e.target.value || null })}
            placeholder="DJ4977-780"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Značka
          <input
            value={p.brand ?? ""}
            onChange={(e) => setP({ ...p, brand: e.target.value || null })}
            placeholder="Nike / adidas / Puma"
          />
        </label>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        Kategorie
        <select value={p.category ?? ""} onChange={(e) => setP({ ...p, category: e.target.value || null })}>
          <option value="">— vyber —</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {isShoesCategory(p.category) ? (
        <div className="card" style={{ display: "grid", gap: 10, padding: 12 }}>
          <div style={{ fontWeight: 800 }}>Kopačky / běžecké boty / tenisky</div>

          <label style={{ display: "grid", gap: 6 }}>
            Typ povrchu
            <select value={p.boot_type ?? ""} onChange={(e) => setP({ ...p, boot_type: e.target.value || null })}>
              <option value="">— vyber —</option>
              {BOOT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              EU
              <input
                type="number"
                step="0.01"
                value={p.size_eu ?? ""}
                onChange={(e) => setP({ ...p, size_eu: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              UK
              <input
                type="number"
                step="0.01"
                value={p.size_uk ?? ""}
                onChange={(e) => setP({ ...p, size_uk: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              CM
              <input
                type="number"
                step="0.1"
                value={p.size_cm ?? ""}
                onChange={(e) => setP({ ...p, size_cm: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </label>
          </div>
        </div>
      ) : null}

      {p.category === "rukavice" ? (
        <label style={{ display: "grid", gap: 6 }}>
          Velikost rukavic
          <select
            value={p.velikost_rukavic ?? ""}
            onChange={(e) =>
              setP({ ...p, velikost_rukavic: e.target.value === "" ? null : Number(e.target.value) })
            }
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

      {p.category === "dresy" || p.category === "oblečení" ? (
        <div className="card" style={{ display: "grid", gap: 10, padding: 12 }}>
          <div style={{ fontWeight: 800 }}>Dresy / oblečení</div>

          <label style={{ display: "grid", gap: 6 }}>
            Velikost oblečení
            <select
              value={(p.velikost_obleceni ?? "").toUpperCase()}
              onChange={(e) => setP({ ...p, velikost_obleceni: e.target.value || null })}
            >
              <option value="">— vyber —</option>
              {APPAREL_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          {p.category === "oblečení" ? (
            <label style={{ display: "grid", gap: 6 }}>
              Typ oblečení
              <input
                value={p.typ_obleceni ?? ""}
                onChange={(e) => setP({ ...p, typ_obleceni: e.target.value || null })}
                placeholder="mikina / bunda / tričko..."
              />
            </label>
          ) : null}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Stav
          <select value={p.condition ?? ""} onChange={(e) => setP({ ...p, condition: e.target.value || null })}>
            <option value="">—</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Status
          <select value={p.status ?? "available"} onChange={(e) => setP({ ...p, status: e.target.value || null })}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Prodejní cena
          <input
            type="number"
            value={p.sale_price ?? ""}
            onChange={(e) => setP({ ...p, sale_price: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Původní cena
          <input
            type="number"
            value={p.original_price ?? ""}
            onChange={(e) => setP({ ...p, original_price: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </label>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        Popis / poznámka
        <textarea
          value={p.note ?? ""}
          onChange={(e) => setP({ ...p, note: e.target.value || null })}
          rows={5}
        />
      </label>

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
                  onClick={() => removeImage(url)}
                  className="btn"
                  style={{ width: "100%", borderRadius: 0, border: 0, borderTop: "1px solid var(--border)" }}
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
