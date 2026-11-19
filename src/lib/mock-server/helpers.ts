/* What every mock endpoint shares: the result shape, ids, the confirmed-email gate, notifications and
   Sunlight. Feature services call these where the backend will do the same work server-side. */

import type { CrisisLevel } from "@/lib/rules/crisis";
import { keepLevel, levelIndex } from "@/lib/rules/sunlight";
import { MSG } from "@/lib/rules/validation";
import { get, type State } from "./db";

export type Result =
  | { ok: true; id?: string; crisis?: CrisisLevel; note?: string }
  | { ok: false; error: string; code?: "unconfirmed" | "join" | "credits" };

export const ok = (extra: Omit<Extract<Result, { ok: true }>, "ok"> = {}): Result => ({
  ok: true,
  ...extra,
});
export const fail = (error: string, code?: "unconfirmed" | "join" | "credits"): Result => ({
  ok: false,
  error,
  code,
});

let seq = 0;
export const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

/** A fixed, unguessable invite code, made once per account (PRD §10).
    TODO(api): the backend issues it; GET /api/v1/invites/mine returns it. */
export function newInviteCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => abc[Math.floor(Math.random() * abc.length)]).join("");
}

export const DEMO_EMAIL = "annie.m@grove.test";
export const DEMO_PASSWORD = "sunlight-demo";

/** Unconfirmed members can browse and onboard but not post, comment, vote,
 *  message, request a mentor or buy credits (PRD §4). */
export function confirmed(): Result | null {
  const { me } = get();
  return me.status === "unconfirmed" ? fail(MSG.unconfirmed(me.email), "unconfirmed") : null;
}

export function notify(
  s: State,
  n: Omit<State["notifications"][number], "id" | "minutesAgo" | "read">,
): State {
  return {
    ...s,
    notifications: [{ id: uid("n"), minutesAgo: 0, read: false, ...n }, ...s.notifications],
  };
}

/** Adds Sunlight, keeps the level from ever dropping, and queues the level-up
 *  celebration when a new threshold is crossed. */
export function sunlight(s: State, amount: number, label: string): State {
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
    next = notify(next, { kind: "level", text: `You grew into a ${level}`, href: "/dashboard" });
  }
  return next;
}
