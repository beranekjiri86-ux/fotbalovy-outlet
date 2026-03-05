"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Product = {
  id: string;

  // DB (EN)
  name: string;
  article_code: string | null;
  brand: string | null;
  category: string | null;

  // boty
  boot_type: string | null; // FG/AG/SG/TF/IC
  size_eu: number | null;
  size_uk: number | null;
  size_cm: number | null;

  // stav
  condition: string | null; // nové/použité
  status: string | null; // available/reserved/sold

  // ceny
  sale_price: number | null;
  original_price: number | null;

  // text
  note: string | null;

  // obrázky
  image_url: string | null;
  images: string[] | null;

  // rukavice / oblečení (sloupce co jsi přidal)
  velikost_rukavic: number | null; // 6..11
  velikost_obleceni: string | null; // XS..XXXL
  typ_obleceni: string | null; // tričko/mikina/...
};

const CATEGORIES = ["kopačky", "běžecké boty", "tenisky", "rukavice", "dresy", "oblečení"] as const;
const CONDITIONS = ["nové", "použité"] as const;
const STATUSES = ["available", "reserved", "sold"] as const;
const BOOT_TYPES = ["FG", "AG", "SG", "TF", "IC"] as const;

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
const GLOVE_SIZES = [6, 7, 8, 9, 10, 11] as const;

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
  "sale_price",
  "original_price",
  "note",
  "image_url",
  "images",
  "velikost_rukavic",
  "velikost_obleceni",
  "typ_obleceni",
].join(",");

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

function normalizeProduct(row: Product): Product {
  return {
    ...row,
    images: Array.isArray(row.images) ? row.images : [],
  };
}

export default function AdminProductEditClient({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      console.log("AUTH USER:", data?.user?.id, data?.user?.email, error);
    });
  }, []);

  const isNew = id === "new";

  const [p, setP] = useState<Product | null>(isNew ? makeEmptyProduct() : null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ===== LOAD (edit mode) =====
  useEffect(() => {
    if (isNew) return;

    let alive = true;
    (async () => {
      setMsg(null);

      const q = supabase.from("products").select(PRODUCT_SELECT).eq("id", id).single();
      const { data, error } = await q.returns<Product>();

      if (!alive) return;

      if (error) {
        console.error(error);
        setMsg(error.message);
        return;
      }

      if (!data) {
        setMsg("Produkt nenalezen.");
        return;
      }

      setP(normalizeProduct(data));
    })();

    return () => {
      alive = false;
    };
  }, [id, isNew]);

  const gallery = useMemo(() => p?.images ?? [], [p]);

  // ===== UPLOAD PHOTOS =====
  async function uploadFiles(files: FileList) {
    if (!p) return;
    setMsg(null);

    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${p.id === "new" ? "new" : p.id}/${crypto.randomUUID()}.${ext}`;

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

  // ===== SAVE (insert/update) =====
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

      // stav/ceny
      condition: p.condition || null,
      status: p.status || "available",
      sale_price: p.sale_price ?? null,
      original_price: p.original_price ?? null,

      // text + obrázky
      note: p.note?.trim() || null,
      image_url: p.image_url?.trim() || null,
      images: p.images ?? [],

      // rukavice/oblečení
      velikost_rukavic: p.category === "rukavice" ? (p.velikost_rukavic ?? null) : null,
      velikost_obleceni:
        p.category === "dresy" || p.category === "oblečení" ? (p.velikost_obleceni || null) : null,
      typ_obleceni: p.category === "oblečení" ? (p.typ_obleceni?.trim() || null) : null,
    };

    try {
      if (isNew) {
        if (!payload.name) {
          setMsg("Vyplň název produktu.");
          setSaving(false);
          return;
        }

        const q = supabase.from("products").insert(payload).select("id").single();
        const { data, error } = await q.returns<{ id: string }>();

        if (error) {
          console.error(error);
          setMsg(error.message);
          setSaving(false);
          return;
        }

        if (!data?.id) {
          setMsg("Vytvořeno, ale bez návratu id (neočekávané).");
          setSaving(false);
          return;
        }

        setMsg("Vytvořeno ✅");
        router.replace(`/admin/produkty/${data.id}`);
        router.refresh();
        setSaving(false);
        return;
      }

      const q = supabase.from("products").update(payload).eq("id", p.id).select(PRODUCT_SELECT).single();
      const { data, error } = await q.returns<Product>();

      if (error) {
        console.error(error);
        setMsg(error.message);
      } else if (data) {
        setP(normalizeProduct(data));
        setMsg("Uloženo ✅");
        router.refresh();
      } else {
        setMsg("Uloženo, ale bez návratu dat (neočekávané).");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!p) return <div>Načítám…</div>;

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

      {/* ZÁKLAD */}
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
            placeholder="Nike / adidas / Puma…"
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

      {/* BOTY */}
      {isShoesCategory(p.category) ? (
        <div className="card" style={{ display: "grid", gap: 10, padding: 12 }}>
          <div style={{ fontWeight: 800 }}>Boty – typ a velikosti</div>

          <label style={{ display: "grid", gap: 6 }}>
            Typ podrážky (boot_type)
            <select value={p.boot_type ?? ""} onChange={(e) => setP({ ...p, boot_type: e.target.value || null })}>
              <option value="">— vyber —</option>
              {BOOT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="small muted">Pozn.: v DB máš někde „IN“ — správně má být „IC“.</div>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              EU
              <input
                type="number"
                step="0.01"
                value={p.size_eu ?? ""}
                onChange={(e) => setP({ ...p, size_eu: e.target.value === "" ? null : Number(e.target.value) })}
                placeholder="41.33"
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              UK
              <input
                type="number"
                step="0.01"
                value={p.size_uk ?? ""}
                onChange={(e) => setP({ ...p, size_uk: e.target.value === "" ? null : Number(e.target.value) })}
                placeholder="7.5"
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              CM
              <input
                type="number"
                step="0.1"
                value={p.size_cm ?? ""}
                onChange={(e) => setP({ ...p, size_cm: e.target.value === "" ? null : Number(e.target.value) })}
                placeholder="26.0"
              />
            </label>
          </div>
        </div>
      ) : null}

      {/* RUKAVICE */}
      {p.category === "rukavice" ? (
        <label style={{ display: "grid", gap: 6 }}>
          Velikost rukavic (6–11)
          <select
            value={p.velikost_rukavic ?? ""}
            onChange={(e) => setP({ ...p, velikost_rukavic: e.target.value === "" ? null : Number(e.target.value) })}
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

      {/* DRESY / OBLEČENÍ */}
      {p.category === "dresy" || p.category === "oblečení" ? (
        <div className="card" style={{ display: "grid", gap: 10, padding: 12 }}>
          <div style={{ fontWeight: 800 }}>Oblečení</div>

          <label style={{ display: "grid", gap: 6 }}>
            Velikost (XS–XXXL)
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
              Typ oblečení (např. mikina/bunda/tričko…)
              <input
                value={p.typ_obleceni ?? ""}
                onChange={(e) => setP({ ...p, typ_obleceni: e.target.value || null })}
                placeholder="mikina"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {/* STAV + CENY */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Stav (nové/použité)
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

      {/* TEXT */}
      <label style={{ display: "grid", gap: 6 }}>
        Popis / poznámka
        <textarea value={p.note ?? ""} onChange={(e) => setP({ ...p, note: e.target.value || null })} rows={5} />
      </label>

      {/* IMAGES */}
      <label style={{ display: "grid", gap: 6 }}>
        Náhledová fotka (image_url)
        <input value={p.image_url ?? ""} onChange={(e) => setP({ ...p, image_url: e.target.value || null })} />
      </label>

      <div className="card" style={{ display: "grid", gap: 10, padding: 12 }}>
        <div style={{ fontWeight: 800 }}>Galerie (max 10)</div>
        <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && uploadFiles(e.target.files)} />

        {gallery.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {gallery.map((url) => (
              <div key={url} style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <img src={url} alt="" style={{ width: "100%", height: 120, objectFit: "cover" }} />
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
        {saving ? (isNew ? "Vytvářím…" : "Ukládám…") : isNew ? "Vytvořit produkt" : "Uložit změny"}
      </button>
    </div>
  );
}
