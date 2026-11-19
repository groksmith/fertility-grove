import { notify, persona, replace, type State, set, sunlight, uid } from "@/lib/mock-server";
import { MENTOR_REQUESTS } from "@/lib/mock-server/seed/social";
import { MSG } from "@/lib/rules/validation";

/* ------------------------------------------------------------------- Demo */

export const demoService = {
  persona(kind: State["persona"]) {
    replace(persona(kind));
  },
  reset() {
    try {
      window.localStorage.removeItem("fertility-grove-state-v3");
    } catch {
      /* ignore */
    }
    replace(persona("member"));
  },
  setConfirmed(on: boolean) {
    set((s) => ({ ...s, me: { ...s.me, status: on ? "active" : "unconfirmed" } }));
  },
  setPaused(on: boolean) {
    set((s) => ({ ...s, signupsPaused: on }));
  },
  setInvite(on: boolean) {
    set((s) => ({ ...s, hasInvite: on }));
  },
  setLinkExpired(on: boolean) {
    set((s) => ({ ...s, linkExpired: on }));
  },
  addSunlight(n: number) {
    set((s) => sunlight(s, n, "Upvotes from members you helped (demo)"));
  },
  suspend() {
    set((s) => ({
      ...s,
      suspension: {
        reason: "Sharing someone's private information (Community guideline 4)",
        until: new Date(Date.now() + 7 * 864e5).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        }),
      },
    }));
  },
  liftSuspension() {
    set((s) => ({ ...s, suspension: undefined }));
  },
  /** Resolves my waiting mentor request the way the mentor would. */
  mentorReplies(outcome: "accepted" | "declined" | "expired") {
    set((s) => {
      const r = s.mentorRequests.find((x) => x.menteeId === "me" && x.status === "waiting");
      if (!r) return s;
      const mentor = s.members.find((m) => m.id === r.mentorId);
      const name = mentor
        ? mentor.showRealName
          ? `${mentor.firstName} ${mentor.lastInitial}.`
          : `@${mentor.handle}`
        : "The mentor";
      let next: State = {
        ...s,
        mentorRequests: s.mentorRequests.map((x) =>
          x.id === r.id
            ? {
                ...x,
                status: outcome,
                note: outcome === "declined" ? MSG.mentorDecline : undefined,
              }
            : x,
        ),
      };
      if (outcome === "accepted") {
        next = {
          ...next,
          conversations: [
            {
              id: uid("cv"),
              memberId: r.mentorId,
              kind: "mentoring",
              muted: false,
              unread: true,
              messages: [
                { id: uid("m"), from: "me", body: r.message, minutesAgo: 60 },
                {
                  id: uid("m"),
                  from: "them",
                  body: "I'd be glad to. Tell me a little about where you are this week.",
                  minutesAgo: 0,
                },
              ],
            },
            ...next.conversations,
          ],
        };
      }
      const text =
        outcome === "accepted"
          ? `${name} accepted your mentor request`
          : outcome === "declined"
            ? `${name} can't take on someone new right now`
            : `Your request to ${name} expired without a reply. This usually means they're busy. You can ask another mentor.`;
      return notify(next, {
        kind: "mentor",
        text,
        href: outcome === "accepted" ? "/messages" : "/mentors",
        actorId: r.mentorId,
      });
    });
  },
  /** break-ui: swap in realistic worst-case values at the data boundary, each
   *  at the PRD's own limit (handle 30, title 150, 5 tags, group name 60). */
  worstCase() {
    const title =
      "Second retrieval after a cancelled cycle, low AMH, a new protocol and a clinic switch: what questions did you ask before your consult with the new RE?";
    set((s) => ({
      ...s,
      members: s.members.map((m) =>
        m.id === "m-hannah"
          ? { ...m, handle: "aleksandra_wisniewska_kowalcz", showRealName: false }
          : m.id === "m-chloe"
            ? {
                ...m,
                firstName: "Aleksandra-Wiśniewska",
                lastInitial: "K",
                showRealName: true,
                pronouns: "she/they",
                badges: ["mentor", "partner"],
              }
            : m.id === "m-jules"
              ? { ...m, firstName: "Jo", lastInitial: "N", showRealName: true }
              : m,
      ),
      posts: s.posts.map((p) =>
        p.id === "p-4"
          ? {
              ...p,
              title: title.slice(0, 150),
              tags: ["IVF", "AMH", "Egg retrieval", "Insurance", "Work and treatment"],
              up: 1284,
            }
          : p.id === "p-2"
            ? {
                ...p,
                source: "From research or guidelines",
                sourceLink:
                  "https://www.reproductivefacts.org/news-and-publications/fact-sheets-and-infographics/what-is-a-normal-fertilization-rate-after-ivf-with-icsi/",
              }
            : p,
      ),
      groups: s.groups.map((g) =>
        g.id === "g-dor"
          ? {
              ...g,
              name: "Diminished ovarian reserve and premature ovarian insufficiency".slice(0, 60),
            }
          : g.id === "g-eggfreeze"
            ? { ...g, members: 1, postsThisWeek: 0 }
            : g,
      ),
      conversations: s.conversations.map((c) =>
        c.id === "cv-chloe"
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: "wc-1",
                  from: "them",
                  body: "This one helped me: https://www.reproductivefacts.org/news-and-publications/fact-sheets-and-infographics/endometriosis-does-it-cause-infertility/",
                  minutesAgo: 1,
                },
              ],
            }
          : c,
      ),
    }));
  },

  /** Re-seed the accepted request so the mentoring thread demo always works. */
  seedMentoring() {
    set((s) => ({
      ...s,
      mentorRequests: s.mentorRequests.length ? s.mentorRequests : MENTOR_REQUESTS,
    }));
  },
};
