import type { Metadata } from "next";
export const revalidate = 300;

import Link from "next/link";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { formatEUSize } from "@/lib/size";
import { notFound } from "next/navigation";
import ProductGallery from "./gallery";

function isShoesCategory(cat: string | null) {
  return cat === "kopačky" || cat === "běžecké boty" || cat === "tenisky";
}

function money(n: number | null) {
  if (n == null) return "—";
  return `${Math.round(n)} Kč`;
}

function groupKey(p: any) {
  const sizePart =
    p.category === "rukavice"
      ? `glove:${p.velikost_rukavic ?? ""}`
      : p.category === "dresy" || p.category === "oblečení"
      ? `apparel:${String(p.velikost_obleceni ?? "").toUpperCase()}`
      : `shoe:${p.size_eu ?? ""}`;

  return [
    p.name?.trim().toLowerCase() ?? "",
    p.article_code?.trim().toLowerCase() ?? "",
    sizePart,
  ].join("|");
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const supabase = createSupabasePublicClient();

  const { data: product } = await supabase
    .from("products")
    .select("name, brand, category, condition, size_eu, article_code, note, slug")
    .eq("slug", slug)
    .single();

  if (!product) {
    return {
      title: "Produkt nenalezen",
      description: "Požadovaný produkt nebyl nalezen.",
    };
  }

  const category = product.category ?? "produkt";
  const condition = product.condition ?? "";
  const brand = product.brand ?? "";
  const size =
    product.size_eu != null && Number.isFinite(product.size_eu)
      ? ` ve velikosti EU ${formatEUSize(product.size_eu)}`
      : "";

  const conditionLabel =
    condition ? condition.charAt(0).toUpperCase() + condition.slice(1) : "";

  const title = `${product.name}${condition ? ` - ${condition}` : ""}`;

  const description =
    `${conditionLabel ? `${conditionLabel} ` : ""}${category.toLowerCase()} ${brand}${size}. ` +
    `${product.article_code ? `Kód ${product.article_code}. ` : ""}` +
    `Skladem na Fotbalový Outlet CZ.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/p/${product.slug}`,
    },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { back?: string };
}) {
  const slug = decodeURIComponent(params.slug);

  const backHref =
    typeof searchParams?.back === "string" && searchParams.back.startsWith("/produkty")
      ? searchParams.back
      : "/produkty";

  const supabase = createSupabasePublicClient();

  const { data: product, error } = await supabase
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
    .eq("slug", slug)
    .single();

  if (error || !product) notFound();

  const { data: sameRows } = await supabase
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
    .eq("name", (product as any).name)
    .eq("article_code", (product as any).article_code);

  const baseKey = groupKey(product as any);
  const groupedSame = ((sameRows ?? []) as any[]).filter((row) => groupKey(row) === baseKey);
  const stockCount = groupedSame.length || 1;

  const allImages = groupedSame.flatMap((row) => {
    const gallery: string[] = Array.isArray(row.images) ? row.images : [];
    const mainImg = row.image_url || gallery[0] || null;
    return [mainImg, ...gallery].filter(Boolean) as string[];
  });

  const uniqueImages = Array.from(new Set(allImages));

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: (product as any).name,
    image: uniqueImages,
    sku: (product as any).article_code ?? undefined,
    brand: (product as any).brand
      ? {
          "@type": "Brand",
          name: (product as any).brand,
        }
      : undefined,
    description:
      (product as any).note ||
      `${(product as any).condition ?? ""} ${(product as any).category ?? "produkt"} ${(product as any).brand ?? ""}`.trim(),
    category: (product as any).category ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "CZK",
      price:
        (product as any).sale_price != null
          ? String(Math.round((product as any).sale_price))
          : undefined,
      availability:
        (product as any).status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `https://www.fotbalovyoutletcz.cz/p/${(product as any).slug}`,
      itemCondition:
        (product as any).condition === "nové"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
    },
  };

  return (
    <main className="container" style={{ paddingTop: 18, paddingBottom: 30 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />

      <Link href={backHref} className="btn backToResults" style={{ marginBottom: 12 }}>
  ← <span className="backShort">Zpět</span>
  <span className="backLong">Zpět na výsledky</span>
</Link>

      <h1 className="h1" style={{ margin: 0 }}>
        {(product as any).name}
      </h1>

      <div className="card" style={{ marginTop: 12, padding: 12, display: "grid", gap: 8 }}>
        <div className="small muted" style={{ display: "grid", gap: 6 }}>
          <div>
            <b>Značka:</b> {(product as any).brand ?? "—"}
          </div>
          <div>
            <b>Kód:</b> {(product as any).article_code ?? "—"}
          </div>
          <div>
            <b>Kategorie:</b> {(product as any).category ?? "—"}
          </div>
          <div>
            <b>Typ:</b> {(product as any).boot_type ?? "—"}
          </div>
          <div>
            <b>Stav:</b> {(product as any).condition ?? "—"}
          </div>
          <div>
            <b>Status:</b> {(product as any).status ?? "—"}
          </div>
          <div>
            <b>Skladem:</b> {stockCount} ks
          </div>
          <div>
            <b>Prodejní cena:</b> {money((product as any).sale_price ?? null)}
          </div>
          <div>
            <b>Původní cena:</b> {money((product as any).original_price ?? null)}
          </div>
        </div>
      </div>

      <ProductGallery name={(product as any).name} images={uniqueImages} />

      {isShoesCategory((product as any).category ?? null) ? (
        <div className="card" style={{ marginTop: 12, padding: 12, display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800 }}>Velikosti</div>
          <div className="small muted">
            <b>EU:</b> {formatEUSize((product as any).size_eu ?? null)}
          </div>
          <div className="small muted">
            <b>UK:</b> {(product as any).size_uk ?? "—"}
          </div>
          <div className="small muted">
            <b>CM:</b> {(product as any).size_cm ?? "—"}
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 12, padding: 12, display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 800 }}>Popis</div>
        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
          {(product as any).note ? (product as any).note : "—"}
        </div>
      </div>

      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "var(--card)",
          borderTop: "1px solid var(--border)",
          padding: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginTop: 14,
        }}
      >
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>
            {money((product as any).sale_price ?? null)}
          </div>
          <div className="small muted">Skladem {stockCount} ks</div>
        </div>

        <a
          href="https://wa.me/420605171216"
          className="btn btnPrimary"
          style={{ whiteSpace: "nowrap" }}
        >
          Kontaktovat
        </a>
      </div>
    </main>
  );
}
