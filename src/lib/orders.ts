/**
 * 주문 & 렌탈 — localStorage 기반
 */

export interface Order {
  id: string;
  artworkId: string;
  title: string;
  artist: string;
  type: "purchase" | "rental";
  amount: number;
  status: string;
  date: string;
}

export interface Rental {
  id: string;
  artworkId: string;
  title: string;
  artist: string;
  cycle: string;       // "3m" | "6m"
  monthlyPrice: number;
  startDate: string;
  nextExchangeDate: string;
  status: "active" | "exchange_pending" | "returned";
}

const ORDERS_KEY = "artsoul-orders";
const RENTALS_KEY = "artsoul-rentals";

// ── 주문 ───────────────────────
export function getOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addOrder(order: Omit<Order, "id" | "date">): Order {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    id: `ORD-${Date.now()}`,
    date: new Date().toISOString(),
  };
  orders.unshift(newOrder);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return newOrder;
}

// ── 렌탈 ───────────────────────
export function getRentals(): Rental[] {
  try {
    const raw = localStorage.getItem(RENTALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addRental(rental: Omit<Rental, "id">): Rental {
  const rentals = getRentals();
  const newRental: Rental = {
    ...rental,
    id: `RNT-${Date.now()}`,
  };
  rentals.unshift(newRental);
  localStorage.setItem(RENTALS_KEY, JSON.stringify(rentals));
  return newRental;
}
