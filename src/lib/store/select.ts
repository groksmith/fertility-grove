/* Derived views of the state. Display identity follows PRD §6: a handle by
   default, or first name plus last initial ("Annie M."), never a hidden name. */

import { articleBySlug } from "../data/articles";
import { NO_DOWNVOTE } from "../options";
import { total } from "../rules/credits";
import { matchGroups, matchPeople, type Journey } from "../rules/matching";
import type { Comment, Member, Post } from "../types";
import type { State } from "./state";

export function meAsMember(s: State): Member {
  const m = s.me;
  return {
    id: "me",
    handle: m.handle || "you",
    firstName: m.firstName || "You",
    lastInitial: (m.lastName || " ")[0].trim(),
    showRealName: m.showRealName,
    pronouns: m.pronouns && m.pronouns !== "Prefer not to say" ? (m.pronouns === "Prefer to self-describe" ? m.pronounsSelf : m.pronouns) : undefined,
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

export function displayName(m: Pick<Member, "showRealName" | "firstName" | "lastInitial" | "handle">) {
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

export const groupMatches = (s: State, limit = 5) =>
  matchGroups(journey(s), s.groups, s.notForMe, limit);

export const peopleMatches = (s: State, limit = 5) =>
  matchPeople(journey(s), s.members, {
    exclude: [...s.blocked, ...s.notForMe, ...s.following],
    limit,
  });

export const mentorMatches = (s: State, limit = 3) =>
  matchPeople(journey(s), s.members, {
    exclude: [...s.blocked, ...s.notForMe],
    mentorsOnly: true,
    limit,
  });

export const score = (x: { up: number; down: number }) => x.up - x.down;

/** Items at −5 or below collapse behind "Show hidden content". */
export const collapsed = (x: { up: number; down: number }) => score(x) <= -5;

export const allowsDownvote = (p: Post) => !NO_DOWNVOTE.includes(p.type);

export function visiblePosts(s: State) {
  return s.posts.filter(
    (p) =>
      (p.status === "published" || (p.status === "held" && p.authorId === "me")) &&
      !s.blocked.includes(p.authorId),
  );
}

export function feed(
  s: State,
  opts: { tab: "for-you" | "following"; sort: "newest" | "top" | "discussed"; groups: string[]; types: string[] },
) {
  const base = visiblePosts(s);
  const commentsOf = (id: string) => s.comments.filter((c) => c.postId === id && c.status === "published").length;
  let items: { post: Post; matched?: string }[];
  if (opts.tab === "following") {
    items = base
      .filter((p) => s.following.includes(p.authorId))
      .filter((p) => {
        const g = s.groups.find((x) => x.id === p.groupId);
        return g?.readAccess === "any" || s.joined.includes(p.groupId);
      })
      .map((post) => ({ post }));
  } else {
    items = base.filter((p) => s.joined.includes(p.groupId) || p.authorId === "me").map((post) => ({ post }));
    // Up to 3 a day from matched groups the member hasn't joined, never Members-only.
    const matchedIds = groupMatches(s, 5)
      .filter((m) => !s.joined.includes(m.group.id) && m.group.readAccess === "any")
      .map((m) => m.group);
    const extra = base
      .filter((p) => matchedIds.some((g) => g.id === p.groupId))
      .slice(0, 3)
      .map((post) => ({ post, matched: `From ${s.groups.find((g) => g.id === post.groupId)?.name}, a group matched to you` }));
    items = [...items, ...extra];
  }
  if (opts.groups.length) items = items.filter((i) => opts.groups.includes(i.post.groupId));
  if (opts.types.length) items = items.filter((i) => opts.types.includes(i.post.type));
  const week = 7 * 24 * 60;
  if (opts.sort === "top") {
    items = items.filter((i) => i.post.minutesAgo <= week).sort((a, b) => score(b.post) - score(a.post));
  } else if (opts.sort === "discussed") {
    items = items.filter((i) => i.post.minutesAgo <= week).sort((a, b) => commentsOf(b.post.id) - commentsOf(a.post.id));
  } else {
    items = items.sort((a, b) => a.post.minutesAgo - b.post.minutesAgo);
  }
  return items;
}

export function commentsFor(s: State, postId: string, sort: "top" | "newest") {
  const all = s.comments.filter((c) => c.postId === postId && !s.blocked.includes(c.authorId));
  const top = all.filter((c) => !c.parentId);
  const sorted = [...top].sort((a, b) =>
    sort === "top" ? score(b) - score(a) : a.minutesAgo - b.minutesAgo,
  );
  return sorted.map((c) => ({
    comment: c,
    replies: all.filter((r) => r.parentId === c.id).sort((a, b) => b.minutesAgo - a.minutesAgo),
  }));
}

export const commentCount = (s: State, postId: string) =>
  s.comments.filter((c: Comment) => c.postId === postId && c.status !== "deleted").length;

export const unreadMessages = (s: State) =>
  s.conversations.filter((c) => c.unread && !c.muted && c.request !== "outgoing").length;

export const unreadNotifications = (s: State) => s.notifications.filter((n) => !n.read).length;

export const creditTotal = (s: State) => total(s.credits);

export function savedItems(s: State) {
  return {
    posts: s.posts.filter((p) => p.saved && p.status !== "deleted"),
    stories: s.stories.filter((x) => x.saved),
    articles: s.savedArticles.map(articleBySlug).filter(Boolean),
  };
}

export function timeAgo(minutes: number) {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

/** What the "Complete your profile" card lists (PRD §5): what was skipped. */
export function profileGaps(s: State) {
  const gaps: { key: string; label: string; href: string }[] = [];
  if (s.me.healthConsent && !s.me.diagnoses.length) gaps.push({ key: "diagnosis", label: "Add a diagnosis", href: "/settings#journey" });
  if (s.me.healthConsent && !s.me.paths.length) gaps.push({ key: "path", label: "Add your path to parenthood", href: "/settings#journey" });
  if (!s.me.hasPhoto && s.me.avatarPreset < 0) gaps.push({ key: "photo", label: "Choose a photo or avatar", href: "/profile?edit=1" });
  if (!s.me.aboutMe) gaps.push({ key: "about", label: "Write a line about you", href: "/profile?edit=1" });
  if (!s.me.myStory) gaps.push({ key: "story", label: "Share your story", href: "/profile?edit=1" });
  return gaps;
}

/** "1 member", "1,284 members". English only; the product is US English. */
export function plural(n: number, one: string, many = `${one}s`) {
  return `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
}
