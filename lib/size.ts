export function formatEUSize(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";

  const whole = Math.floor(n);

  if (Math.abs(n - (whole + 0.5)) < 0.02) return `${whole} 1/2`;
  if (Math.abs(n - (whole + 1 / 3)) < 0.03) return `${whole} 1/3`;
  if (Math.abs(n - (whole + 2 / 3)) < 0.03) return `${whole} 2/3`;

  return String(n).replace(".0", "");
}

export function formatEUSizeForSlug(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "";

  const whole = Math.floor(n);

  if (Math.abs(n - (whole + 0.5)) < 0.02) return `${whole}-1-2`;
  if (Math.abs(n - (whole + 1 / 3)) < 0.03) return `${whole}-1-3`;
  if (Math.abs(n - (whole + 2 / 3)) < 0.03) return `${whole}-2-3`;

  return String(n).replace(".0", "").replace(".", "-");
}

export function buildSizeSearchVariants(input: string) {
  const q = input.trim().toLowerCase();

  if (!q) return [];

  const variants = new Set<string>([q]);

  const normalized = q.replace(",", ".").replace(/\s+/g, " ");
  variants.add(normalized);

  const oneThirdMatch = normalized.match(/^(\d+)\s*1\/3$/);
  if (oneThirdMatch) {
    const whole = Number(oneThirdMatch[1]);
    variants.add(`${whole}.33`);
    variants.add(`${whole},33`);
    variants.add(`${whole} 1/3`);
    variants.add(`${whole}-1-3`);
  }

  const twoThirdMatch = normalized.match(/^(\d+)\s*2\/3$/);
  if (twoThirdMatch) {
    const whole = Number(twoThirdMatch[1]);
    variants.add(`${whole}.67`);
    variants.add(`${whole},67`);
    variants.add(`${whole} 2/3`);
    variants.add(`${whole}-2-3`);
  }

  const halfMatch = normalized.match(/^(\d+)\s*1\/2$/);
  if (halfMatch) {
    const whole = Number(halfMatch[1]);
    variants.add(`${whole}.5`);
    variants.add(`${whole},5`);
    variants.add(`${whole} 1/2`);
    variants.add(`${whole}-1-2`);
  }

  const decimalOneThirdMatch = normalized.match(/^(\d+)[\.,](33|333|34)$/);
  if (decimalOneThirdMatch) {
    const whole = Number(decimalOneThirdMatch[1]);
    variants.add(`${whole} 1/3`);
    variants.add(`${whole}-1-3`);
    variants.add(`${whole}.33`);
    variants.add(`${whole},33`);
  }

  const decimalTwoThirdMatch = normalized.match(/^(\d+)[\.,](66|67|666|667)$/);
  if (decimalTwoThirdMatch) {
    const whole = Number(decimalTwoThirdMatch[1]);
    variants.add(`${whole} 2/3`);
    variants.add(`${whole}-2-3`);
    variants.add(`${whole}.67`);
    variants.add(`${whole},67`);
  }

  const decimalHalfMatch = normalized.match(/^(\d+)[\.,]5$/);
  if (decimalHalfMatch) {
    const whole = Number(decimalHalfMatch[1]);
    variants.add(`${whole} 1/2`);
    variants.add(`${whole}-1-2`);
    variants.add(`${whole}.5`);
    variants.add(`${whole},5`);
  }

  return Array.from(variants);
}
