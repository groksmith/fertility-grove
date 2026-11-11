"use client";

/* A public group page (PRD v1.2 §8, §10). Only for groups visible to guests:
   its name, description, who it's for, rules, member count, posts this week,
   and the posts guests can read, newest first. No member avatars, no sort or
   filters, no Join button and no side column. */

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReadingFrame } from "@/components/AuthFrame";
import { GroupCover } from "@/components/art/Brand";
import { JoinBlock, PublicPostCard, useGuestAction } from "@/components/Guest";
import { EmptyState, LinkButton, Panel } from "@/components/ui";
import { publicGroup } from "@/lib/api";
import { sel, useStore } from "@/lib/store";

const DEFAULT_RULES = "Be kind, share your own experience, and keep medical details general. The community guidelines apply here too.";

export default function PublicGroupPage() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const { ask, ui } = useGuestAction();
  // TODO(api): the public group endpoint (GET, no sign-in).
  const data = publicGroup(s, id);

  if (!data) {
    return (
      <ReadingFrame title="Fertility Grove">
        <EmptyState
          art="lens"
          title="This group isn't open to visitors."
          body="Its posts are for members only."
          action={<LinkButton href="/community" variant="secondary">Read public posts</LinkButton>}
        />
      </ReadingFrame>
    );
  }

  const { group, posts } = data;
  return (
    <ReadingFrame title={group.name} lede={group.description}>
      <Link href="/community" className="press -mt-4 mb-6 inline-flex h-11 items-center gap-1.5 text-[15px] font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden /> All public posts
      </Link>
      <div className="flex items-center gap-4">
        <GroupCover group={group} size={64} />
        <p className="tabular text-[15px] text-ink-soft">
          {group.type} group · <strong className="font-semibold text-ink">{sel.plural(group.members, "member")}</strong> ·{" "}
          <strong className="font-semibold text-ink">{sel.plural(group.postsThisWeek, "post")}</strong> this week
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-[16px] font-semibold">Who it&apos;s for</h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{group.whoFor}</p>
        </Panel>
        <Panel className="p-5">
          <h2 className="text-[16px] font-semibold">Group rules</h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{group.rules ?? DEFAULT_RULES}</p>
        </Panel>
      </div>

      <h2 className="mt-10 text-[18px] font-semibold">Public posts</h2>
      {posts.length === 0 ? (
        <div className="mt-4">
          <EmptyState art="sprout" title="No public posts here yet." body="Members choose post by post what to share with everyone." />
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {posts.map((item) => (
            <li key={item.post.id}>
              <PublicPostCard item={item} ask={ask} showGroup={false} />
            </li>
          ))}
        </ul>
      )}

      <JoinBlock title={`Join to read the conversations in ${group.name}`} />
      {ui}
    </ReadingFrame>
  );
}
