"use client";

/* One group. Its question: what's happening here, and can I take part? The
   header is the group itself; the feed below takes two thirds. */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { BellOff, Check, ChevronDown, Lock, PenLine } from "lucide-react";
import { GroupCover, groupHue } from "@/components/art/Brand";
import { Spot } from "@/components/art/Scenes";
import { PostCard } from "@/components/PostCard";
import { Button, EmptyState, LinkButton, Menu, Panel, Segmented, toast } from "@/components/ui";
import { act, sel, useStore } from "@/lib/store";

type Sort = "newest" | "top" | "discussed";

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const s = useStore();
  const [sort, setSort] = useState<Sort>("newest");
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
  let posts = sel.visiblePosts(s).filter((p) => p.groupId === group.id);
  if (sort === "top") posts = posts.filter((p) => p.minutesAgo <= 10080).sort((a, b) => sel.score(b) - sel.score(a));
  else if (sort === "discussed") posts = posts.filter((p) => p.minutesAgo <= 10080).sort((a, b) => commentsOf(b.id) - commentsOf(a.id));
  else posts = [...posts].sort((a, b) => a.minutesAgo - b.minutesAgo);

  const join = () => {
    act.groups.toggleJoin(group.id);
    toast(`Joined ${group.name}`);
  };

  return (
    <>
      <Panel className="mb-6 overflow-hidden">
        <div className="h-3" style={{ background: `var(--${hue}-50)` }} />
        <div className="flex flex-wrap items-start gap-5 p-5 sm:p-7">
          <GroupCover group={group} size={88} />
          <div className="min-w-0 flex-1">
            <h1 className="serif text-[28px] leading-[1.1] lg:text-[32px]">{group.name}</h1>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">{group.description}</p>
            {match && <p className="mt-2 text-[13px] font-semibold text-green-ink">{match.why}</p>}
            <p className="tabular mt-3 flex flex-wrap items-center gap-x-1.5 text-[14px] text-muted">
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
        </div>
      </Panel>

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
              <span className="tabular text-[14px] text-muted">{posts.length} posts</span>
            </div>
            {!joined && !archived && (
              <Panel className="flex flex-wrap items-center gap-3 px-5 py-4">
                <p className="flex-1 text-[14px] text-ink-soft">Join this group to post, comment and vote.</p>
                <Button size="sm" onClick={join}>
                  Join
                </Button>
              </Panel>
            )}
            {posts.length === 0 ? (
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
            <Panel className="p-5">
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
          </aside>
        </div>
      )}
    </>
  );
}
