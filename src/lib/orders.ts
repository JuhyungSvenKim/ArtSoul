/**
 * 주문 & 렌탈 — 암호화 로컬 + Supabase 듀얼 라이트
 */
import { getCurrentUserId } from "./current-user";
import { dbWrite, encryptedSet } from "./encrypted-storage";

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
  cycle: string;
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
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
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

  const userId = getCurrentUserId();
  if (userId) {
    encryptedSet(ORDERS_KEY, orders, userId);
    dbWrite("orders", "insert", {
      user_id: userId,
      artwork_id: newOrder.artworkId,
      artwork_title: newOrder.title,
      type: newOrder.type,
      amount: newOrder.amount,
      status: newOrder.status,
      order_data: newOrder,
      created_at: newOrder.date,
    });
  }
  return newOrder;
}

// ── 렌탈 ───────────────────────
export function getRentals(): Rental[] {
  try {
    const raw = localStorage.getItem(RENTALS_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
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

  const userId = getCurrentUserId();
  if (userId) {
    encryptedSet(RENTALS_KEY, rentals, userId);
    dbWrite("rentals", "insert", {
      user_id: userId,
      artwork_id: newRental.artworkId,
      artwork_title: newRental.title,
      cycle_months: newRental.cycle === "3m" ? 3 : 6,
      start_date: newRental.startDate,
      next_exchange_date: newRental.nextExchangeDate,
      status: newRental.status,
      total_paid: newRental.monthlyPrice,
      rental_data: newRental,
    });
  }
  return newRental;
}
