/* Guest browsing, PRD v1.2 §10. Pure rules, so the same checks serve the
   guest pages (from the store) and the server's page metadata (from the
   sample data). The backend applies the same rules to its public endpoints. */

import type { Group, Member, Post } from "../types";

/** A group guests may browse: visible to guests, readable by any member, live. */
export const groupOpenToGuests = (g: Group | undefined): boolean =>
  !!g && g.visibleToGuests && g.readAccess === "any" && g.status !== "draft";

/** A post shows to guests only while all of these hold (§10 "What guests can read"). */
export function guestCanRead(post: Post, group: Group | undefined, author: Member | undefined) {
  return (
    groupOpenToGuests(group) &&
    post.showToVisitors &&
    post.status === "published" &&
    !post.crisisPending &&
    !!author &&
    !author.unavailable
  );
}

/** Who may open /p/[id]: posts shown to visitors, and posts shared by link. */
export function publicPostState(post: Post | undefined, group: Group | undefined, author: Member | undefined) {
  if (!post || !author || author.unavailable || post.status !== "published" || post.crisisPending) return "unavailable" as const;
  if (guestCanRead(post, group, author)) return "listed" as const;
  // Shared by link only: it opens for anyone with the link, but stays unlisted.
  if (post.allowSharing && group?.readAccess === "any") return "link-only" as const;
  return "unavailable" as const;
}

/** What guests are shown of a member: their display identity and nothing else.
    A member using a handle never shows any part of their real name. */
export function publicAuthor(m: Member): Member {
  return {
    ...m,
    firstName: m.showRealName ? m.firstName : "",
    lastInitial: m.showRealName ? m.lastInitial : "",
    aboutMe: undefined,
    myStory: undefined,
    diagnoses: [],
    stages: [],
    paths: [],
    follows: [],
    blocks: undefined,
    mentor: undefined,
    credentials: undefined,
  };
}
