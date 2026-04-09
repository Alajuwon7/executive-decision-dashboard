const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  CAD: 0.74,
  GBP: 1.27,
  EUR: 1.09,
  NGN: 0.00065,
  GHS: 0.063,
  JMD: 0.0064,
  TTD: 0.15,
};

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDetailed(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function normalizeToUSD(amount: number, currency: string): number {
  const rate = EXCHANGE_RATES[currency] ?? 1;
  return amount * rate;
}
