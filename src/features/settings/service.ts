import { fail, get, type Me, ok, type Result, set } from "@/lib/mock-server";
import { checks, MSG } from "@/lib/rules/validation";
import type { MessagePolicy } from "@/types/domain";

/* --------------------------------------------------------------- Settings */

export const settingsService = {
  update(patch: Partial<Me>) {
    set((s) => ({ ...s, me: { ...s.me, ...patch } }));
  },
  setMessagePolicy(p: MessagePolicy) {
    set((s) => ({ ...s, me: { ...s.me, messagePolicy: p } }));
  },
  /** Once every 30 days; switching back to the held handle within 14 days is free. */
  changeHandle(next: string): Result {
    const s = get();
    const h = next.trim();
    if (h === s.me.handle) return ok();
    const backToOld = h === s.me.previousHandle && (s.me.handleChangedDaysAgo ?? 99) <= 14;
    if (!backToOld && s.me.handleChangedDaysAgo !== undefined && s.me.handleChangedDaysAgo < 30) {
      const d = new Date();
      d.setDate(d.getDate() + (30 - s.me.handleChangedDaysAgo));
      return fail(
        MSG.handleCooldown(d.toLocaleDateString("en-US", { month: "long", day: "numeric" })),
      );
    }
    const e = checks.handle(h);
    if (e) return fail(e);
    set((x) => ({
      ...x,
      me: {
        ...x.me,
        handle: h,
        previousHandle: backToOld ? undefined : x.me.handle,
        handleChangedDaysAgo: backToOld ? x.me.handleChangedDaysAgo : 0,
      },
    }));
    return ok();
  },
  /** Withdrawing consent deletes the screen 1–2 health answers. */
  withdrawConsent() {
    set((s) => ({
      ...s,
      useProfileAnswers: false,
      me: {
        ...s.me,
        healthConsent: false,
        stages: [],
        treatments: [],
        nextDate: "",
        diagnoses: [],
        otherDiagnosis: "",
        paths: [],
        shareJourney: false,
      },
    }));
  },
  giveConsent() {
    set((s) => ({ ...s, useProfileAnswers: true, me: { ...s.me, healthConsent: true } }));
  },
  requestExport() {
    set((s) => ({ ...s, dataExport: "preparing" }));
    window.setTimeout(() => set((s) => ({ ...s, dataExport: "ready" })), 2500);
  },
  deleteAccount(deletePosts: boolean) {
    set((s) => ({
      ...s,
      signedIn: false,
      deletion: { daysLeft: 14, deletePosts },
      me: { ...s.me, status: "deletion-pending" },
    }));
  },
  restoreAccount() {
    set((s) => ({ ...s, signedIn: true, deletion: undefined, me: { ...s.me, status: "active" } }));
  },
  acknowledgeLevelUp() {
    set((s) => ({ ...s, pendingLevelUp: undefined }));
  },
  /** "Hide for 30 days". TODO(api): POST /api/v1/profile/me/completion-card/dismiss. */
  dismissProfileCard() {
    set((s) => ({
      ...s,
      me: { ...s.me, profileCardHiddenUntil: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    }));
  },
  saveArticle(slug: string) {
    set((s) => ({
      ...s,
      savedArticles: s.savedArticles.includes(slug)
        ? s.savedArticles.filter((x) => x !== slug)
        : [...s.savedArticles, slug],
    }));
  },
  rateArticle(slug: string, v: "yes" | "no") {
    set((s) => ({ ...s, articleHelpful: { ...s.articleHelpful, [slug]: v } }));
  },
  appeal() {
    set((s) => ({ ...s, suspension: s.suspension && { ...s.suspension, appealed: true } }));
  },
};
