import type { Metadata } from "next";
import { GROUPS } from "@/lib/data/groups";
import { MEMBERS } from "@/lib/data/members";
import { POSTS } from "@/lib/data/posts";
import { publicPostState } from "@/lib/rules/guests";

/* Search engines (PRD v1.2 §10): a post shown to visitors may be listed; a
   post shared by link only, or one that isn't available, may not.
   TODO(api): ask the public post endpoint. The prototype's posts live in the
   browser, so the server only knows the sample posts; anything else stays
   unlisted, the safe default. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = POSTS.find((p) => p.id === id);
  const group = post && GROUPS.find((g) => g.id === post.groupId);
  const author = post && MEMBERS.find((m) => m.id === post.authorId);
  const state = publicPostState(post, group, author);
  if (state === "listed" && post) {
    return { title: `${post.title} · Fertility Grove`, robots: { index: true, follow: true } };
  }
  return { title: "A post on Fertility Grove", robots: { index: false, follow: false } };
}

export default function PublicPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
