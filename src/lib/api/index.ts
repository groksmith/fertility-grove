/* The backend's endpoints, as the screens use them. The prototype has no API
   client yet, so each call here reads or writes the local store (which stands
   in for the server) and returns the shape the backend returns or will
   return. Every body marked TODO(api) becomes a request; the screens that
   call it shouldn't need to change. */

import { act, get, sel, type State } from "../store";
import { groupOpenToGuests, guestCanRead, publicAuthor, publicPostState } from "../rules/guests";
import { checks } from "../rules/validation";
import type { Group, Member, Post } from "../types";

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

/** The link to show. The frontend's route is /invite/[code]; until the backend
    and frontend agree on /join or /invite, build it from the code whenever
    the url the API returns points somewhere else. */
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
  if (s.me.inviteCode && s.me.inviteCode === code) return sel.meAsMember(s);
  return undefined;
}

/* --------------------------------------------------------------- Onboarding */

/** POST /api/v1/onboarding/complete. Safe to call twice. TODO(api): exists. */
export function completeOnboarding() {
  if (get().step < 9) act.onboarding.complete();
}

/* ------------------------------------------------------------------ Profile */

/** What GET /api/v1/profile/me says about the "Complete your profile" card.
    The backend's keys are "diagnosis", "path", "photo" and "aboutMe"; it will
    add "story" (My story) too. TODO(api): exists, apart from "story". */
export function profileCompletion(s: State, now = Date.now()) {
  const missingProfileItems = sel.profileGaps(s).map((g) => g.key);
  const hidden = (s.me.profileCardHiddenUntil ?? 0) > now;
  return { showProfileCompletionCard: missingProfileItems.length > 0 && !hidden, missingProfileItems };
}

/** POST /api/v1/profile/me/completion-card/dismiss: hides it for 30 days, on
    every device. TODO(api): exists. */
export function dismissCompletionCard() {
  act.settings.dismissProfileCard();
}

/* --------------------------------------------------------------------- Auth */

/** POST /api/v1/auth/logout, allowed during onboarding. TODO(api): exists. */
export function logout() {
  act.auth.signOut();
}

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

/** POST /api/v1/auth/sign-up-waitlist. TODO(api): exists; nothing is kept here. */
export function joinWaitlist(email: string): { ok: true } | { ok: false; error: string } {
  const error = checks.email(email);
  return error ? { ok: false, error } : { ok: true };
}

/* ------------------------------------------------------------ Guest browsing */

export interface PublicPost {
  post: Post;
  group: Group;
  author: Member;
  replies: number;
  /** Listed: shown to visitors, so search engines may list it. Otherwise the
      post was shared by link only and stays unlisted. */
  listed: boolean;
}

function toPublic(s: State, post: Post, listed: boolean): PublicPost | null {
  const group = s.groups.find((g) => g.id === post.groupId);
  const author = sel.person(s, post.authorId);
  if (!group || !author) return null;
  return { post, group, author: publicAuthor(author), replies: sel.commentCount(s, post.id), listed };
}

const readable = (s: State, p: Post) =>
  guestCanRead(p, s.groups.find((g) => g.id === p.groupId), sel.person(s, p.authorId));

/** The groups guests can browse. TODO(api): not built yet. */
export function guestGroups(s: State) {
  return s.groups.filter((g) => groupOpenToGuests(g));
}

/** The public feed: posts guests can read, newest first, optionally from one
    group. TODO(api): not built yet (GET, no sign-in). */
export function publicFeed(s: State, groupId?: string): PublicPost[] {
  return s.posts
    .filter((p) => readable(s, p) && (!groupId || p.groupId === groupId))
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .flatMap((p) => toPublic(s, p, true) ?? []);
}

/** A public group page, or null when the group isn't open to guests.
    TODO(api): not built yet (GET, no sign-in). */
export function publicGroup(s: State, id: string) {
  const group = s.groups.find((g) => g.id === id);
  if (!group || !groupOpenToGuests(group)) return null;
  return { group, posts: publicFeed(s, id) };
}

/** A public post page, or null for "This post isn't available."
    TODO(api): not built yet (GET, no sign-in). */
export function publicPost(s: State, id: string): PublicPost | null {
  const post = s.posts.find((p) => p.id === id);
  const state = publicPostState(post, post && s.groups.find((g) => g.id === post.groupId), post && sel.person(s, post.authorId));
  if (!post || state === "unavailable") return null;
  return toPublic(s, post, state === "listed");
}
