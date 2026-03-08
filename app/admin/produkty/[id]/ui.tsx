"use client";

import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import heic2any from "heic2any";
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

async function normalizeImageFile(inputFile: File): Promise<File> {
  let file = inputFile;

  if (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  ) {
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    });

    const blob = Array.isArray(converted) ? converted[0] : converted;

    file = new File(
      [blob as Blob],
      file.name.replace(/\.heic$/i, ".jpg").replace(/\.heif$/i, ".jpg"),
      { type: "image/jpeg" }
    );
  }

  const bitmapUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Nepodařilo se načíst obrázek."));
      image.src = bitmapUrl;
    });

    const maxSize = 1600;
    const width = img.width;
    const height = img.height;

    let targetWidth = width;
    let targetHeight = height;

    if (width > maxSize || height > maxSize) {
      const ratio = Math.min(maxSize / width, maxSize / height);
      targetWidth = Math.round(width * ratio);
      targetHeight = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Nepodařilo se připravit canvas pro resize.");

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const webpBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Nepodařilo se převést obrázek do WebP."));
            return;
          }
          resolve(blob);
        },
        "image/webp",
        0.82
      );
    });

    const nextName = file.name.replace(/\.[^.]+$/i, "") + ".webp";

    return new File([webpBlob], nextName, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

export default function AdminProductEditClient({
  id,
  copyId,
}: {
  id: string;
  copyId?: string | null;
}) {
  const router = useRouter();
  const isNew = id === "new";
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [p, setP] = useState<Product | null>(isNew ? makeEmptyProduct() : null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [dragOverUpload, setDragOverUpload] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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

  async function persistImages(nextImages: string[]) {
    if (!p || p.id === "new") return;

    const thumb = nextImages[0] ?? null;

    const { data, error } = await supabase
      .from("products")
      .update({ images: nextImages, image_url: thumb })
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

  async function uploadFiles(files: FileList | File[] | null) {
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
      const list = Array.from(files).slice(0, Math.max(0, 10 - gallery.length));

      if (!list.length) {
        setMsg("Produkt už má maximum 10 fotek.");
        return;
      }

      setMsg(`Zpracovávám ${list.length} fotek...`);

      const newUrls: string[] = [];

      for (let i = 0; i < list.length; i++) {
        const originalFile = list[i];
        setMsg(`Zpracovávám ${i + 1}/${list.length}: ${originalFile.name}`);

        const file = await normalizeImageFile(originalFile);

        const ext = file.name.split(".").pop() || "webp";
        const path = `${p.id}/${crypto.randomUUID()}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file, {
            upsert: false,
            contentType: file.type || "image/webp",
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

      setP({ ...p, images: merged, image_url: merged[0] ?? null });
      await persistImages(merged);

      setMsg(`Hotovo: nahráno ${newUrls.length} fotek`);
    } catch (e: any) {
      console.error(e);
      setMsg(`Chyba při uploadu: ${e?.message ?? "neznámá chyba"}`);
    }
  }

  async function removeImage(url: string) {
    if (!p) return;
    const next = gallery.filter((x) => x !== url);

    setP({ ...p, images: next, image_url: next[0] ?? null });
    await persistImages(next);
  }

  async function makePrimary(index: number) {
    if (!p) return;
    if (index < 0 || index >= gallery.length) return;
    if (index === 0) return;

    const next = [...gallery];
    const [selected] = next.splice(index, 1);
    next.unshift(selected);

    setP({ ...p, images: next, image_url: next[0] ?? null });
    await persistImages(next);
    setMsg("Hlavní fotka nastavena.");
  }

  async function moveImage(from: number, to: number) {
    if (!p) return;
    if (from === to) return;
    if (from < 0 || to < 0 || from >= gallery.length || to >= gallery.length) return;

    const next = [...gallery];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);

    setP({ ...p, images: next, image_url: next[0] ?? null });
    await persistImages(next);
  }

  async function moveLeft(index: number) {
    if (index <= 0) return;
    await moveImage(index, index - 1);
  }

  async function moveRight(index: number) {
    if (index >= gallery.length - 1) return;
    await moveImage(index, index + 1);
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  async function handleDrop(index: number) {
    if (dragIndex == null) return;
    const from = dragIndex;
    setDragIndex(null);
    await moveImage(from, index);
  }

  function handleUploadDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOverUpload(true);
  }

  function handleUploadDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOverUpload(false);
  }

  function handleUploadDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOverUpload(false);

    if (!e.dataTransfer?.files?.length) return;
    uploadFiles(e.dataTransfer.files);
  }

  async function removeProduct() {
    if (!p || p.id === "new") return;

    const ok = window.confirm(`Opravdu smazat produkt "${p.name}"? Tato akce nejde vrátit zpět.`);
    if (!ok) return;

    setSaving(true);
    setMsg(null);

    try {
      const { error } = await supabase.from("products").delete().eq("id", p.id);

      if (error) {
        console.error(error);
        setMsg(`Smazání selhalo: ${error.message}`);
        return;
      }

      setMsg("Produkt byl smazán.");
      router.replace("/admin/produkty");
      router.refresh();
    } finally {
      setSaving(false);
    }
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
      image_url: (p.images ?? [])[0] ?? null,
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
        router.replace("/admin/produkty");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!p) return <div>Načítám...</div>;

  return (
    <div style={{ display: "grid", gap: 14, width: "100%", minWidth: 0 }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
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

      <div className="card" style={{ display: "grid", gap: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800 }}>Fotky (max 10)</div>
            <div className="small muted">
              První fotka je hlavní. Na PC můžeš měnit pořadí přetažením. Na mobilu tlačítky.
            </div>
          </div>

          {gallery.length ? (
            <div className="small muted">
              Hlavní fotka: <b>#{1}</b>
            </div>
          ) : null}
        </div>

        {p.id === "new" ? (
          <div className="small muted">Nejdřív vytvoř produkt, potom můžeš nahrávat fotky.</div>
        ) : (
          <>
            <div
              className={`adminUploadDropzone${dragOverUpload ? " isDragOver" : ""}`}
              onDragOver={handleUploadDragOver}
              onDragLeave={handleUploadDragLeave}
              onDrop={handleUploadDrop}
              onClick={() => inputRef.current?.click()}
            >
              <div style={{ fontWeight: 700 }}>Nahraj fotky</div>
              <div className="small muted">
                Klikni sem nebo přetáhni soubory z plochy. Můžeš nahrát více fotek najednou.
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              style={{ display: "none" }}
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
          </>
        )}

        {gallery.length ? (
          <div className="adminImageGrid">
            {gallery.map((url, index) => {
              const isMain = index === 0;

              return (
                <div
                  key={url}
                  className={`adminImageCard${dragIndex === index ? " isDragging" : ""}${isMain ? " isMain" : ""}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={() => setDragIndex(null)}
                >
                  <div className="adminImageThumbWrap">
                    {isMain ? <div className="adminImageBadge">Hlavní</div> : null}

                    <img
                      src={url}
                      alt={`Produkt ${index + 1}`}
                      loading="lazy"
                      className="adminImageThumb"
                    />
                  </div>

                  <div className="adminImageActions">
                    <div className="adminImageOrderRow">
                      <button
                        type="button"
                        className="btn adminMiniBtn"
                        onClick={() => moveLeft(index)}
                        disabled={index === 0}
                        title="Posunout vlevo"
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        className="btn adminMiniBtn"
                        onClick={() => moveRight(index)}
                        disabled={index === gallery.length - 1}
                        title="Posunout vpravo"
                      >
                        →
                      </button>

                      {!isMain ? (
                        <button
                          type="button"
                          className="btn adminMiniBtn"
                          onClick={() => makePrimary(index)}
                          title="Nastavit jako hlavní"
                        >
                          Hlavní
                        </button>
                      ) : (
                        <div className="small muted">Hlavní fotka</div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="btn adminDeleteBtn"
                      title="Smazat fotku"
                    >
                      🗑 Smazat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="small muted">Zatím žádné fotky.</div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!isNew ? (
          <button
            type="button"
            onClick={removeProduct}
            disabled={saving}
            className="btn"
            style={{
              padding: 12,
              border: "1px solid #dc2626",
              color: "#dc2626",
              background: "transparent",
            }}
          >
            Smazat produkt
          </button>
        ) : null}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn btnPrimary"
          style={{ padding: 12 }}
        >
          {saving ? (isNew ? "Vytvářím..." : "Ukládám...") : isNew ? "Vytvořit produkt" : "Uložit změny"}
        </button>
      </div>
    </div>
  );
}
