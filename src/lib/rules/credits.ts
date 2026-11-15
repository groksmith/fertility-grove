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

const lastDay = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

/** Next refill: the sign-up day, or the month's last day when the month is shorter. Always
 *  after today: once this month's refill day has come (a sign-up on the 31st refills on Feb 28),
 *  the next one is next month's. */
export function nextRefill(signupDay: number, today = new Date()) {
  const y = today.getFullYear();
  const thisMonths = Math.min(signupDay, lastDay(y, today.getMonth()));
  const m = today.getDate() >= thisMonths ? today.getMonth() + 1 : today.getMonth();
  return new Date(y, m, Math.min(signupDay, lastDay(y, m)));
}

export const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", day: "numeric" });

export const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
