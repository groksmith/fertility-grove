/* The mentors endpoints. There is no backend yet: each method reads or writes the mock server and
   returns what the API returns (or will). A body that becomes a request is marked TODO(api). */

import { confirmed, fail, get, ok, type Result, type State, set, uid } from "@/lib/mock-server";
import { detectCrisis } from "@/lib/rules/crisis";
import { MSG } from "@/lib/rules/validation";

/* --------------------------------------------------------------- Mentors */

export const mentorService = {
  request(mentorId: string, message: string, helpWith: string[]): Result {
    const gate = confirmed();
    if (gate) return gate;
    if (!message.trim()) return fail(MSG.mentorMessage);
    const s = get();
    const mine = s.mentorRequests.filter((r) => r.menteeId === "me");
    if (mine.some((r) => r.status === "waiting")) return fail(MSG.mentorOpenRequest);
    if (mine.filter((r) => r.status === "accepted").length >= 2) return fail(MSG.mentorTwo);
    const crisis = detectCrisis(message);
    const id = uid("mr");
    set((x) => ({
      ...x,
      mentorRequests: [
        ...x.mentorRequests,
        {
          id,
          mentorId,
          menteeId: "me",
          message: message.trim(),
          helpWith,
          status: "waiting",
          daysAgo: 0,
        },
      ],
      members: x.members.map((m) =>
        m.id === mentorId && m.mentor
          ? { ...m, mentor: { ...m.mentor, waiting: m.mentor.waiting + 1 } }
          : m,
      ),
    }));
    return ok({ id, crisis });
  },

  /** A mentor's reply to a request sent to me. */
  respond(id: string, accept: boolean, note: string) {
    set((s) => {
      const r = s.mentorRequests.find((x) => x.id === id);
      if (!r) return s;
      const next: State = {
        ...s,
        mentorRequests: s.mentorRequests.map((x) =>
          x.id === id
            ? {
                ...x,
                status: accept ? "accepted" : "declined",
                note: note.trim() || (accept ? undefined : MSG.mentorDecline),
              }
            : x,
        ),
      };
      if (!accept) return next;
      return {
        ...next,
        conversations: [
          {
            id: uid("cv"),
            memberId: r.menteeId,
            kind: "mentoring",
            muted: false,
            unread: false,
            messages: [
              { id: uid("m"), from: "them", body: r.message, minutesAgo: r.daysAgo * 1440 },
              ...(note.trim()
                ? [{ id: uid("m"), from: "me" as const, body: note.trim(), minutesAgo: 0 }]
                : []),
            ],
          },
          ...next.conversations,
        ],
      };
    });
  },

  end(requestId: string) {
    set((s) => ({
      ...s,
      mentorRequests: s.mentorRequests.map((r) =>
        r.id === requestId ? { ...r, status: "ended" } : r,
      ),
    }));
  },

  feedback(requestId: string) {
    set((s) => ({
      ...s,
      mentorRequests: s.mentorRequests.map((r) =>
        r.id === requestId ? { ...r, feedbackGiven: true } : r,
      ),
    }));
  },

  setup(m: { bio: string; helpsWith: string[]; capacity: number; agreed: boolean }) {
    const errs: Record<string, string> = {};
    if (!m.bio.trim()) errs.bio = MSG.mentorBio;
    if (!m.helpsWith.length) errs.helpsWith = MSG.mentorHelps;
    if (!m.agreed) errs.agreed = MSG.mentorGuidelines;
    if (Object.keys(errs).length) return { ok: false as const, errs };
    set((s) => ({
      ...s,
      me: {
        ...s.me,
        mentoring: {
          on: true,
          paused: false,
          bio: m.bio.trim(),
          helpsWith: m.helpsWith,
          capacity: m.capacity,
        },
      },
    }));
    return { ok: true as const, errs: {} };
  },

  setPaused(paused: boolean) {
    set((s) => ({ ...s, me: { ...s.me, mentoring: { ...s.me.mentoring, paused } } }));
  },

  /** Turning mentoring off declines waiting requests with the default note. */
  turnOff() {
    set((s) => ({
      ...s,
      me: { ...s.me, mentoring: { ...s.me.mentoring, on: false } },
      mentorRequests: s.mentorRequests.map((r) =>
        r.mentorId === "me" && r.status === "waiting"
          ? { ...r, status: "declined", note: MSG.mentorDecline }
          : r,
      ),
    }));
  },
};
