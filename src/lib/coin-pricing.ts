/**
 * 코인 비용 설정 — 어드민에서 변경 가능
 */

export interface CoinPricing {
  aiInterpretation: number;
  fortuneToday: number;
  fortuneWeek: number;
  fortuneMonth: number;
  fortuneYear: number;
}

const DEFAULT_PRICING: CoinPricing = {
  aiInterpretation: 3,
  fortuneToday: 1,
  fortuneWeek: 1,
  fortuneMonth: 1,
  fortuneYear: 1,
};

const STORAGE_KEY = "artsoul-coin-pricing";

export function getCoinPricing(): CoinPricing {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PRICING, ...parsed };
    }
  } catch {}
  return DEFAULT_PRICING;
}

export function setCoinPricing(pricing: Partial<CoinPricing>): void {
  const current = getCoinPricing();
  const updated = { ...current, ...pricing };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function resetCoinPricing(): void {
  localStorage.removeItem(STORAGE_KEY);
}
