export type CartItem = {
  product_id: number;
  slug: string;
  name: string;
  size_eu: number | null;
  brand: string | null;
  category: string;
  boot_type: string | null;
  condition: string | null;
  sale_price: number;
  image_url: string | null;
};

const KEY = "fo_cart_v1";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToCart(item: CartItem) {
  const cur = readCart();
  // Products are 1pc only → don't allow duplicates
  if (cur.some(x => x.product_id === item.product_id)) return cur;
  const next = [item, ...cur];
  writeCart(next);
  return next;
}

export function removeFromCart(product_id: number) {
  const next = readCart().filter(x => x.product_id !== product_id);
  writeCart(next);
  return next;
}

export function clearCart() {
  writeCart([]);
}
