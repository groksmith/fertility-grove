import { fail, get, ok, type Result, set, uid } from "@/lib/mock-server";
import { MSG } from "@/lib/rules/validation";
import type { ReportReason } from "@/types/domain";

/* ---------------------------------------------------------------- Social */

export const socialService = {
  toggleFollow(id: string) {
    set((s) => {
      const on = s.following.includes(id);
      return {
        ...s,
        following: on ? s.following.filter((x) => x !== id) : [...s.following, id],
        members: s.members.map((m) =>
          m.id === id ? { ...m, followers: m.followers + (on ? -1 : 1) } : m,
        ),
      };
    });
  },
  removeFollower(id: string) {
    set((s) => ({ ...s, followers: s.followers.filter((x) => x !== id) }));
  },
  /** Blocking removes follows both ways and ends any mentoring connection. */
  block(id: string) {
    set((s) => ({
      ...s,
      blocked: Array.from(new Set([...s.blocked, id])),
      following: s.following.filter((x) => x !== id),
      followers: s.followers.filter((x) => x !== id),
      conversations: s.conversations.filter((c) => c.memberId !== id || c.kind === "support"),
      mentorRequests: s.mentorRequests.map((r) =>
        (r.mentorId === id || r.menteeId === id) &&
        (r.status === "accepted" || r.status === "waiting")
          ? { ...r, status: "ended", feedbackGiven: true }
          : r,
      ),
    }));
  },
  unblock(id: string) {
    set((s) => ({ ...s, blocked: s.blocked.filter((x) => x !== id) }));
  },
  notForMe(id: string) {
    set((s) => ({ ...s, notForMe: [...s.notForMe, id] }));
  },
  report(target: string, reason: ReportReason | "", details: string, alsoBlock?: string): Result {
    const s = get();
    if (!reason) return fail("Choose a reason.");
    if (reason === "Other" && !details.trim()) return fail(MSG.reportDetails);
    if (s.counters.reports >= 20) return fail(MSG.reportLimit);
    set((x) => ({
      ...x,
      counters: { ...x.counters, reports: x.counters.reports + 1 },
      reports: [
        ...x.reports,
        { id: uid("r"), target, reason, details: details.trim() || undefined, minutesAgo: 0 },
      ],
    }));
    if (alsoBlock) socialService.block(alsoBlock);
    return ok({
      note: reason === "Self-harm or crisis concern" ? MSG.reportCrisisThanks : MSG.reportThanks,
    });
  },
};
