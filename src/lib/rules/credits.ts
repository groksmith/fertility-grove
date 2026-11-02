/* AI credits, PRD v2.0 §18. Free credits are spent first and refill on the
   sign-up day each month; purchased credits never expire. */

export interface Balance {
  free: number;
  purchased: number;
}

export const total = (b: Balance) => b.free + b.purchased;

export function spend(b: Balance, cost: number): Balance | null {
  if (total(b) < cost) return null;
  const fromFree = Math.min(b.free, cost);
  return { free: b.free - fromFree, purchased: b.purchased - (cost - fromFree) };
}

/** Next refill: the sign-up day next month, or that month's last day. */
export function nextRefill(signupDay: number, today = new Date()) {
  const y = today.getFullYear();
  const m = today.getDate() >= signupDay ? today.getMonth() + 1 : today.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(signupDay, last));
}

export const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", day: "numeric" });

export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
