/* The credits endpoints. There is no backend yet: each method reads or writes the mock server and
   returns what the API returns (or will). A body that becomes a request is marked TODO(api). */

import { CREDITS } from "@/config/options";
import { confirmed, fail, get, ok, type Result, set, uid } from "@/lib/mock-server";
import { MSG } from "@/lib/rules/validation";

/* ---------------------------------------------------------------- Credits */

export const creditService = {
  buy(packId: string, outcome: "paid" | "failed"): Result {
    const gate = confirmed();
    if (gate) return gate;
    const s = get();
    if (s.credits.packsToday >= CREDITS.packsPerDay) return fail(MSG.packLimit);
    const pack = CREDITS.packs.find((p) => p.id === packId);
    if (!pack) return fail("Choose a credit pack.");
    set((x) => ({
      ...x,
      credits: {
        ...x.credits,
        purchased: x.credits.purchased + (outcome === "paid" ? pack.credits : 0),
        packsToday: x.credits.packsToday + (outcome === "paid" ? 1 : 0),
        purchases: [
          {
            id: uid("pu"),
            packId,
            credits: pack.credits,
            price: pack.price,
            status: outcome,
            daysAgo: 0,
          },
          ...x.credits.purchases,
        ],
      },
    }));
    return outcome === "paid"
      ? ok()
      : fail("Your payment didn't go through, and no credits were added. Please try again.");
  },
};
