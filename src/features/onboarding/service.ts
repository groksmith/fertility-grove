import { get, type Me, notify, set } from "@/lib/mock-server";

/* ------------------------------------------------------------- Onboarding */

export const onboardingService = {
  save(step: number, patch: Partial<Me>, skipped?: string[]) {
    set((s) => ({
      ...s,
      me: {
        ...s.me,
        ...patch,
        skipped: Array.from(
          new Set([
            ...s.me.skipped.filter((k) => !Object.keys(patch).includes(k)),
            ...(skipped ?? []),
          ]),
        ),
      },
      step: Math.max(s.step, step + 1),
    }));
  },

  complete() {
    set((s) =>
      notify(
        { ...s, step: 9, me: { ...s.me, level: "Seed", joinedDaysAgo: 0 }, pendingLevelUp: "Seed" },
        {
          kind: "level",
          text: "You planted your Seed. Your tree grows as you help others.",
          href: "/dashboard",
        },
      ),
    );
  },
  /** POST /api/v1/onboarding/complete. Safe to call twice. TODO(api): exists. */
  completeOnboarding() {
    if (get().step < 9) onboardingService.complete();
  },
};
