import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { CREDITS } from "@/config/options";
import type { Balance } from "@/lib/rules/credits";
import { formatDate, nextRefill, spend, total, usd } from "@/lib/rules/credits";

describe("CREDITS sample values", () => {
  it("matches the README sample values", () => {
    expect(CREDITS.freePerMonth).toBe(20);
    expect(CREDITS.questionCost).toBe(1);
    expect(CREDITS.appointmentListCost).toBe(3);
    expect(CREDITS.lowWarning).toBe(3);
    expect(CREDITS.packsPerDay).toBe(5);
    expect(CREDITS.packs).toEqual([
      { id: "sprout", name: "Sprout", credits: 25, price: 4.99 },
      { id: "grove", name: "Grove", credits: 60, price: 9.99 },
      { id: "orchard", name: "Orchard", credits: 150, price: 19.99 },
    ]);
  });
});

describe("total", () => {
  it("adds free and purchased credits", () => {
    expect(total({ free: 20, purchased: 25 })).toBe(45);
  });
});

describe("spend", () => {
  it("spends free credits first", () => {
    expect(spend({ free: 20, purchased: 25 }, CREDITS.questionCost)).toEqual({
      free: 19,
      purchased: 25,
    });
  });

  it("dips into purchased credits once free ones run out", () => {
    expect(spend({ free: 1, purchased: 25 }, CREDITS.appointmentListCost)).toEqual({
      free: 0,
      purchased: 23,
    });
    expect(spend({ free: 0, purchased: 5 }, CREDITS.appointmentListCost)).toEqual({
      free: 0,
      purchased: 2,
    });
  });

  it("allows spending down to exactly zero", () => {
    expect(spend({ free: 2, purchased: 1 }, CREDITS.appointmentListCost)).toEqual({
      free: 0,
      purchased: 0,
    });
  });

  it("refuses when the balance is too low", () => {
    expect(spend({ free: 1, purchased: 1 }, CREDITS.appointmentListCost)).toBeNull();
    expect(spend({ free: 0, purchased: 0 }, CREDITS.questionCost)).toBeNull();
  });

  it("costs nothing for a free action, even at a zero balance", () => {
    expect(spend({ free: 0, purchased: 0 }, 0)).toEqual({ free: 0, purchased: 0 });
  });

  it("does not mutate the balance passed in", () => {
    const b: Balance = { free: 5, purchased: 5 };
    spend(b, 3);
    expect(b).toEqual({ free: 5, purchased: 5 });
  });

  it("deducts exactly the cost, free first, and never goes negative", () => {
    fc.assert(
      fc.property(fc.nat(500), fc.nat(500), fc.nat(50), (free, purchased, cost) => {
        const before = { free, purchased };
        const after = spend(before, cost);
        if (free + purchased < cost) {
          expect(after).toBeNull();
          return;
        }
        expect(after).not.toBeNull();
        if (!after) return;
        expect(total(after)).toBe(total(before) - cost);
        expect(after.free).toBeGreaterThanOrEqual(0);
        expect(after.purchased).toBeGreaterThanOrEqual(0);
        // Purchased credits are only touched once free credits are exhausted.
        if (after.purchased < purchased) expect(after.free).toBe(0);
      }),
    );
  });
});

describe("nextRefill", () => {
  const ymd = (d: Date) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];

  it("refills later this month when the sign-up day hasn't come yet", () => {
    expect(ymd(nextRefill(20, new Date(2026, 10, 15)))).toEqual([2026, 11, 20]);
  });

  it("refills next month when the sign-up day has passed or is today", () => {
    expect(ymd(nextRefill(10, new Date(2026, 10, 15)))).toEqual([2026, 12, 10]);
    expect(ymd(nextRefill(15, new Date(2026, 10, 15)))).toEqual([2026, 12, 15]);
  });

  it("rolls over into the next year", () => {
    expect(ymd(nextRefill(5, new Date(2026, 11, 20)))).toEqual([2027, 1, 5]);
  });

  it("uses the month's last day when it is shorter than the sign-up day", () => {
    expect(ymd(nextRefill(31, new Date(2027, 0, 31)))).toEqual([2027, 2, 28]);
    expect(ymd(nextRefill(31, new Date(2028, 0, 31)))).toEqual([2028, 2, 29]);
    expect(ymd(nextRefill(31, new Date(2026, 3, 10)))).toEqual([2026, 4, 30]);
  });

  it("never returns today when today is a short month's refill day", () => {
    // Regression: a 31st sign-up refills on Feb 28, so on Feb 28 the next refill is March 31.
    expect(ymd(nextRefill(31, new Date(2027, 1, 28)))).toEqual([2027, 3, 31]);
    expect(ymd(nextRefill(30, new Date(2026, 3, 30)))).toEqual([2026, 5, 30]);
    expect(ymd(nextRefill(31, new Date(2026, 3, 30)))).toEqual([2026, 5, 31]);
  });

  it("lands after today, within about a month, on the sign-up day or month end", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2024, max: 2030 }),
        fc.integer({ min: 0, max: 11 }),
        fc.integer({ min: 1, max: 31 }),
        fc.integer({ min: 1, max: 31 }),
        (year, month, day, signupDay) => {
          // Every real day of the month, month ends included.
          const today = new Date(
            year,
            month,
            Math.min(day, new Date(year, month + 1, 0).getDate()),
          );
          const next = nextRefill(signupDay, today);
          const days = (next.getTime() - today.getTime()) / 86_400_000;
          expect(days).toBeGreaterThan(0);
          expect(days).toBeLessThanOrEqual(32);
          const monthEnd = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
          expect(next.getDate()).toBe(Math.min(signupDay, monthEnd));
        },
      ),
    );
  });
});

describe("formatDate", () => {
  it("formats as month and day", () => {
    expect(formatDate(new Date(2026, 11, 15))).toBe("December 15");
  });
});

describe("usd", () => {
  it("formats pack prices in dollars", () => {
    expect(CREDITS.packs.map((p) => usd(p.price))).toEqual(["$4.99", "$9.99", "$19.99"]);
    expect(usd(0)).toBe("$0.00");
    expect(usd(1234.5)).toBe("$1,234.50");
  });
});
