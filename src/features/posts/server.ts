/* Server-safe reads for server layouts (no client hooks): only the sample posts the server knows.
   TODO(api): ask the public post endpoint. The prototype's posts live in the browser, so anything
   else stays unlisted, the safe default. */

import { GROUPS } from "@/lib/mock-server/seed/groups";
import { MEMBERS } from "@/lib/mock-server/seed/members";
import { POSTS } from "@/lib/mock-server/seed/posts";
import { publicPostState } from "@/lib/rules/guests";

/** The post's title when search engines may list it (PRD v1.2 §10), otherwise null. */
export function listedPostTitle(id: string): string | null {
  const post = POSTS.find((p) => p.id === id);
  const group = post && GROUPS.find((g) => g.id === post.groupId);
  const author = post && MEMBERS.find((m) => m.id === post.authorId);
  return publicPostState(post, group, author) === "listed" && post ? post.title : null;
}
