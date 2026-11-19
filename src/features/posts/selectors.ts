/* Derived views the screens read: pure functions of the mock server's state. */

import { NO_DOWNVOTE } from "@/config/options";
import { journey, person } from "@/features/auth";
import type { State } from "@/lib/mock-server";
import { articleBySlug } from "@/lib/mock-server/seed/articles";
import { groupOpenToGuests, guestCanRead, publicAuthor, publicPostState } from "@/lib/rules/guests";
import { matchGroups } from "@/lib/rules/matching";
import type { Comment, Group, Member, Post } from "@/types/domain";

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
  opts: {
    tab: "for-you" | "following";
    sort: "newest" | "top" | "discussed";
    groups: string[];
    types: string[];
  },
) {
  const base = visiblePosts(s);
  const commentsOf = (id: string) =>
    s.comments.filter((c) => c.postId === id && c.status === "published").length;
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
    items = base
      .filter((p) => s.joined.includes(p.groupId) || p.authorId === "me")
      .map((post) => ({ post }));
    // Up to 3 a day from matched groups the member hasn't joined, never Members-only.
    const matchedIds = matchGroups(journey(s), s.groups, s.notForMe, 5)
      .filter((m) => !s.joined.includes(m.group.id) && m.group.readAccess === "any")
      .map((m) => m.group);
    const extra = base
      .filter((p) => matchedIds.some((g) => g.id === p.groupId))
      .slice(0, 3)
      .map((post) => ({
        post,
        matched: `From ${s.groups.find((g) => g.id === post.groupId)?.name}, a group matched to you`,
      }));
    items = [...items, ...extra];
  }
  if (opts.groups.length) items = items.filter((i) => opts.groups.includes(i.post.groupId));
  if (opts.types.length) items = items.filter((i) => opts.types.includes(i.post.type));
  const week = 7 * 24 * 60;
  if (opts.sort === "top") {
    items = items
      .filter((i) => i.post.minutesAgo <= week)
      .sort((a, b) => score(b.post) - score(a.post));
  } else if (opts.sort === "discussed") {
    items = items
      .filter((i) => i.post.minutesAgo <= week)
      .sort((a, b) => commentsOf(b.post.id) - commentsOf(a.post.id));
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

export function savedItems(s: State) {
  return {
    posts: s.posts.filter((p) => p.saved && p.status !== "deleted"),
    stories: s.stories.filter((x) => x.saved),
    articles: s.savedArticles.map(articleBySlug).filter(Boolean),
  };
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
  const author = person(s, post.authorId);
  if (!group || !author) return null;
  return {
    post,
    group,
    author: publicAuthor(author),
    replies: commentCount(s, post.id),
    listed,
  };
}

const readable = (s: State, p: Post) =>
  guestCanRead(
    p,
    s.groups.find((g) => g.id === p.groupId),
    person(s, p.authorId),
  );

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
  const state = publicPostState(
    post,
    post && s.groups.find((g) => g.id === post.groupId),
    post && person(s, post.authorId),
  );
  if (!post || state === "unavailable") return null;
  return toPublic(s, post, state === "listed");
}
