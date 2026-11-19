/* The posts endpoints. There is no backend yet: each method reads or writes the mock server and
   returns what the API returns (or will). A body that becomes a request is marked TODO(api). */

import { NO_DOWNVOTE } from "@/config/options";
import { confirmed, fail, get, ok, type Result, set, uid } from "@/lib/mock-server";
import { detectCrisis } from "@/lib/rules/crisis";
import { MSG } from "@/lib/rules/validation";
import type { Post, PostType, Source, Vote } from "@/types/domain";
import type { PostInput } from "./schema";

export const postService = {
  create(p: PostInput): Result {
    const gate = confirmed();
    if (gate) return gate;
    const s = get();
    if (!s.joined.includes(p.groupId)) return fail("Join this group to post in it.", "join");
    if (s.counters.posts >= 10) return fail(MSG.postLimit);
    const crisis = detectCrisis(`${p.title} ${p.body}`);
    // Show to visitors only where the group allows guests, and it keeps sharing on.
    const visitors =
      p.showToVisitors &&
      !!s.groups.find((g) => g.id === p.groupId && g.visibleToGuests && g.readAccess === "any");
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
          source: p.source || undefined,
          sourceLink: p.sourceLink.trim() || undefined,
          tags: p.tags,
          allowSharing: p.allowSharing || visitors,
          showToVisitors: visitors,
          crisisPending: crisis === "signal" || undefined,
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

  edit(
    id: string,
    patch: Partial<Pick<Post, "title" | "body" | "allowSharing" | "showToVisitors">>,
  ) {
    set((s) => ({
      ...s,
      posts: s.posts.map((p) => {
        if (p.id !== id) return p;
        const group = s.groups.find((g) => g.id === p.groupId);
        const next = {
          ...p,
          ...patch,
          edited: patch.title !== undefined || patch.body !== undefined ? true : p.edited,
        };
        next.showToVisitors =
          next.showToVisitors && !!group?.visibleToGuests && group.readAccess === "any";
        if (next.showToVisitors) next.allowSharing = true;
        return next;
      }),
    }));
  },

  /** Appeal a moderator's removal (PRD §19). TODO(api): no posts API yet. */
  appeal(id: string) {
    set((s) => ({ ...s, posts: s.posts.map((p) => (p.id === id ? { ...p, appealed: true } : p)) }));
  },

  remove(id: string) {
    set((s) => ({
      ...s,
      posts: s.posts.map((p) => (p.id === id ? { ...p, status: "deleted" } : p)),
    }));
  },

  vote(id: string, v: Vote): Result {
    const gate = confirmed();
    if (gate) return gate;
    const s = get();
    const post = s.posts.find((p) => p.id === id);
    if (!post || post.authorId === "me") return fail("You can't vote on your own post.");
    if (!s.joined.includes(post.groupId)) return fail("Join this group to vote.", "join");
    if (v === -1 && NO_DOWNVOTE.includes(post.type))
      return fail("No downvotes on this kind of post.");
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
    set((s) => ({
      ...s,
      posts: s.posts.map((p) => (p.id === id ? { ...p, saved: !p.saved } : p)),
    }));
  },

  comment(
    postId: string,
    body: string,
    opts: { parentId?: string; mention?: string; source?: Source } = {},
  ): Result {
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
    if (v === -1 && NO_DOWNVOTE.includes(post.type))
      return fail("No downvotes on this kind of post.");
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
    set((s) => ({
      ...s,
      comments: s.comments.map((c) => (c.id === id ? { ...c, body, edited: true } : c)),
    }));
  },

  appealComment(id: string) {
    set((s) => ({
      ...s,
      comments: s.comments.map((c) => (c.id === id ? { ...c, appealed: true } : c)),
    }));
  },

  removeComment(id: string) {
    set((s) => ({
      ...s,
      comments: s.comments.map((c) => (c.id === id ? { ...c, status: "deleted" } : c)),
    }));
  },
};
