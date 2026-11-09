"use client";

/* Home. The screen's question: who replied, or who needs a reply from me?
   The finding sits under the title; the feed takes two thirds, and the right
   third is your tree, people on your path and groups matched to you. */

import Link from "next/link";
import { useState } from "react";
import { PenLine, SlidersHorizontal, X } from "lucide-react";
import { GroupCover } from "@/components/art/Brand";
import { TreeArt } from "@/components/art/Tree";
import { PostCard } from "@/components/PostCard";
import {
  AvatarPicker,
  Button,
  ChipSelect,
  Dialog,
  EmptyState,
  LinkButton,
  Panel,
  Person,
  Segmented,
  Tabs,
  toast,
} from "@/components/ui";
import { act, sel, useStore, type State } from "@/lib/store";
import { POST_TYPES } from "@/lib/options";
import { nextLevel, progress } from "@/lib/rules/sunlight";

type Sort = "newest" | "top" | "discussed";

function finding(s: State) {
  const replies = s.notifications.filter((n) => !n.read && n.kind === "reply").length;
  const dms = s.conversations.filter((c) => c.unread && !c.request).length;
  const requests = s.conversations.filter((c) => c.request === "incoming").length;
  const parts = [
    replies && `${replies} new ${replies === 1 ? "reply" : "replies"} on your posts`,
    dms && `${dms} unread ${dms === 1 ? "message" : "messages"}`,
    requests && `${requests} message ${requests === 1 ? "request" : "requests"} waiting`,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "You're all caught up.";
}

function TreeCard() {
  const me = useStore((s) => s.me);
  const next = nextLevel(me.level);
  const pct = Math.round(progress(me.level, me.sunlight) * 100);
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-end gap-4 border-b border-line bg-white px-5 pt-4">
        <TreeArt level={me.level} size={112} title={me.level} />
        <div className="pb-4">
          <p className="text-[13px] text-green-ink">Your tree</p>
          <p className="serif text-[28px] leading-none text-ink">{me.level}</p>
        </div>
      </div>
      <div className="p-5">
        <p className="flex items-baseline justify-between text-[14px]">
          <span className="tabular text-[24px] font-semibold text-ink">{me.sunlight.toLocaleString()}</span>
          <span className="text-muted">Sunlight</span>
        </p>
        {next ? (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress to ${next.level}`}>
              <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-[13px] text-muted">
              <span className="tabular">{(next.at - me.sunlight).toLocaleString()}</span> more to {next.level}
              {next.level === "Blossom Tree" && ", when mentoring opens"}
            </p>
          </>
        ) : (
          <p className="mt-2 text-[13px] text-muted">The top of the grove.</p>
        )}
        <Link href="/profile#sunlight" className="mt-3 inline-block text-[14px] font-semibold text-accent hover:underline">
          How you earned it
        </Link>
      </div>
    </Panel>
  );
}

function PeopleLikeYou() {
  const s = useStore();
  const people = sel.peopleMatches(s, 4);
  return (
    <Panel className="p-5" id="people" aria-labelledby="people-h">
      <h2 id="people-h" className="text-[16px] font-semibold">People on your path</h2>
      {people.length === 0 ? (
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          We&apos;re still finding people on your path. Check back soon.{" "}
          <Link href="/groups" className="font-semibold text-accent">Popular groups</Link>
        </p>
      ) : (
        <ul className="mt-3 space-y-4">
          {people.map(({ member, why }) => (
            <li key={member.id}>
              <Person member={member} sub={why} size={36} />
              <div className="mt-2 flex gap-2 pl-12">
                <Button size="sm" variant="secondary" onClick={() => { act.social.toggleFollow(member.id); toast(`Following ${sel.displayName(member)}`); }}>
                  Follow
                </Button>
                <LinkButton size="sm" variant="ghost" href={`/u/${member.handle}`}>
                  View
                </LinkButton>
                <button type="button" onClick={() => act.social.notForMe(member.id)} className="ml-auto text-[13px] text-muted hover:text-ink">
                  Not for me
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function GroupsForYou({ limit = 3 }: { limit?: number }) {
  const s = useStore();
  const matches = sel.groupMatches(s, 5).filter((m) => !s.joined.includes(m.group.id)).slice(0, limit);
  if (!matches.length) return null;
  return (
    <Panel className="p-5" aria-labelledby="gfy-h">
      <h2 id="gfy-h" className="text-[16px] font-semibold">Groups for you</h2>
      <ul className="mt-3 space-y-3">
        {matches.map(({ group, why }) => (
          <li key={group.id} className="flex items-center gap-3">
            <GroupCover group={group} size={40} />
            <div className="min-w-0 flex-1">
              <Link href={`/groups/${group.id}`} className="block truncate text-[14px] font-semibold hover:underline">
                {group.name}
              </Link>
              <p className="truncate text-[12.5px] text-muted">{why}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => { act.groups.toggleJoin(group.id); toast(`Joined ${group.name}`); }}>
              Join
            </Button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ProfileCard() {
  const s = useStore();
  const gaps = sel.profileGaps(s);
  if (s.me.profileCardDismissed || gaps.length === 0) return null;
  // No avatar yet: offer the first six right here, one tap to wear one.
  const needsAvatar = gaps.some((g) => g.key === "photo");
  return (
    <Panel className="flex flex-wrap items-center gap-4 p-5">
      <div className="min-w-0 flex-1">
        <h2 className="text-[16px] font-semibold">Complete your profile</h2>
        <p className="mt-0.5 text-[14px] text-muted">A fuller profile helps the right people find you.</p>
        {needsAvatar && (
          <fieldset className="mt-4">
            <legend className="mb-2 text-[14px] font-semibold text-ink">Pick a grove avatar</legend>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <AvatarPicker
                member={sel.meAsMember(s)}
                value={-1}
                count={6}
                size={44}
                name="home-avatar"
                onChange={(i) => {
                  act.settings.update({ avatarPreset: i });
                  toast("Avatar saved. Change it any time on your profile.");
                }}
              />
              <Link href="/profile?edit=1" className="text-[14px] font-semibold text-accent underline underline-offset-2">
                See all 12
              </Link>
            </div>
          </fieldset>
        )}
        {gaps.some((g) => g.key !== "photo") && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {gaps.filter((g) => g.key !== "photo").map((g) => (
              <li key={g.key}>
                <Link href={g.href} className="press inline-flex h-9 items-center rounded-full border border-line-strong bg-white px-3.5 text-[14px] font-semibold text-ink hover:border-ink">
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="button" aria-label="Hide for 30 days" title="Hide for 30 days" onClick={() => act.settings.dismissProfileCard()} className="press grid h-10 w-10 place-items-center self-start rounded-full text-muted hover:bg-raised">
        <X size={18} />
      </button>
    </Panel>
  );
}

export default function HomePage() {
  const s = useStore();
  const [tab, setTab] = useState<"for-you" | "following">("for-you");
  const [sort, setSort] = useState<Sort>("newest");
  const [groups, setGroups] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [filters, setFilters] = useState(false);

  const items = sel.feed(s, { tab, sort, groups, types });
  const joinedGroups = s.groups.filter((g) => s.joined.includes(g.id));
  const filterCount = groups.length + types.length;

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
        <div className="min-w-0">
          <h1 className="serif text-[28px] leading-[1.1] lg:text-[32px]">{s.me.firstName ? `${s.me.firstName}'s grove` : "Your grove"}</h1>
          <p className="mt-2 text-[15px] text-ink-soft">{finding(s)}</p>
        </div>
        <LinkButton href="/posts/new">
          <PenLine size={17} /> Write a post
        </LinkButton>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <ProfileCard />
          <Tabs
            label="Feed"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "for-you", label: "For you" },
              { id: "following", label: "Following" },
            ]}
          />
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
            <Button variant="ghost" size="sm" onClick={() => setFilters(true)}>
              <SlidersHorizontal size={16} /> Filter{filterCount ? ` · ${filterCount}` : ""}
            </Button>
          </div>

          {items.length === 0 ? (
            tab === "following" ? (
              <EmptyState art="birds" title="Follow people to see their new posts here." action={<LinkButton href="#people" variant="secondary">People on your path</LinkButton>} />
            ) : s.joined.length === 0 ? (
              <div className="space-y-4">
                <EmptyState art="canopy" title="Your feed fills up as you join groups." body="Here are groups matched to where you are." />
                <GroupsForYou limit={5} />
              </div>
            ) : (
              <EmptyState art="sun" title="You're all caught up." action={<LinkButton href="/posts/new">Write a post</LinkButton>} />
            )
          ) : (
            <ul className="space-y-4">
              {items.map(({ post, matched }) => (
                <li key={post.id}>
                  <PostCard post={post} matched={matched} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-4" aria-label="Your grove at a glance">
          <TreeCard />
          <PeopleLikeYou />
          {s.joined.length > 0 && <GroupsForYou />}
        </aside>
      </div>

      <Dialog open={filters} onClose={() => setFilters(false)} title="Filter your feed">
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-[14px] font-semibold">Groups</h3>
            {joinedGroups.length ? (
              <ChipSelect label="Groups" options={joinedGroups.map((g) => g.id)} value={groups} onChange={setGroups} labelOf={(id) => s.groups.find((g) => g.id === id)?.name ?? id} />
            ) : (
              <p className="text-[14px] text-muted">Join a group to filter by it.</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-[14px] font-semibold">Post type</h3>
            <ChipSelect label="Post type" options={POST_TYPES} value={types} onChange={setTypes} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setFilters(false)}>Show posts</Button>
            <Button variant="ghost" onClick={() => { setGroups([]); setTypes([]); }}>
              Clear
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
