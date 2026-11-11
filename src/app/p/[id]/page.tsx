"use client";

/* A public post page (PRD v1.2 §10). It opens for posts shown to visitors,
   and for posts shared by link. Guests see the group, post type, title, body,
   source label, time and score, the author's display identity, "{n} replies"
   and "Join to read the conversation". Never the comments. Anything a guest
   can't do opens the sign-up prompt; guests can't report, so Help's Contact
   support is linked instead. */

import Link from "next/link";
import { useParams } from "next/navigation";
import { Bookmark, Reply, Share2 } from "lucide-react";
import { ReadingFrame } from "@/components/AuthFrame";
import { JoinBlock, PublicByline, useGuestAction } from "@/components/Guest";
import { EmptyState, LinkButton, Panel, SourceLabel, TypeChip, VoteControl } from "@/components/ui";
import { publicPost } from "@/lib/api";
import { groupOpenToGuests } from "@/lib/rules/guests";
import { sel, useStore } from "@/lib/store";

export default function PublicPostPage() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const { ask, ui } = useGuestAction();
  // TODO(api): the public post endpoint (GET, no sign-in).
  const item = publicPost(s, id);

  if (!item) {
    return (
      <ReadingFrame title="Fertility Grove">
        <EmptyState art="lens" title="This post isn't available." body="The author may have turned off sharing, or the post was removed." action={<LinkButton href="/">What is Fertility Grove?</LinkButton>} />
      </ReadingFrame>
    );
  }

  const { post, group, replies } = item;
  const member = `/posts/${post.id}`;
  const action = "press inline-flex h-9 items-center gap-1.5 rounded-full bg-raised px-3 text-[14px] font-semibold text-ink-soft hover:text-ink";
  return (
    <ReadingFrame title={post.title}>
      <Panel as="article" className="p-6 sm:p-8">
        <PublicByline item={item} ask={ask} size={44} />
        <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[14px]">
          <TypeChip type={post.type} />
          <span className="text-muted">
            {groupOpenToGuests(group) ? (
              <Link href={`/community/${group.id}`} className="hover:text-ink hover:underline">
                {group.name}
              </Link>
            ) : (
              group.name
            )}
          </span>
        </div>
        <p className="mt-4 text-[17px] leading-relaxed whitespace-pre-line text-ink">{post.body}</p>
        <footer className="mt-6 flex flex-wrap items-center gap-2">
          <VoteControl up={post.up} down={post.down} my={0} allowDown={sel.allowsDownvote(post)} onVote={() => ask(member)} />
          <button type="button" onClick={() => ask(`${member}#comments`)} className={action}>
            <Reply size={16} aria-hidden /> Reply
          </button>
          <button type="button" onClick={() => ask(member)} className={action}>
            <Bookmark size={16} aria-hidden /> Save
          </button>
          <button type="button" onClick={() => ask(member)} className={action}>
            <Share2 size={16} aria-hidden /> Share
          </button>
          <span className="flex-1" />
          <SourceLabel source={post.source} link={post.sourceLink} />
        </footer>
      </Panel>

      <JoinBlock title="Join to read the conversation">
        <p className="tabular mt-2 text-[15px] font-semibold text-white">{sel.plural(replies, "reply", "replies")}</p>
      </JoinBlock>

      <p className="mt-6 text-[14px] text-muted">
        Worried about this post?{" "}
        <Link href="/help#contact-h" className="font-semibold text-ink underline underline-offset-2">
          Contact support
        </Link>
      </p>
      {ui}
    </ReadingFrame>
  );
}
