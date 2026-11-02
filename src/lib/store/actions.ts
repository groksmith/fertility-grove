/* Every state change in the prototype. Actions enforce the PRD's rules and
   return the PRD's own copy, so screens only decide where to show it. */

import { CREDITS, NO_DOWNVOTE } from "../options";
import { detectCrisis, type CrisisLevel } from "../rules/crisis";
import { spend } from "../rules/credits";
import { appointmentQuestions, askGuide } from "../rules/guide";
import { keepLevel, levelIndex } from "../rules/sunlight";
import { MSG, checks, normalizeEmail } from "../rules/validation";
import { MENTOR_REQUESTS } from "../data/social";
import type {
  FamilyItem,
  GuideChat,
  MessagePolicy,
  Post,
  PostType,
  ReportReason,
  Source,
  StoryType,
  Vote,
} from "../types";
import { EMPTY_ME, get, persona, replace, set, type Me, type State } from "./state";

export type Result =
  | { ok: true; id?: string; crisis?: CrisisLevel; note?: string }
  | { ok: false; error: string; code?: "unconfirmed" | "join" | "credits" };

const ok = (extra: Omit<Extract<Result, { ok: true }>, "ok"> = {}): Result => ({ ok: true, ...extra });
const fail = (error: string, code?: "unconfirmed" | "join" | "credits"): Result => ({ ok: false, error, code });

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const DEMO_EMAIL = "annie.m@grove.test";
export const DEMO_PASSWORD = "sunlight-demo";

/** Unconfirmed members can browse and onboard but not post, comment, vote,
 *  message, request a mentor or buy credits (PRD §4). */
function confirmed(): Result | null {
  const { me } = get();
  return me.status === "unconfirmed" ? fail(MSG.unconfirmed(me.email), "unconfirmed") : null;
}

function notify(s: State, n: Omit<State["notifications"][number], "id" | "minutesAgo" | "read">): State {
  return { ...s, notifications: [{ id: uid("n"), minutesAgo: 0, read: false, ...n }, ...s.notifications] };
}

/** Adds Sunlight, keeps the level from ever dropping, and queues the level-up
 *  celebration when a new threshold is crossed. */
function sunlight(s: State, amount: number, label: string): State {
  const total = Math.max(0, s.me.sunlight + amount);
  const level = keepLevel(s.me.level, total);
  const up = levelIndex(level) > levelIndex(s.me.level);
  let next: State = {
    ...s,
    me: {
      ...s.me,
      sunlight: total,
      level,
      history: [{ id: uid("sh"), label, amount, daysAgo: 0 }, ...s.me.history],
    },
    pendingLevelUp: up ? level : s.pendingLevelUp,
  };
  if (up) {
    next = notify(next, { kind: "level", text: `You grew into a ${level}`, href: "/profile" });
  }
  return next;
}

/* ------------------------------------------------------------------ Auth */

export const auth = {
  signUp(input: { email: string; password?: string; adult: boolean; terms: boolean; google?: boolean }) {
    const s = get();
    if (!s.hasInvite) return fail(MSG.inviteOnly);
    if (s.signupsPaused) return fail(MSG.paused);
    const errs: Record<string, string> = {};
    if (!input.google) {
      const e = checks.email(input.email);
      if (e) errs.email = e;
      const p = checks.password(input.password ?? "");
      if (p) errs.password = p;
    }
    if (!input.adult) errs.adult = MSG.age;
    if (!input.terms) errs.terms = MSG.terms;
    if (Object.keys(errs).length) return { ok: false as const, error: "", errs };
    const email = input.google ? "annie.google@grove.test" : normalizeEmail(input.email);
    // A duplicate email shows the same "check your email" screen and creates nothing.
    if (email === DEMO_EMAIL) return { ok: true as const, duplicate: true };
    const invitedBy = s.invitedBy;
    replace({
      ...persona(invitedBy ? "partner" : "new"),
      signedIn: true,
      step: 1,
      invitedBy,
      password: input.password,
      me: { ...EMPTY_ME, email, status: input.google ? "active" : "unconfirmed" },
    });
    return { ok: true as const, duplicate: false };
  },

  signIn(email: string, password: string, keep: boolean): Result {
    const s = get();
    if (s.lockedOut) return fail(MSG.lockout);
    const known =
      (normalizeEmail(email) === DEMO_EMAIL && password === DEMO_PASSWORD) ||
      (normalizeEmail(email) === s.me.email && password === s.password);
    if (!known) {
      const attempts = s.failedAttempts + 1;
      set((x) => ({ ...x, failedAttempts: attempts, lockedOut: attempts >= 5 }));
      return fail(attempts >= 5 ? MSG.lockout : MSG.wrongCredentials);
    }
    if (normalizeEmail(email) === DEMO_EMAIL && s.me.email !== DEMO_EMAIL) {
      replace({ ...persona("member"), keepSignedIn: keep });
    } else {
      set((x) => ({ ...x, signedIn: true, failedAttempts: 0, keepSignedIn: keep }));
    }
    return ok();
  },

  /** Prototype Google sign-in: lands in the demo member's grove. */
  signInWithGoogle(keep: boolean): Result {
    const s = get();
    if (s.me.email !== DEMO_EMAIL) replace({ ...persona("member"), keepSignedIn: keep });
    else set((x) => ({ ...x, signedIn: true, failedAttempts: 0, keepSignedIn: keep }));
    return ok();
  },

  signOut() {
    set((s) => ({ ...s, signedIn: false }));
  },

  confirmEmail(): Result {
    if (get().linkExpired) return fail(MSG.linkExpired);
    set((s) => ({ ...s, me: { ...s.me, status: s.me.status === "unconfirmed" ? "active" : s.me.status } }));
    return ok();
  },

  resendLink() {
    set((s) => ({ ...s, linkExpired: false }));
  },

  resetPassword(pw: string, confirm: string) {
    const errs: Record<string, string> = {};
    const p = checks.password(pw);
    if (p) errs.password = p;
    if (pw !== confirm) errs.confirm = MSG.passwordsDiffer;
    if (get().linkExpired) return { ok: false as const, error: MSG.linkExpired, errs };
    if (Object.keys(errs).length) return { ok: false as const, error: "", errs };
    set((s) => ({ ...s, password: pw, failedAttempts: 0, lockedOut: false }));
    return { ok: true as const };
  },

  arriveWithInvite(kind: "beta" | "partner") {
    set((s) => ({
      ...s,
      hasInvite: true,
      invitedBy: kind === "partner" ? "Annie" : s.invitedBy,
    }));
  },
};

/* ------------------------------------------------------------- Onboarding */

export const onboarding = {
  save(step: number, patch: Partial<Me>, skipped?: string[]) {
    set((s) => ({
      ...s,
      me: {
        ...s.me,
        ...patch,
        skipped: Array.from(new Set([...s.me.skipped.filter((k) => !Object.keys(patch).includes(k)), ...(skipped ?? [])])),
      },
      step: Math.max(s.step, step + 1),
    }));
  },

  complete() {
    set((s) =>
      notify(
        { ...s, step: 9, me: { ...s.me, level: "Seed", joinedDaysAgo: 0 }, pendingLevelUp: "Seed" },
        { kind: "level", text: "You planted your Seed. Your tree grows as you help others.", href: "/profile" },
      ),
    );
  },
};

/* ----------------------------------------------------------------- Groups */

export const groups = {
  toggleJoin(id: string) {
    set((s) => {
      const joined = s.joined.includes(id);
      return {
        ...s,
        joined: joined ? s.joined.filter((g) => g !== id) : [...s.joined, id],
        muted: joined ? s.muted.filter((g) => g !== id) : s.muted,
        groups: s.groups.map((g) => (g.id === id ? { ...g, members: g.members + (joined ? -1 : 1) } : g)),
      };
    });
  },
  toggleMute(id: string) {
    set((s) => ({ ...s, muted: s.muted.includes(id) ? s.muted.filter((g) => g !== id) : [...s.muted, id] }));
  },
  notForMe(id: string) {
    set((s) => ({ ...s, notForMe: [...s.notForMe, id] }));
  },
};

/* ------------------------------------------------------------------ Posts */

interface PostInput {
  groupId: string;
  type: PostType | "";
  title: string;
  body: string;
  source: Source | "";
  sourceLink: string;
  tags: string[];
  allowSharing: boolean;
}

export function validatePost(p: PostInput) {
  const errs: Partial<Record<keyof PostInput | "typeSource", string>> = {};
  if (!p.title.trim()) errs.title = MSG.postTitle;
  if (!p.body.trim()) errs.body = MSG.postBody;
  if (!p.type || !p.source) errs.typeSource = MSG.postTypeSource;
  if (p.source === "From research or guidelines" && !p.sourceLink.trim()) errs.sourceLink = MSG.researchLink;
  else {
    const l = checks.link(p.sourceLink);
    if (l) errs.sourceLink = l;
  }
  return errs;
}

export const posts = {
  create(p: PostInput): Result {
    const gate = confirmed();
    if (gate) return gate;
    const s = get();
    if (!s.joined.includes(p.groupId)) return fail("Join this group to post in it.", "join");
    if (s.counters.posts >= 10) return fail(MSG.postLimit);
    const crisis = detectCrisis(`${p.title} ${p.body}`);
    const id = uid("p");
    set((x) => ({
      ...x,
      counters: { ...x.counters, posts: x.counters.posts + 1 },
      me: { ...x.me, guidelinesAccepted: true },
      posts: [
        {
          id,
          groupId: p.groupId,
          authorId: "me",
          type: p.type as PostType,
          title: p.title.trim(),
          body: p.body.trim(),
          source: p.source as Source,
          sourceLink: p.sourceLink.trim() || undefined,
          tags: p.tags,
          allowSharing: p.allowSharing,
          minutesAgo: 0,
          up: 0,
          down: 0,
          myVote: 0,
          saved: false,
          status: crisis === "high" ? "held" : "published",
        },
        ...x.posts,
      ],
    }));
    return ok({ id, crisis });
  },

  edit(id: string, patch: Partial<Pick<Post, "title" | "body">>) {
    set((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? { ...p, ...patch, edited: true } : p)) }));
  },

  remove(id: string) {
    set((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? { ...p, status: "deleted" } : p)) }));
  },

  vote(id: string, v: Vote): Result {
    const gate = confirmed();
    if (gate) return gate;
    const s = get();
    const post = s.posts.find((p) => p.id === id);
    if (!post || post.authorId === "me") return fail("You can't vote on your own post.");
    if (!s.joined.includes(post.groupId)) return fail("Join this group to vote.", "join");
    if (v === -1 && NO_DOWNVOTE.includes(post.type)) return fail("No downvotes on this kind of post.");
    set((x) => ({
      ...x,
      posts: x.posts.map((p) => {
        if (p.id !== id) return p;
        const next: Vote = p.myVote === v ? 0 : v;
        return {
          ...p,
          myVote: next,
          up: p.up - (p.myVote === 1 ? 1 : 0) + (next === 1 ? 1 : 0),
          down: p.down - (p.myVote === -1 ? 1 : 0) + (next === -1 ? 1 : 0),
        };
      }),
    }));
    return ok();
  },

  toggleSave(id: string) {
    set((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p)) }));
  },

  comment(postId: string, body: string, opts: { parentId?: string; mention?: string; source?: Source } = {}): Result {
    const gate = confirmed();
    if (gate) return gate;
    const s = get();
    const post = s.posts.find((p) => p.id === postId);
    if (!post) return fail("This post isn't available.");
    if (!s.joined.includes(post.groupId)) return fail("Join this group to comment.", "join");
    if (!body.trim()) return fail(MSG.commentEmpty);
    if (s.counters.comments >= 50) return fail(MSG.commentLimit);
    const crisis = detectCrisis(body);
    const id = uid("c");
    set((x) => ({
      ...x,
      counters: { ...x.counters, comments: x.counters.comments + 1 },
      comments: [
        ...x.comments,
        {
          id,
          postId,
          authorId: "me",
          parentId: opts.parentId,
          mention: opts.mention,
          body: body.trim(),
          source: opts.source,
          minutesAgo: 0,
          up: 0,
          down: 0,
          myVote: 0,
          status: crisis === "high" ? "held" : "published",
        },
      ],
    }));
    return ok({ id, crisis });
  },

  voteComment(id: string, v: Vote): Result {
    const gate = confirmed();
    if (gate) return gate;
    const s = get();
    const c = s.comments.find((x) => x.id === id);
    const post = c && s.posts.find((p) => p.id === c.postId);
    if (!c || !post || c.authorId === "me") return fail("You can't vote on your own comment.");
    if (!s.joined.includes(post.groupId)) return fail("Join this group to vote.", "join");
    if (v === -1 && NO_DOWNVOTE.includes(post.type)) return fail("No downvotes on this kind of post.");
    set((x) => ({
      ...x,
      comments: x.comments.map((k) => {
        if (k.id !== id) return k;
        const next: Vote = k.myVote === v ? 0 : v;
        return {
          ...k,
          myVote: next,
          up: k.up - (k.myVote === 1 ? 1 : 0) + (next === 1 ? 1 : 0),
          down: k.down - (k.myVote === -1 ? 1 : 0) + (next === -1 ? 1 : 0),
        };
      }),
    }));
    return ok();
  },

  editComment(id: string, body: string) {
    set((s) => ({ ...s, comments: s.comments.map((c) => (c.id === id ? { ...c, body, edited: true } : c)) }));
  },

  removeComment(id: string) {
    set((s) => ({ ...s, comments: s.comments.map((c) => (c.id === id ? { ...c, status: "deleted" } : c)) }));
  },
};

/* --------------------------------------------------------------- Stories */

export const stories = {
  create(st: { type: StoryType | ""; title: string; body: string; diagnoses: string[]; whatHelped: string[]; source: Source | "" }): Result {
    const gate = confirmed();
    if (gate) return gate;
    if (!st.type || !st.title.trim() || !st.body.trim() || !st.source) return fail(MSG.storyMissing);
    const id = uid("s");
    const crisis = detectCrisis(`${st.title} ${st.body}`);
    set((s) => ({
      ...s,
      stories: [
        {
          id,
          authorId: "me",
          type: st.type as StoryType,
          title: st.title.trim(),
          body: st.body.trim(),
          diagnoses: st.diagnoses,
          whatHelped: st.whatHelped,
          source: st.source as Source,
          minutesAgo: 0,
          up: 0,
          myVote: 0,
          comments: 0,
          saved: false,
        },
        ...s.stories,
      ],
    }));
    return ok({ id, crisis });
  },
  upvote(id: string): Result {
    const gate = confirmed();
    if (gate) return gate;
    set((s) => ({
      ...s,
      stories: s.stories.map((x) =>
        x.id === id && x.authorId !== "me"
          ? { ...x, myVote: x.myVote === 1 ? 0 : 1, up: x.up + (x.myVote === 1 ? -1 : 1) }
          : x,
      ),
    }));
    return ok();
  },
  toggleSave(id: string) {
    set((s) => ({ ...s, stories: s.stories.map((x) => (x.id === id ? { ...x, saved: !x.saved } : x)) }));
  },
};

/* ---------------------------------------------------------------- Social */

export const social = {
  toggleFollow(id: string) {
    set((s) => {
      const on = s.following.includes(id);
      return {
        ...s,
        following: on ? s.following.filter((x) => x !== id) : [...s.following, id],
        members: s.members.map((m) => (m.id === id ? { ...m, followers: m.followers + (on ? -1 : 1) } : m)),
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
        (r.mentorId === id || r.menteeId === id) && (r.status === "accepted" || r.status === "waiting")
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
      reports: [...x.reports, { id: uid("r"), target, reason, details: details.trim() || undefined, minutesAgo: 0 }],
    }));
    if (alsoBlock) social.block(alsoBlock);
    return ok({ note: reason === "Self-harm or crisis concern" ? MSG.reportCrisisThanks : MSG.reportThanks });
  },
};

/* --------------------------------------------------------------- Mentors */

export const mentors = {
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
        { id, mentorId, menteeId: "me", message: message.trim(), helpWith, status: "waiting", daysAgo: 0 },
      ],
      members: x.members.map((m) =>
        m.id === mentorId && m.mentor ? { ...m, mentor: { ...m.mentor, waiting: m.mentor.waiting + 1 } } : m,
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
          x.id === id ? { ...x, status: accept ? "accepted" : "declined", note: note.trim() || (accept ? undefined : MSG.mentorDecline) } : x,
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
              ...(note.trim() ? [{ id: uid("m"), from: "me" as const, body: note.trim(), minutesAgo: 0 }] : []),
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
      mentorRequests: s.mentorRequests.map((r) => (r.id === requestId ? { ...r, status: "ended" } : r)),
    }));
  },

  feedback(requestId: string) {
    set((s) => ({
      ...s,
      mentorRequests: s.mentorRequests.map((r) => (r.id === requestId ? { ...r, feedbackGiven: true } : r)),
    }));
  },

  setup(m: { bio: string; helpsWith: string[]; capacity: number; agreed: boolean }) {
    const errs: Record<string, string> = {};
    if (!m.bio.trim()) errs.bio = MSG.mentorBio;
    if (!m.helpsWith.length) errs.helpsWith = MSG.mentorHelps;
    if (!m.agreed) errs.agreed = MSG.mentorGuidelines;
    if (Object.keys(errs).length) return { ok: false as const, errs };
    set((s) => ({ ...s, me: { ...s.me, mentoring: { on: true, paused: false, bio: m.bio.trim(), helpsWith: m.helpsWith, capacity: m.capacity } } }));
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
        r.mentorId === "me" && r.status === "waiting" ? { ...r, status: "declined", note: MSG.mentorDecline } : r,
      ),
    }));
  },
};

/* -------------------------------------------------------------- Messages */

export const messages = {
  /** Who can message whom (PRD §14): a follow or "Anyone" opens a thread; any
   *  other first message becomes a request; "No one" has no Message button. */
  canStart(memberId: string): "open" | "request" | "none" | "unavailable" {
    const s = get();
    const m = s.members.find((x) => x.id === memberId);
    if (!m) return "none";
    if (m.unavailable) return "unavailable";
    if (m.messagePolicy === "no-one") return "none";
    if (m.messagePolicy === "anyone" || m.follows.includes("me")) return "open";
    return "request";
  },

  start(memberId: string, body: string, attachedPostId?: string): Result {
    const gate = confirmed();
    if (gate) return gate;
    const s = get();
    const existing = s.conversations.find((c) => c.memberId === memberId);
    if (existing) {
      const r = messages.send(existing.id, body, attachedPostId);
      return r.ok ? ok({ id: existing.id, crisis: r.crisis }) : r;
    }
    const mode = messages.canStart(memberId);
    if (mode === "unavailable") return fail(MSG.cantReceive);
    if (mode === "none") return fail("This member isn't taking messages.");
    if (s.me.joinedDaysAgo < 7 && s.counters.newConversations >= 10) return fail(MSG.conversationLimit);
    if (!body.trim() && !attachedPostId) return fail("Write a message first.");
    const id = uid("cv");
    const crisis = detectCrisis(body);
    set((x) => ({
      ...x,
      counters: { ...x.counters, newConversations: x.counters.newConversations + 1 },
      conversations: [
        {
          id,
          memberId,
          kind: "dm",
          request: mode === "request" ? "outgoing" : undefined,
          muted: false,
          unread: false,
          crisisFlagged: crisis !== "none",
          messages: [{ id: uid("m"), from: "me", body: body.trim(), minutesAgo: 0, attachedPostId }],
        },
        ...x.conversations,
      ],
    }));
    return ok({ id, crisis });
  },

  send(id: string, body: string, attachedPostId?: string): Result {
    const gate = confirmed();
    if (gate) return gate;
    const s = get();
    const c = s.conversations.find((x) => x.id === id);
    if (!c) return fail("This conversation isn't available.");
    if (c.request === "outgoing") {
      const m = s.members.find((x) => x.id === c.memberId);
      return fail(`You can send more once ${m?.showRealName ? m.firstName : `@${m?.handle}`} accepts your message request.`);
    }
    if (!body.trim() && !attachedPostId) return fail("Write a message first.");
    if (body.length > 5000) return fail("Messages can be up to 5,000 characters.");
    const crisis = detectCrisis(body);
    set((x) => ({
      ...x,
      conversations: [
        {
          ...c,
          request: c.request === "incoming" ? undefined : c.request,
          crisisFlagged: c.crisisFlagged || crisis !== "none",
          messages: [...c.messages, { id: uid("m"), from: "me", body: body.trim(), minutesAgo: 0, attachedPostId }],
        },
        ...x.conversations.filter((k) => k.id !== id),
      ],
    }));
    return ok({ id, crisis });
  },

  acceptRequest(id: string) {
    set((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === id ? { ...c, request: undefined } : c)) }));
  },
  /** Deleting a request is silent: the sender is never told. */
  deleteRequest(id: string) {
    set((s) => ({ ...s, conversations: s.conversations.filter((c) => c.id !== id) }));
  },
  toggleMute(id: string) {
    set((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === id ? { ...c, muted: !c.muted } : c)) }));
  },
  deleteForMe(id: string) {
    set((s) => ({ ...s, conversations: s.conversations.filter((c) => c.id !== id) }));
  },
  markRead(id: string) {
    set((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: false } : c)) }));
  },
  /** Edit and delete only within 15 minutes of sending. */
  editMessage(convId: string, msgId: string, body: string) {
    set((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === convId ? { ...c, messages: c.messages.map((m) => (m.id === msgId && m.minutesAgo <= 15 ? { ...m, body, edited: true } : m)) } : c,
      ),
    }));
  },
  deleteMessage(convId: string, msgId: string) {
    set((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === convId ? { ...c, messages: c.messages.map((m) => (m.id === msgId && m.minutesAgo <= 15 ? { ...m, deleted: true, body: "" } : m)) } : c,
      ),
    }));
  },
};

export const notifications = {
  markAllRead() {
    set((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  },
};

/* ------------------------------------------------------------------ Guide */

export const guide = {
  ask(chatId: string | null, question: string): Result {
    const s = get();
    const q = question.trim();
    if (!q) return fail("Type a question first.");
    const turn = askGuide(q, s.useProfileAnswers && s.me.healthConsent ? s.me.diagnoses : []);
    // Crisis replies are free and work at a zero balance.
    let credits = s.credits;
    if (turn.cost > 0) {
      const next = spend(s.credits, turn.cost);
      if (!next) return fail("You're out of credits.", "credits");
      credits = { ...s.credits, ...next };
    }
    const id = chatId ?? uid("gc");
    set((x) => {
      const chats = x.guideChats.some((c) => c.id === id)
        ? x.guideChats.map((c) => (c.id === id ? { ...c, turns: [...c.turns, turn] } : c))
        : [{ id, title: q.slice(0, 60), turns: [turn], daysAgo: 0 } as GuideChat, ...x.guideChats];
      let next: State = { ...x, credits, guideChats: chats };
      const total = credits.free + credits.purchased;
      if (turn.cost > 0 && total <= CREDITS.lowWarning) {
        next = notify(next, { kind: "credits", text: `You have ${total} Grove Guide credits left`, href: "/credits" });
      }
      return next;
    });
    return ok({ id });
  },
  rate(chatId: string, turnId: string, rating: "helpful" | "not-helpful", reason?: string) {
    set((s) => ({
      ...s,
      guideChats: s.guideChats.map((c) =>
        c.id === chatId ? { ...c, turns: c.turns.map((t) => (t.id === turnId ? { ...t, rating, ratingReason: reason } : t)) } : c,
      ),
    }));
  },
  deleteChat(id: string) {
    set((s) => ({ ...s, guideChats: s.guideChats.filter((c) => c.id !== id) }));
  },
  deleteAll() {
    set((s) => ({ ...s, guideChats: [] }));
  },
  setUseProfile(on: boolean) {
    set((s) => ({ ...s, useProfileAnswers: on }));
  },

  createList(type: string, date: string, onMind: string): Result {
    const s = get();
    if (!type) return fail("Choose the appointment type.");
    const next = spend(s.credits, CREDITS.appointmentListCost);
    if (!next) return fail("You're out of credits.", "credits");
    const id = uid("al");
    set((x) => ({
      ...x,
      credits: { ...x.credits, ...next },
      appointmentLists: [
        { id, type, date: date || undefined, onMind: onMind.trim() || undefined, questions: appointmentQuestions(type, onMind), daysAgo: 0 },
        ...x.appointmentLists,
      ],
    }));
    return ok({ id });
  },
  updateList(id: string, questions: State["appointmentLists"][number]["questions"]) {
    set((s) => ({ ...s, appointmentLists: s.appointmentLists.map((l) => (l.id === id ? { ...l, questions } : l)) }));
  },
  deleteList(id: string) {
    set((s) => ({ ...s, appointmentLists: s.appointmentLists.filter((l) => l.id !== id) }));
  },
};

/* ---------------------------------------------------------------- Credits */

export const credits = {
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
          { id: uid("pu"), packId, credits: pack.credits, price: pack.price, status: outcome, daysAgo: 0 },
          ...x.credits.purchases,
        ],
      },
    }));
    return outcome === "paid" ? ok() : fail("Your payment didn't go through, and no credits were added. Please try again.");
  },
};

/* ---------------------------------------------------------------- Partner */

export const partner = {
  invite(email: string, note: string): Result {
    const s = get();
    if (s.partner.linked) return fail(MSG.alreadyPartnered);
    const e = checks.email(email);
    if (e) return fail(e);
    if (normalizeEmail(email) === s.me.email) return fail(MSG.selfInvite);
    const crisis = detectCrisis(note);
    set((x) => ({
      ...x,
      partner: { ...x.partner, invite: { email: normalizeEmail(email), note: note.trim() || undefined, status: "pending", resends: 0, daysAgo: 0 } },
    }));
    return ok({ crisis });
  },
  resend(): Result {
    const inv = get().partner.invite;
    if (!inv) return fail("There's no invite to resend.");
    if (inv.resends >= 3) return fail(MSG.resendLimit);
    set((s) => ({ ...s, partner: { ...s.partner, invite: { ...inv, resends: inv.resends + 1, daysAgo: 0 } } }));
    return ok();
  },
  cancel() {
    set((s) => ({ ...s, partner: { ...s.partner, invite: s.partner.invite && { ...s.partner.invite, status: "cancelled" } } }));
  },
  /** Demo: the invited partner accepts. Links accounts and opens the family space. */
  demoAccept() {
    set((s) =>
      notify(
        {
          ...s,
          partner: { linked: true, firstName: "Alex", showsBadge: true, invite: s.partner.invite && { ...s.partner.invite, status: "accepted" } },
          family: {
            items: [
              { id: uid("fi"), kind: "note", refId: "fn-1", title: "Questions for Thursday's consult", owner: "partner", access: "edit", daysAgo: 0 },
            ],
            notes: [
              {
                id: "fn-1",
                title: "Questions for Thursday's consult",
                body: "Ask about recovery time after excision.\nCan I be in the room for the retrieval?\nWhat does the clinic's after-hours line cover?",
                versions: [
                  { id: uid("v"), title: "Questions for Thursday's consult", body: "Ask about recovery time after excision.", by: "partner", minutesAgo: 120 },
                ],
              },
            ],
            activity: [
              { id: uid("a"), text: "Alex started a family note: Questions for Thursday's consult", minutesAgo: 0 },
              { id: uid("a"), text: "You and Alex linked your accounts", minutesAgo: 0 },
            ],
          },
        },
        { kind: "partner", text: "Alex accepted your invite. Your family space is ready.", href: "/family" },
      ),
    );
  },
  unlink() {
    set((s) => ({
      ...s,
      partner: { linked: false, firstName: "", showsBadge: false },
      family: {
        items: s.family.items.filter((i) => i.owner === "me" && i.kind !== "note").map((i) => i),
        notes: s.family.notes.map((n) => ({ ...n, past: true })),
        activity: [{ id: uid("a"), text: "You unlinked from your partner. Sharing has ended.", minutesAgo: 0 }, ...s.family.activity],
      },
    }));
  },
};

/* ----------------------------------------------------------------- Family */

export const family = {
  share(item: Omit<FamilyItem, "id" | "owner" | "daysAgo">) {
    set((s) => ({
      ...s,
      family: {
        ...s.family,
        items: [{ ...item, id: uid("fi"), owner: "me", daysAgo: 0 }, ...s.family.items.filter((i) => i.refId !== item.refId)],
        activity: [{ id: uid("a"), text: `You shared ${item.title} (${item.access === "edit" ? "can edit" : "view only"})`, minutesAgo: 0 }, ...s.family.activity],
      },
    }));
  },
  setAccess(id: string, access: "view" | "edit") {
    set((s) => ({
      ...s,
      family: {
        ...s.family,
        items: s.family.items.map((i) => (i.id === id && i.owner === "me" ? { ...i, access } : i)),
        activity: [{ id: uid("a"), text: `You changed access to ${access === "edit" ? "can edit" : "view only"}`, minutesAgo: 0 }, ...s.family.activity],
      },
    }));
  },
  stopSharing(id: string) {
    set((s) => {
      const item = s.family.items.find((i) => i.id === id);
      if (!item || item.owner !== "me") return s;
      return {
        ...s,
        family: {
          ...s.family,
          items: s.family.items.filter((i) => i.id !== id),
          activity: [{ id: uid("a"), text: `You stopped sharing ${item.title}`, minutesAgo: 0 }, ...s.family.activity],
        },
      };
    });
  },
  createNote(title: string, body: string) {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = MSG.noteTitle;
    if (!body.trim()) errs.body = MSG.noteBody;
    if (Object.keys(errs).length) return { ok: false as const, errs };
    const id = uid("fn");
    set((s) => ({
      ...s,
      family: {
        items: [{ id: uid("fi"), kind: "note", refId: id, title: title.trim(), owner: "me", access: "edit", daysAgo: 0 }, ...s.family.items],
        notes: [{ id, title: title.trim(), body: body.trim(), versions: [] }, ...s.family.notes],
        activity: [{ id: uid("a"), text: `You started a family note: ${title.trim()}`, minutesAgo: 0 }, ...s.family.activity],
      },
    }));
    return { ok: true as const, id, errs: {} };
  },
  editNote(id: string, title: string, body: string) {
    set((s) => ({
      ...s,
      family: {
        ...s.family,
        notes: s.family.notes.map((n) =>
          n.id === id
            ? { ...n, title, body, versions: [{ id: uid("v"), title: n.title, body: n.body, by: "me", minutesAgo: 0 }, ...n.versions] }
            : n,
        ),
        activity: [{ id: uid("a"), text: `You edited ${title}`, minutesAgo: 0 }, ...s.family.activity],
      },
    }));
  },
  restore(noteId: string, versionId: string) {
    set((s) => ({
      ...s,
      family: {
        ...s.family,
        notes: s.family.notes.map((n) => {
          if (n.id !== noteId) return n;
          const v = n.versions.find((x) => x.id === versionId);
          if (!v) return n;
          return { ...n, title: v.title, body: v.body, versions: [{ id: uid("v"), title: n.title, body: n.body, by: "me", minutesAgo: 0 }, ...n.versions] };
        }),
        activity: [{ id: uid("a"), text: "You restored an earlier version of a note", minutesAgo: 0 }, ...s.family.activity],
      },
    }));
  },
};

/* --------------------------------------------------------------- Settings */

export const settings = {
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
      return fail(MSG.handleCooldown(d.toLocaleDateString("en-US", { month: "long", day: "numeric" })));
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
      me: { ...s.me, healthConsent: false, stages: [], treatments: [], nextDate: "", diagnoses: [], otherDiagnosis: "", paths: [], shareJourney: false },
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
    set((s) => ({ ...s, signedIn: false, deletion: { daysLeft: 14, deletePosts }, me: { ...s.me, status: "deletion-pending" } }));
  },
  restoreAccount() {
    set((s) => ({ ...s, signedIn: true, deletion: undefined, me: { ...s.me, status: "active" } }));
  },
  acknowledgeLevelUp() {
    set((s) => ({ ...s, pendingLevelUp: undefined }));
  },
  dismissProfileCard() {
    set((s) => ({ ...s, me: { ...s.me, profileCardDismissed: true } }));
  },
  saveArticle(slug: string) {
    set((s) => ({
      ...s,
      savedArticles: s.savedArticles.includes(slug) ? s.savedArticles.filter((x) => x !== slug) : [...s.savedArticles, slug],
    }));
  },
  rateArticle(slug: string, v: "yes" | "no") {
    set((s) => ({ ...s, articleHelpful: { ...s.articleHelpful, [slug]: v } }));
  },
  appeal() {
    set((s) => ({ ...s, suspension: s.suspension && { ...s.suspension, appealed: true } }));
  },
};

/* ------------------------------------------------------------------- Demo */

export const demo = {
  persona(kind: State["persona"]) {
    replace(persona(kind));
  },
  reset() {
    try {
      window.localStorage.removeItem("fertility-grove-state-v2");
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
        until: new Date(Date.now() + 7 * 864e5).toLocaleDateString("en-US", { month: "long", day: "numeric" }),
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
      const name = mentor ? (mentor.showRealName ? `${mentor.firstName} ${mentor.lastInitial}.` : `@${mentor.handle}`) : "The mentor";
      let next: State = {
        ...s,
        mentorRequests: s.mentorRequests.map((x) =>
          x.id === r.id ? { ...x, status: outcome, note: outcome === "declined" ? MSG.mentorDecline : undefined } : x,
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
                { id: uid("m"), from: "them", body: "I'd be glad to. Tell me a little about where you are this week.", minutesAgo: 0 },
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
      return notify(next, { kind: "mentor", text, href: outcome === "accepted" ? "/messages" : "/mentors", actorId: r.mentorId });
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
            ? { ...m, firstName: "Aleksandra-Wiśniewska", lastInitial: "K", showRealName: true, pronouns: "she/they", badges: ["mentor", "partner"] }
            : m.id === "m-jules"
              ? { ...m, firstName: "Jo", lastInitial: "N", showRealName: true }
              : m,
      ),
      posts: s.posts.map((p) =>
        p.id === "p-4"
          ? { ...p, title: title.slice(0, 150), tags: ["IVF", "AMH", "Egg retrieval", "Insurance", "Work and treatment"], up: 1284 }
          : p.id === "p-2"
            ? { ...p, source: "From research or guidelines", sourceLink: "https://www.reproductivefacts.org/news-and-publications/fact-sheets-and-infographics/what-is-a-normal-fertilization-rate-after-ivf-with-icsi/" }
            : p,
      ),
      groups: s.groups.map((g) =>
        g.id === "g-dor"
          ? { ...g, name: "Diminished ovarian reserve and premature ovarian insufficiency".slice(0, 60) }
          : g.id === "g-eggfreeze"
            ? { ...g, members: 1, postsThisWeek: 0 }
            : g,
      ),
      conversations: s.conversations.map((c) =>
        c.id === "cv-chloe"
          ? { ...c, messages: [...c.messages, { id: "wc-1", from: "them", body: "This one helped me: https://www.reproductivefacts.org/news-and-publications/fact-sheets-and-infographics/endometriosis-does-it-cause-infertility/", minutesAgo: 1 }] }
          : c,
      ),
    }));
  },

  /** Re-seed the accepted request so the mentoring thread demo always works. */
  seedMentoring() {
    set((s) => ({ ...s, mentorRequests: s.mentorRequests.length ? s.mentorRequests : MENTOR_REQUESTS }));
  },
};
