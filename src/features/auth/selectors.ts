/* Derived views the screens read: pure functions of the mock server's state. Display identity follows PRD §6: a handle by default, or first name plus last initial
   ("Annie M."), never a hidden name. */

import type { State } from "@/lib/mock-server";
import type { Journey } from "@/lib/rules/matching";
import type { Member } from "@/types/domain";

export function meAsMember(s: State): Member {
  const m = s.me;
  return {
    id: "me",
    handle: m.handle || "you",
    firstName: m.firstName || "You",
    lastInitial: (m.lastName || " ").charAt(0).trim(),
    showRealName: m.showRealName,
    pronouns:
      m.pronouns && m.pronouns !== "Prefer not to say"
        ? m.pronouns === "Prefer to self-describe"
          ? m.pronounsSelf
          : m.pronouns
        : undefined,
    avatarHue: m.avatarHue,
    avatar: m.avatarPreset >= 0 ? m.avatarPreset : undefined,
    sunlight: m.sunlight,
    level: m.level,
    badges: [
      ...(m.mentoring.on && !m.founding ? (["mentor"] as const) : []),
      ...(m.founding ? (["founding-mentor"] as const) : []),
      ...(s.partner.linked && m.showPartner && s.partner.showsBadge ? (["partner"] as const) : []),
    ],
    community: m.community || "womens",
    aboutMe: m.aboutMe,
    myStory: m.myStory,
    shareJourney: m.shareJourney,
    diagnoses: m.diagnoses,
    stages: m.stages,
    paths: m.paths,
    followers: s.followers.length,
    messagePolicy: m.messagePolicy,
    suggestMe: m.suggestMe,
    follows: s.following,
    joinedDaysAgo: m.joinedDaysAgo,
  };
}

export function person(s: State, id: string): Member | undefined {
  return id === "me" ? meAsMember(s) : s.members.find((m) => m.id === id);
}

export function displayName(
  m: Pick<Member, "showRealName" | "firstName" | "lastInitial" | "handle">,
) {
  if (m.showRealName) return m.lastInitial ? `${m.firstName} ${m.lastInitial}.` : m.firstName;
  return `@${m.handle}`;
}

export function journey(s: State): Journey {
  const consent = s.me.healthConsent;
  return {
    diagnoses: consent ? s.me.diagnoses : [],
    stages: consent ? s.me.stages : [],
    paths: consent ? s.me.paths : [],
    treatments: consent ? s.me.treatments : [],
  };
}

/* ------------------------------------------------------------------ Invites */

export interface MyInvite {
  code: string;
  url: string;
}

/** GET /api/v1/invites/mine. Behind the onboarding gate, so it is null until
    onboarding is complete. TODO(api): the backend exists; call it. */
export function myInvite(s: State, origin: string): MyInvite | null {
  if (s.step < 9 || !s.me.inviteCode) return null;
  // The backend builds {site}/join/{code} today.
  return { code: s.me.inviteCode, url: `${origin}/join/${s.me.inviteCode}` };
}

export function inviteLink(invite: MyInvite, origin: string) {
  try {
    if (new URL(invite.url).pathname.startsWith("/invite/")) return invite.url;
  } catch {
    /* fall through to the code */
  }
  return `${origin}/invite/${encodeURIComponent(invite.code)}`;
}

/** Who an invite code belongs to, for the invite page. TODO(api): the backend
    resolves invite codes; this mock only knows the signed-in member's own. */
export function inviteOwner(s: State, code: string): Member | undefined {
  if (s.me.inviteCode && s.me.inviteCode === code) return meAsMember(s);
  return undefined;
}

/* ----------------------------------------------------------------- Sign-up */

/** Fertility Grove is invite-only while the beta runs (PRD §24). */
const BETA_INVITE_ONLY = true;

/** GET /api/v1/auth/sign-up-status. TODO(api): exists. */
export function signUpStatus(s: State) {
  return {
    isPaused: s.signupsPaused,
    isInviteOnly: BETA_INVITE_ONLY,
    isInviteValid: false,
    canSignUp: !s.signupsPaused && !BETA_INVITE_ONLY,
  };
}
