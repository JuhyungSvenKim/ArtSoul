/**
 * 장바구니 — localStorage 기반
 */

export interface CartItem {
  artworkId: string;
  title: string;
  artist: string;
  element: string;
  energy: number;
  style: string;
  purchasePrice: number;
  rentalPrice: number;
  type: "purchase" | "rental";
  addedAt: string;
}

const STORAGE_KEY = "artsoul-cart";

export function getCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addToCart(item: CartItem): CartItem[] {
  const cart = getCart();
  // 중복 방지
  if (cart.some(c => c.artworkId === item.artworkId && c.type === item.type)) return cart;
  const updated = [...cart, { ...item, addedAt: new Date().toISOString() }];
  saveCart(updated);
  return updated;
}

export function removeFromCart(artworkId: string, type?: string): CartItem[] {
  const cart = getCart();
  const updated = type
    ? cart.filter(c => !(c.artworkId === artworkId && c.type === type))
    : cart.filter(c => c.artworkId !== artworkId);
  saveCart(updated);
  return updated;
}

export function clearCart(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getCartTotal(items: CartItem[]): { purchaseTotal: number; rentalTotal: number; count: number } {
  let purchaseTotal = 0, rentalTotal = 0;
  for (const item of items) {
    if (item.type === "purchase") purchaseTotal += item.purchasePrice;
    else rentalTotal += item.rentalPrice;
  }
  return { purchaseTotal, rentalTotal, count: items.length };
}
