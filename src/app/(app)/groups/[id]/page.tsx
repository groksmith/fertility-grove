"use client";

/* One group. Its question: what's happening here, and can I take part? The
   header is the group itself, standing on the same painted backdrop as the
   groups list, with its painted cover and the people who've posted in it; the
   feed below takes two thirds. */

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BellOff, Check, ChevronDown, Lock, PenLine } from "lucide-react";
import { GroupCover, groupHue } from "@/components/art/Brand";
import { Spot } from "@/components/art/Scenes";
import { PostCard } from "@/components/PostCard";
import { Avatar, Button, ChipSelect, EmptyState, LinkButton, Menu, Panel, Segmented, toast } from "@/components/ui";
import { articleCover, readingFor } from "@/lib/data/articles";
import { act, sel, useStore } from "@/lib/store";
import { POST_TYPES } from "@/lib/options";
import type { PostType } from "@/lib/types";

type Sort = "newest" | "top" | "discussed";

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const [sort, setSort] = useState<Sort>("newest");
  const [picked, setPicked] = useState<string[]>([]);
  const [types, setTypes] = useState<PostType[]>([]);
  const group = s.groups.find((g) => g.id === id);

  if (!group || group.status === "draft") {
    return (
      <EmptyState
        art="lens"
        title="This group isn't available."
        body="It may have been archived or renamed."
        action={<LinkButton href="/groups" variant="secondary">Browse groups</LinkButton>}
      />
    );
  }

  const joined = s.joined.includes(group.id);
  const muted = s.muted.includes(group.id);
  const archived = group.status === "archived";
  const locked = group.readAccess === "members-only" && !joined;
  const hue = groupHue(group);
  const match = sel.groupMatches(s, 16).find((m) => m.group.id === group.id && m.why !== "Popular in the grove");

  const commentsOf = (pid: string) => sel.commentCount(s, pid);
  const reading = readingFor(group.id);
  const groupPosts = sel.visiblePosts(s).filter((p) => p.groupId === group.id);
  // The tags people actually use here, most used first. A post shows if it has any of the ones picked.
  const tagCounts = new Map<string, number>();
  for (const p of groupPosts) for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const tagOptions = [...tagCounts.keys()].sort((a, b) => tagCounts.get(b)! - tagCounts.get(a)! || a.localeCompare(b));
  const activeTags = picked.filter((t) => tagCounts.has(t));
  // Faces in the header (PRD §8): only members who posted here, most recent
  // poster first, up to 5, never padded with other members. Never you, anyone
  // either of you blocked, suspended or departing members, or the Support
  // account. A Members-only group you haven't joined shows none.
  // TODO(api): the group endpoint will return these; this derives them from the mock.
  const faces = locked
    ? []
    : [...new Set(
        s.posts
          .filter((p) => p.groupId === group.id && p.status === "published")
          .sort((a, b) => a.minutesAgo - b.minutesAgo)
          .map((p) => p.authorId),
      )]
        .flatMap((a) => s.members.find((m) => m.id === a) ?? [])
        .filter((m) => !m.unavailable && !m.badges.includes("team") && !s.blocked.includes(m.id) && !m.blocks?.includes("me"))
        .slice(0, 5);
  // Filters combine: a post shows if it is one of the picked types and has any of the picked tags.
  let posts = groupPosts.filter((p) => (!types.length || types.includes(p.type)) && (!activeTags.length || p.tags.some((t) => activeTags.includes(t))));
  const filtering = types.length > 0 || activeTags.length > 0;
  const clearFilters = () => {
    setTypes([]);
    setPicked([]);
  };
  if (sort === "top") posts = posts.filter((p) => p.minutesAgo <= 10080).sort((a, b) => sel.score(b) - sel.score(a));
  else if (sort === "discussed") posts = posts.filter((p) => p.minutesAgo <= 10080).sort((a, b) => commentsOf(b.id) - commentsOf(a.id));
  else posts = [...posts].sort((a, b) => a.minutesAgo - b.minutesAgo);

  const join = () => {
    act.groups.toggleJoin(group.id);
    toast(`Joined ${group.name}`);
  };

  return (
    <>
      <header className="mt-8 mb-6 flex flex-wrap items-start gap-x-5 gap-y-4 lg:mt-0 lg:mb-8">
        <GroupCover group={group} size={104} />
        <div className="min-w-0 flex-1 basis-[220px]">
          <h1 className="serif text-[28px] leading-[1.1] lg:text-[32px]">{group.name}</h1>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">{group.description}</p>
          {match && <p className="mt-2 text-[13px] font-semibold text-green-ink">{match.why}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            {faces.length > 0 && (
              <span aria-hidden className="flex -space-x-2">
                {faces.map((m) => (
                  <span key={m.id} className="rounded-full ring-2 ring-white">
                    <Avatar member={m} size={32} />
                  </span>
                ))}
              </span>
            )}
            <p className="tabular flex flex-wrap items-center gap-x-1.5 text-[14px] text-ink-soft">
              <span className="font-semibold" style={{ color: `var(--${hue}-700)` }}>
                {group.type} group
              </span>
              ·<strong className="font-semibold text-ink">{group.members.toLocaleString()}</strong> {group.members === 1 ? "member" : "members"} ·
              <strong className="font-semibold text-ink">{group.postsThisWeek}</strong> {group.postsThisWeek === 1 ? "post" : "posts"} this week
              {group.readAccess === "members-only" && (
                <span className="inline-flex items-center gap-1">
                  · <Lock size={12} aria-hidden /> Members-only
                </span>
              )}
              {archived && <span>· Archived, read only</span>}
            </p>
          </div>
        </div>
          <div className="flex flex-wrap gap-2">
            {archived ? null : joined ? (
              <>
                <LinkButton href={`/posts/new?group=${group.id}`}>
                  <PenLine size={16} /> Write a post
                </LinkButton>
                <Menu
                  label="Group membership"
                  trigger={(p) => (
                    <Button {...p} variant="secondary">
                      <Check size={16} /> Joined <ChevronDown size={15} />
                    </Button>
                  )}
                  items={[
                    {
                      label: muted ? "Unmute notifications" : "Mute notifications",
                      icon: <BellOff size={15} />,
                      onSelect: () => {
                        act.groups.toggleMute(group.id);
                        toast(muted ? "Notifications back on" : "Muted. Posts stay in your feed; notifications stop.");
                      },
                    },
                    {
                      label: "Leave group",
                      danger: true,
                      onSelect: () => {
                        act.groups.toggleJoin(group.id);
                        toast(`You left ${group.name}. Your own posts stay in the group.`);
                      },
                    },
                  ]}
                />
              </>
            ) : (
              <Button onClick={join}>Join group</Button>
            )}
          </div>
      </header>

      {locked ? (
        <Panel className="flex flex-col items-center px-6 py-12 text-center">
          <Spot kind="canopy" size={168} />
          <h2 className="mt-4 text-[18px] font-semibold">Any member can join this group and read posts.</h2>
          <p className="mt-1.5 max-w-[46ch] text-[15px] text-ink-soft">
            Posts here are only visible to people who&apos;ve joined, so the group stays a little more private.
          </p>
          <Button className="mt-5" onClick={join}>
            Join to read posts
          </Button>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented
                label="Sort"
                value={sort}
                onChange={setSort}
                options={[
                  { id: "newest", label: "Newest" },
                  { id: "top", label: "Top this week" },
                  { id: "discussed", label: "Most discussed" },
                ]}
              />
              <span className="flex items-center gap-3 text-[14px]">
                {filtering && (
                  <button type="button" onClick={clearFilters} className="press font-semibold text-accent underline underline-offset-2">
                    Clear filters
                  </button>
                )}
                <span className="tabular text-muted">
                  {posts.length} {posts.length === 1 ? "post" : "posts"}
                </span>
              </span>
            </div>
            {groupPosts.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-x-3">
                <span className="shrink-0 text-[14px] text-muted sm:w-32 sm:leading-9">Filter by post type</span>
                <ChipSelect label="Filter by post type" options={POST_TYPES} value={types} onChange={setTypes} />
              </div>
            )}
            {tagOptions.length > 1 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-x-3">
                <span className="shrink-0 text-[14px] text-muted sm:w-32 sm:leading-9">Filter by tag</span>
                <ChipSelect label="Filter by tag" options={tagOptions} value={activeTags} onChange={setPicked} />
              </div>
            )}
            {!joined && !archived && (
              <Panel className="flex flex-wrap items-center gap-3 px-5 py-4">
                <p className="flex-1 text-[14px] text-ink-soft">Join this group to post, comment and vote.</p>
                <Button size="sm" onClick={join}>
                  Join
                </Button>
              </Panel>
            )}
            {posts.length === 0 && filtering ? (
              <EmptyState
                art="sprout"
                title={sort === "newest" ? "No posts match those filters." : "No posts match those filters this week."}
                action={
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : posts.length === 0 ? (
              <EmptyState
                art="sprout"
                title="No posts yet. Start the conversation."
                action={joined && !archived ? <LinkButton href={`/posts/new?group=${group.id}`}>Write a post</LinkButton> : undefined}
              />
            ) : (
              <ul className="space-y-4">
                {posts.map((p) => (
                  <li key={p.id}>
                    <PostCard post={p} showGroup={false} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <aside className="space-y-4">
            <Panel className="relative overflow-hidden border-transparent p-5" style={{ background: `var(--${hue}-50)` }}>
              <Image src="/brand/cozy/e-branch-side.webp" alt="" aria-hidden width={104} height={58} className="pointer-events-none absolute -top-2 -right-4" />
              <h2 className="text-[16px] font-semibold">Who it&apos;s for</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{group.whoFor}</p>
            </Panel>
            <Panel className="p-5">
              <h2 className="text-[16px] font-semibold">Group rules</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                {group.rules ?? "Be kind, share your own experience, and keep medical details general. The community guidelines apply here too."}
              </p>
              <Link href="/help#guidelines" className="mt-3 inline-block text-[14px] font-semibold text-accent hover:underline">
                Community guidelines
              </Link>
            </Panel>
            <section aria-labelledby="group-reading" className="rounded-[20px] border border-yellow bg-yellow-tint p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 id="group-reading" className="text-[16px] font-semibold">
                  From the library
                </h2>
                <Link href="/learn" className="inline-flex items-center gap-1 text-[14px] font-semibold text-ink underline decoration-brand underline-offset-[3px]">
                  {reading.length ? "All articles" : "Browse clinician-reviewed articles"} <ArrowRight size={15} aria-hidden />
                </Link>
              </div>
              {reading.length > 0 && (
                <ul className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-2">
                  {reading.map((r) => (
                    <li key={r.href}>
                      <Link href={r.href} className="press group flex h-full items-center gap-3 rounded-[14px] bg-white p-2.5 ring-1 ring-yellow ring-inset">
                        <span aria-hidden className="relative block aspect-[4/3] w-14 shrink-0 overflow-hidden rounded-[8px]">
                          <Image src={articleCover(r.article.slug)} alt="" fill sizes="112px" quality={90} className="object-cover" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[14px] leading-snug font-semibold text-ink underline decoration-brand underline-offset-[3px]">{r.label}</span>
                          <span className="mt-1 block text-[13px] leading-snug text-muted">{r.article.title}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      )}
    </>
  );
}
