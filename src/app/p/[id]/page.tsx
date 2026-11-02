"use client";

/* A post shared outside Fertility Grove (PRD §10). Guests see the title, body,
   author and score, then an invitation to join. Comments never show. */

import Link from "next/link";
import { useParams } from "next/navigation";
import { ReadingFrame } from "@/components/AuthFrame";
import { EmptyState, LinkButton, Name, Panel, SourceLabel, TypeChip } from "@/components/ui";
import { sel, useStore } from "@/lib/store";

export default function PublicPostPage() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const post = s.posts.find((p) => p.id === id);
  const author = post && sel.person(s, post.authorId);
  const available = post && author && post.allowSharing && post.status === "published";

  if (!available) {
    return (
      <ReadingFrame title="Fertility Grove">
        <EmptyState art="lens" title="This post isn't available." body="The author may have turned off sharing, or the post was removed." action={<LinkButton href="/">What is Fertility Grove?</LinkButton>} />
      </ReadingFrame>
    );
  }

  const group = s.groups.find((g) => g.id === post.groupId);
  return (
    <ReadingFrame title={post.title}>
      <Panel as="article" className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
          <TypeChip type={post.type} />
          <Name member={author} link={false} />
          {group && <span className="text-muted">· {group.name}</span>}
        </div>
        <p className="mt-5 text-[17px] leading-relaxed whitespace-pre-line text-ink">{post.body}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-[14px] text-muted">
          <span>
            Score <strong className="tabular text-ink">{sel.score(post)}</strong>
          </span>
          <SourceLabel source={post.source} link={post.sourceLink} />
        </div>
      </Panel>
      <div className="mt-6 rounded-[20px] bg-grove p-6 text-white sm:p-8">
        <h2 className="serif text-[30px] leading-tight">Join to read the conversation</h2>
        <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-white/85">
          Fertility Grove is a private community for people going through infertility, and their partners. Replies stay inside.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <LinkButton href="/signup" variant="light">Create account</LinkButton>
          <Link href="/login" className="press inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold text-white hover:bg-white/10">
            Sign in
          </Link>
        </div>
      </div>
    </ReadingFrame>
  );
}
