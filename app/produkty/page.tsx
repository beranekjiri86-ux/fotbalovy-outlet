export const revalidate = 300;

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Product } from "@/lib/types";
import ProductsClient from "./ProductsClient";

type SP = { searchParams?: Record<string, string | string[] | undefined> };

function getString(sp: SP["searchParams"], key: string) {
  const v = sp?.[key];
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function getMulti(sp: SP["searchParams"], key: string): string[] {
  const v = sp?.[key];
  if (!v) return [];
  if (Array.isArray(v)) return v.flatMap((x) => x.split(",")).filter(Boolean);
  return v.split(",").filter(Boolean);
}

function formatEUSize(n: number) {
  if (!Number.isFinite(n)) return "";
  const whole = Math.floor(n);
  if (Math.abs(n - (whole + 0.5)) < 0.02) return `${whole} 1/2`;
  if (Math.abs(n - (whole + 1 / 3)) < 0.03) return `${whole} 1/3`;
  if (Math.abs(n - (whole + 2 / 3)) < 0.03) return `${whole} 2/3`;
  return String(n).replace(".0", "");
}

function parseEUSizeLabel(s: string) {
  const t = s.trim();
  if (t.includes("1/2")) return Number(t.replace("1/2", "").trim()) + 0.5;
  if (t.includes("1/3")) return Number(t.replace("1/3", "").trim()) + 1 / 3;
  if (t.includes("2/3")) return Number(t.replace("2/3", "").trim()) + 2 / 3;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
const GLOVE_SIZES = [6, 7, 8, 9, 10, 11] as const;

export default async function Produkty({ searchParams }: SP) {
  const q = getString(searchParams, "q");
  const category = getString(searchParams, "cat");

  const isShoesCategory =
    category === "kopačky" ||
    category === "běžecké boty" ||
    category === "tenisky";

  const condition = getMulti(searchParams, "cond");
  const brands = getMulti(searchParams, "brand");
  const boot = getMulti(searchParams, "boot");
  const sizeEU = getMulti(searchParams, "eu");
  const apparelSize = getMulti(searchParams, "as");
  const apparelType = getMulti(searchParams, "at");
  const gloveSize = getMulti(searchParams, "gs");

  const supabase = createSupabaseServerClient();

  const [
    { data: brandsRows },
    { data: sizesEURows },
    { data: apparelSizeRows },
    { data: apparelTypeRows },
    { data: gloveSizeRows },
  ] = await Promise.all([
    category
      ? supabase.from("products").select("brand").eq("category", category).not("brand", "is", null)
      : supabase.from("products").select("brand").not("brand", "is", null),

    supabase.from("products").select("size_eu").not("size_eu", "is", null),
    supabase.from("products").select("velikost_obleceni").not("velikost_obleceni", "is", null),
    supabase.from("products").select("typ_obleceni").not("typ_obleceni", "is", null),
    supabase.from("products").select("velikost_rukavic").not("velikost_rukavic", "is", null),
  ]);

  const allBrands = Array.from(
    new Set((brandsRows ?? []).map((r) => (r as any).brand).filter(Boolean))
  ).sort((a: string, b: string) => a.localeCompare(b, "cs"));

  const allSizesEU = Array.from(
    new Set(
      (sizesEURows ?? [])
        .map((r) => (r as any).size_eu)
        .filter((x: any) => x !== null)
        .map((x: any) => Number(x))
        .filter((n) => Number.isFinite(n))
        .map((n) => formatEUSize(n))
        .filter(Boolean)
    )
  ).sort((a, b) => parseEUSizeLabel(a) - parseEUSizeLabel(b));

  const allApparelSizes = Array.from(
    new Set((apparelSizeRows ?? []).map((r) => (r as any).velikost_obleceni).filter(Boolean))
  )
    .map((s: string) => String(s).toUpperCase().trim())
    .filter((s: string) => (APPAREL_SIZES as readonly string[]).includes(s))
    .sort(
      (a: string, b: string) =>
        (APPAREL_SIZES as readonly string[]).indexOf(a) -
        (APPAREL_SIZES as readonly string[]).indexOf(b)
    );

  const allApparelTypes = Array.from(
    new Set((apparelTypeRows ?? []).map((r) => (r as any).typ_obleceni).filter(Boolean))
  )
    .map((s: string) => String(s).trim())
    .filter(Boolean)
    .sort((a: string, b: string) => a.localeCompare(b, "cs"));

  const allGloveSizes = Array.from(
    new Set((gloveSizeRows ?? []).map((r) => (r as any).velikost_rukavic).filter((x: any) => x !== null))
  )
    .map((x: any) => Number(x))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  let query = supabase
    .from("products")
    .select(`
      id,
      slug,
      name,
      brand,
      category,
      boot_type,
      size_eu,
      velikost_rukavic,
      velikost_obleceni,
      typ_obleceni,
      condition,
      status,
      sale_price,
      original_price,
      article_code,
      image_url
    `)
    .in("status", ["available", "reserved"])
    .order("sale_price", { ascending: true });

  if (category) query = query.eq("category", category);
  if (condition.length) query = query.in("condition", condition);
  if (brands.length) query = query.in("brand", brands);

  if (isShoesCategory) {
    if (boot.length) query = query.in("boot_type", boot);

    if (sizeEU.length) {
      const nums = sizeEU.map(parseEUSizeLabel).filter((n) => Number.isFinite(n));
      if (nums.length) {
        const parts = nums.map((n) => {
          const min = Number((n - 0.02).toFixed(2));
          const max = Number((n + 0.02).toFixed(2));
          return `and(size_eu.gte.${min},size_eu.lte.${max})`;
        });
        query = query.or(parts.join(","));
      }
    }
  }

  if (category === "rukavice") {
    if (gloveSize.length) {
      const nums = gloveSize.map((x) => Number(x)).filter((n) => Number.isFinite(n));
      if (nums.length) query = query.in("velikost_rukavic", nums);
    }
  }

  if (category === "dresy" || category === "oblečení") {
    if (apparelSize.length) {
      query = query.in("velikost_obleceni", apparelSize.map((x) => x.toUpperCase()));
    }
  }

  if (category === "oblečení") {
    if (apparelType.length) query = query.in("typ_obleceni", apparelType);
  }

  const { data } = await query;
  const products = (data ?? []) as unknown as Product[];

  return (
    <ProductsClient
      initialQuery={q}
      initialCategory={category}
      initialCondition={condition}
      initialBrands={brands}
      initialBoot={boot}
      initialSizeEU={sizeEU}
      initialApparelSize={apparelSize}
      initialApparelType={apparelType}
      initialGloveSize={gloveSize}
      products={products}
      allBrands={allBrands}
      allSizesEU={allSizesEU}
      allApparelSizes={allApparelSizes}
      allApparelTypes={allApparelTypes}
      allGloveSizes={allGloveSizes}
      cats={["kopačky", "běžecké boty", "tenisky", "rukavice", "dresy", "oblečení"]}
    />
  );
}
