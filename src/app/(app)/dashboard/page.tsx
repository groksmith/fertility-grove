"use client";

/* Your dashboard. The question: what's mine here, and how is it going? It
   holds everything that was the profile (the tree, Sunlight history, "How
   others see me", editing per PRD §6) and gathers what you've made and joined
   into tabs: an overview with your latest activity, then all your posts, your
   replies, your groups and what you've saved. Followers, mentoring and your
   partner sit beside every tab. The tab lives in the URL (?tab=posts), so a
   link can open straight onto one. */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, MessageSquare, PenLine, X } from "lucide-react";
import { GroupCover } from "@/components/art/Brand";
import { Spot } from "@/components/art/Scenes";
import { TreeArt } from "@/components/art/Tree";
import { PostCard } from "@/components/PostCard";
import {
  Avatar,
  AvatarPicker,
  BadgeChip,
  Button,
  Choices,
  Counter,
  Dialog,
  EmptyState,
  Field,
  HueSwatches,
  Input,
  LinkButton,
  Name,
  Panel,
  Person,
  Select,
  Tabs,
  Textarea,
  TypeChip,
  toast,
} from "@/components/ui";
import { ReferFriend } from "@/components/ReferFriend";
import { requestLeave, useUnsavedGuard } from "@/components/UnsavedGuard";
import { act, sel, useStore, type State } from "@/lib/store";
import { PRONOUNS } from "@/lib/options";
import { MSG, checks } from "@/lib/rules/validation";
import { LEVELS, levelIndex, nextLevel, progress } from "@/lib/rules/sunlight";
import type { Hue, MentorRequestStatus, Post } from "@/lib/types";

const TABS = ["overview", "posts", "replies", "groups", "saved"] as const;
type Tab = (typeof TABS)[number];

const ago = (minutes: number) => (minutes < 1 ? "just now" : `${sel.timeAgo(minutes)} ago`);

/** Everything of yours the tabs show, worked out once per render. What a
    moderator removed stays listed for you alone (PRD §6); what you deleted
    doesn't. */
function mine(s: State) {
  const posts = s.posts
    .filter((p) => p.authorId === "me" && p.status !== "deleted")
    .sort((a, b) => a.minutesAgo - b.minutesAgo);
  const replies = s.comments
    .filter((c) => c.authorId === "me" && c.status !== "deleted")
    .sort((a, b) => a.minutesAgo - b.minutesAgo);
  const stories = s.stories.filter((x) => x.authorId === "me");
  const groups = s.groups.filter((g) => s.joined.includes(g.id));
  const saved = sel.savedItems(s);
  const savedCount = saved.posts.length + saved.stories.length + saved.articles.length;
  return { posts, replies, stories, groups, saved, savedCount };
}


function TreeHero() {
  const me = useStore((s) => s.me);
  const next = nextLevel(me.level);
  const pct = Math.round(progress(me.level, me.sunlight) * 100);
  return (
    <Panel className="overflow-hidden">
      <div className="grid grid-cols-1 items-end gap-0 border-b border-line bg-white sm:grid-cols-[auto_1fr]">
        <div className="flex justify-center px-6 pt-6 [&_svg]:h-auto [&_svg]:w-[150px] sm:[&_svg]:w-[220px]">
          <TreeArt level={me.level} size={220} title={`${me.level} tree`} />
        </div>
        <div className="px-6 pt-2 pb-6 sm:pt-6">
          <p className="serif text-[44px] leading-none text-ink">{me.level}</p>
          <p className="mt-1 text-[14px] text-green-ink">Your tree level</p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="tabular text-[30px] font-semibold text-ink">{me.sunlight.toLocaleString()}</span>
            <span className="text-[15px] text-ink-soft">Sunlight</span>
          </p>
          {next ? (
            <>
              <div className="mt-3 h-2.5 max-w-sm overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress to ${next.level}`}>
                <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-[14px] text-ink-soft">
                <span className="tabular">{(next.at - me.sunlight).toLocaleString()}</span> more Sunlight to {next.level}
                {next.level === "Blossom Tree" && ", when mentoring opens"}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[14px] text-ink-soft">You&apos;ve reached the top of the grove.</p>
          )}
        </div>
      </div>
      <ol className="grid grid-cols-5 gap-1 px-4 py-4 sm:px-6" aria-label="Tree levels">
        {LEVELS.map((l) => {
          const reached = levelIndex(me.level) >= levelIndex(l.level);
          return (
            <li key={l.level} className={`flex flex-col items-center text-center ${reached ? "" : "[&_img]:opacity-35 [&_img]:grayscale"}`} aria-current={l.level === me.level ? "step" : undefined}>
              <TreeArt level={l.level} size={52} />
              <span className={`mt-1 text-[12.5px] leading-tight ${l.level === me.level ? "font-semibold text-ink" : "text-muted"}`}>{l.level}</span>
              <span className="tabular text-[12px] text-muted">{l.at.toLocaleString()}</span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}

function SunlightHistory() {
  const history = useStore((s) => s.me.history);
  return (
    <Panel className="p-5 sm:p-6" id="sunlight" aria-labelledby="sun-h">
      <h2 id="sun-h" className="text-[18px] font-semibold">Sunlight history</h2>
      <p className="mt-0.5 text-[14px] text-muted">Only you can see this. You earn Sunlight when other members find you helpful.</p>
      {history.length === 0 ? (
        <p className="mt-4 text-[15px] text-muted">Nothing yet. Your first upvote or follower starts it.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {history.map((h) => (
            <li key={h.id} className="flex items-center gap-4 py-3 text-[14px]">
              <span className="min-w-0 flex-1 leading-snug">{h.label}</span>
              <span className="shrink-0 text-muted">{h.daysAgo === 0 ? "Today" : `${h.daysAgo}d ago`}</span>
              <span className={`tabular w-14 shrink-0 text-right font-semibold ${h.amount < 0 ? "text-coral-ink" : "text-green-ink"}`}>
                {h.amount > 0 ? "+" : "−"}
                {Math.abs(h.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <details className="mt-4 text-[14px] text-ink-soft">
        <summary className="cursor-pointer font-semibold text-ink">How Sunlight works</summary>
        <ul className="mt-2 space-y-1">
          <li>+1 for each upvote you receive, up to 100 a day.</li>
          <li>−1 for each downvote, never on Support needed or Just venting posts.</li>
          <li>+2 for each new follower, up to 20 a day.</li>
          <li>+10 when a friend you invited finishes onboarding.</li>
          <li>Your level never drops, even if Sunlight does.</li>
        </ul>
      </details>
    </Panel>
  );
}

function PublicPreview() {
  const s = useStore();
  const me = sel.meAsMember(s);
  return (
    <Panel className="p-5 ring-1 ring-line-strong sm:p-7">
      <p className="mb-4 rounded-[10px] bg-raised px-3 py-2 text-[13px] font-semibold text-ink">This is how other members see your profile.</p>
      <div className="flex items-start gap-4">
        <Avatar member={me} size={64} />
        <div>
          <p className="serif text-[30px] leading-tight">{sel.displayName(me)}</p>
          <p className="text-[14px] text-muted">
            {me.pronouns && <>{me.pronouns} · </>}
            {me.level} · <span className="tabular">{me.sunlight.toLocaleString()}</span> Sunlight · <span className="tabular">{me.followers}</span> followers
          </p>
          {me.badges.length > 0 && (
            <div className="mt-2 flex gap-1.5">
              {me.badges.map((b) => (
                <BadgeChip key={b} badge={b} />
              ))}
            </div>
          )}
        </div>
      </div>
      {me.aboutMe && <p className="mt-4 text-[15px] leading-relaxed">{me.aboutMe}</p>}
      {me.myStory && <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{me.myStory}</p>}
      {me.shareJourney && me.diagnoses.length > 0 ? (
        <p className="mt-3 text-[14px]">
          <span className="text-muted">Journey:</span> {[...me.diagnoses, ...me.stages].join(", ")}
        </p>
      ) : (
        <p className="mt-3 text-[13px] text-muted">Your diagnosis, stage and path are hidden. Age range, ZIP and gender are never shown.</p>
      )}
    </Panel>
  );
}

function EditProfile({ onDone }: { onDone: () => void }) {
  const me = useStore((s) => s.me);
  const [first, setFirst] = useState(me.firstName);
  const [last, setLast] = useState(me.lastName);
  const [handle, setHandle] = useState(me.handle);
  const [showReal, setShowReal] = useState(me.showRealName);
  const [hue, setHue] = useState<Hue>(me.avatarHue);
  const [avatar, setAvatar] = useState(me.avatarPreset);
  const state = useStore();
  const meMember = sel.meAsMember(state);
  const [pronouns, setPronouns] = useState(me.pronouns);
  const [pronounsSelf, setPronounsSelf] = useState(me.pronounsSelf);
  const [about, setAbout] = useState(me.aboutMe);
  const [story, setStory] = useState(me.myStory);
  const [errs, setErrs] = useState<Record<string, string | undefined>>({});

  const dirty =
    first !== me.firstName ||
    last !== me.lastName ||
    handle !== me.handle ||
    showReal !== me.showRealName ||
    hue !== me.avatarHue ||
    avatar !== me.avatarPreset ||
    pronouns !== me.pronouns ||
    pronounsSelf !== me.pronounsSelf ||
    about !== me.aboutMe ||
    story !== me.myStory;

  /** Validates and saves; false (with errors shown) if it can't yet. */
  const commit = () => {
    const v: Record<string, string | undefined> = {};
    if (!first.trim() || !last.trim()) v.names = MSG.names;
    if (about.length > 1000) v.about = "About me can be up to 1,000 characters.";
    if (pronouns === "Prefer to self-describe" && !pronounsSelf.trim()) v.pronouns = MSG.pronounsSelf;
    if (handle !== me.handle) {
      const r = act.settings.changeHandle(handle.trim());
      if (!r.ok) v.handle = r.error;
    }
    setErrs(v);
    if (Object.values(v).some(Boolean)) return false;
    act.settings.update({
      firstName: first.trim(),
      lastName: last.trim(),
      showRealName: showReal,
      avatarHue: hue,
      avatarPreset: avatar,
      pronouns,
      pronounsSelf: pronouns === "Prefer to self-describe" ? pronounsSelf.trim() : "",
      aboutMe: about.trim(),
      myStory: story.trim(),
    });
    toast("Profile saved");
    return true;
  };
  const guard = useUnsavedGuard({ dirty, onSave: commit });
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (commit()) onDone();
  };
  // Closing the editor with edits asks first, like leaving the page.
  const cancel = () => (dirty ? requestLeave(onDone) : onDone());

  return (
    <Panel className="p-5 sm:p-7">
      <form onSubmit={save} noValidate className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">Edit profile</h2>
          <button type="button" onClick={cancel} aria-label="Close editing" className="press grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-raised">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" error={errs.names}>
            <Input value={first} onChange={(e) => setFirst(e.target.value)} maxLength={50} autoComplete="given-name" />
          </Field>
          <Field label="Last name" hint="Only your last initial is ever shown.">
            <Input value={last} onChange={(e) => setLast(e.target.value)} maxLength={50} autoComplete="family-name" />
          </Field>
        </div>
        <Field
          label="Handle"
          error={errs.handle ?? (handle !== me.handle ? checks.handle(handle) : undefined)}
          hint={
            me.previousHandle
              ? `You can switch back to @${me.previousHandle} within 14 days of changing it.`
              : "You can change your handle once every 30 days."
          }
        >
          <div className="flex items-center rounded-[10px]">
            <span className="mr-2 text-[16px] text-muted">@</span>
            <Input value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase())} autoCapitalize="none" autoCorrect="off" />
          </div>
        </Field>
        <Choices
          legend="Show to other members"
          options={["Show my handle instead", "Show my real name"] as const}
          value={[showReal ? "Show my real name" : "Show my handle instead"]}
          onChange={(v) => setShowReal(v[0] === "Show my real name")}
          hint={`Real name shows as ${first || "First"} ${(last || "L").charAt(0)}.`}
        />
        <fieldset>
          <legend className="mb-2 text-[14px] font-semibold">Your grove avatar</legend>
          <AvatarPicker
            member={{ ...meMember, firstName: first, handle, showRealName: showReal, avatarHue: hue }}
            value={avatar}
            onChange={setAvatar}
            name="profile-avatar"
          />
          <HueSwatches value={hue} onChange={setHue} />
          <p className="mt-2 text-[13px] text-muted">Photo uploads aren&apos;t wired up in this prototype.</p>
        </fieldset>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Pronouns" optional error={errs.pronouns}>
            <Select value={pronouns} onChange={(e) => setPronouns(e.target.value)}>
              <option value="">Not set</option>
              {PRONOUNS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          {pronouns === "Prefer to self-describe" && (
            <Field label="Your pronouns">
              <Input value={pronounsSelf} onChange={(e) => setPronounsSelf(e.target.value)} maxLength={30} />
            </Field>
          )}
        </div>
        <Field label="About me" optional error={errs.about} counter={<Counter value={about} max={1000} />}>
          <Textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={4} placeholder="What brought you here, where you are, what you're hoping to find" />
        </Field>
        <Field label="My story" optional counter={<Counter value={story} max={2000} />} hint="The longer version, if you'd like to share it.">
          <Textarea value={story} onChange={(e) => setStory(e.target.value)} rows={6} max={2000} hardStop />
        </Field>
        <div className="flex gap-2">
          <Button type="submit">Save profile</Button>
          <Button variant="ghost" onClick={cancel}>
            Cancel
          </Button>
        </div>
      </form>
      {guard.ui}
    </Panel>
  );
}

function PartnerCard() {
  const s = useStore();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const p = s.partner;
  const inv = p.invite;

  return (
    <Panel className="p-5" aria-labelledby="partner-h">
      <Spot kind="seeds" size={120} />
      <h2 id="partner-h" className="mt-1 text-[16px] font-semibold">Your partner</h2>
      {p.linked ? (
        <>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
            You&apos;re linked with {p.firstName}. You share a family space; your posts and handles stay private from each other.
          </p>
          <LinkButton href="/family" variant="secondary" size="sm" className="mt-3">
            Open family space
          </LinkButton>
        </>
      ) : inv && inv.status === "pending" ? (
        <>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
            Invite sent to <strong className="text-ink">{inv.email}</strong>. It expires in 14 days.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => { const r = act.partner.resend(); toast(r.ok ? "Invite sent again" : r.error); }}>
              Resend
            </Button>
            <Button size="sm" variant="ghost" onClick={() => act.partner.cancel()}>
              Cancel invite
            </Button>
          </div>
          <button type="button" onClick={() => act.partner.demoAccept()} className="mt-3 text-[13px] font-semibold text-accent underline">
            Demo: your partner accepts
          </button>
        </>
      ) : (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const r = act.partner.invite(email, note);
            if (!r.ok) setError(r.error);
            else {
              setError(undefined);
              toast("Invite sent");
            }
          }}
        >
          <p className="text-[14px] leading-relaxed text-ink-soft">Invite your partner to their own private account and a family space you share.</p>
          <Field label="Partner's email" error={error}>
            <Input type="email" inputMode="email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Personal note" optional counter={<Counter value={note} max={300} />} hint="Shown on the invite page only, never in the email.">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} max={300} hardStop className="min-h-16" />
          </Field>
          <Button type="submit" size="sm">
            Send invite
          </Button>
        </form>
      )}
    </Panel>
  );
}

function Connections() {
  const s = useStore();
  const [tab, setTab] = useState<"followers" | "following">("followers");
  const ids = tab === "followers" ? s.followers : s.following;
  const people = ids.map((id) => s.members.find((m) => m.id === id)).filter(Boolean);
  return (
    <Panel className="p-5" aria-labelledby="conn-h">
      <h2 id="conn-h" className="sr-only">
        Followers and following
      </h2>
      <Tabs
        label="Connections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "followers", label: `Followers ${s.followers.length}` },
          { id: "following", label: `Following ${s.following.length}` },
        ]}
      />
      <p className="mt-3 text-[13px] text-muted">Only you can see these lists. Others see the counts.</p>
      {people.length === 0 ? (
        <p className="mt-3 text-[14px] text-muted">{tab === "followers" ? "No followers yet." : "You're not following anyone yet."}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {people.map((m) =>
            m ? (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <Avatar member={m} size={32} />
                <div className="min-w-0 flex-1 text-[14px]">
                  <Name member={m} badges={false} pronouns={false} />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => (tab === "followers" ? act.social.removeFollower(m.id) : act.social.toggleFollow(m.id))}
                >
                  {tab === "followers" ? "Remove" : "Unfollow"}
                </Button>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </Panel>
  );
}

/** Your latest posts and replies, newest first, with a way into each full list. */
function RecentActivity({ onOpen }: { onOpen: (t: Tab) => void }) {
  const s = useStore();
  const { posts: allPosts, replies: allReplies } = mine(s);
  const posts = allPosts.filter((p) => p.status !== "removed");
  const replies = allReplies.filter((c) => c.status !== "removed");
  const items = [
    ...posts.map((p) => ({ kind: "post" as const, id: p.id, minutesAgo: p.minutesAgo, post: p })),
    ...replies.map((c) => ({ kind: "reply" as const, id: c.id, minutesAgo: c.minutesAgo, comment: c, post: s.posts.find((p) => p.id === c.postId) })),
  ]
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
    .slice(0, 4);
  const groupName = (id?: string) => s.groups.find((g) => g.id === id)?.name;

  return (
    <Panel className="p-5 sm:p-6" aria-labelledby="activity-h">
      <h2 id="activity-h" className="text-[18px] font-semibold">Recent activity</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-[15px] text-muted">
          Nothing yet. Your posts and replies will collect here.{" "}
          <Link href="/posts/new" className="font-semibold text-accent underline underline-offset-2">
            Write a post
          </Link>
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {items.map((it) => (
            <li key={it.id} className="flex items-start gap-3 py-3.5">
              <span aria-hidden className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-raised text-ink-soft">
                {it.kind === "post" ? <PenLine size={15} /> : <MessageSquare size={15} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-muted">
                  {it.kind === "post" ? "You posted" : "You replied"}
                  {groupName(it.post?.groupId) && <> in {groupName(it.post?.groupId)}</>} · {ago(it.minutesAgo)}
                </p>
                {it.post && (
                  <Link href={`/posts/${it.post.id}${it.kind === "reply" ? "#comments" : ""}`} className="mt-0.5 block text-[15px] leading-snug font-semibold text-ink hover:underline">
                    {it.post.title}
                  </Link>
                )}
                {it.kind === "reply" && <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-ink-soft">{it.comment.body}</p>}
                {it.kind === "post" && (
                  <p className="tabular mt-1 text-[13px] text-muted">
                    {sel.plural(sel.score(it.post), "vote")} · {sel.plural(sel.commentCount(s, it.post.id), "reply", "replies")}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {(posts.length > 0 || replies.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-[14px]">
          <button type="button" onClick={() => onOpen("posts")} className="press font-semibold text-accent underline underline-offset-2">
            All your posts
          </button>
          <button type="button" onClick={() => onOpen("replies")} className="press font-semibold text-accent underline underline-offset-2">
            All your replies
          </button>
        </div>
      )}
    </Panel>
  );
}

/** "Removed by a moderator", with Appeal (PRD §19) and Delete. One appeal per
    decision. TODO(api): no posts or appeals API yet; this edits the mock. */
function Removed({ what, appealed, onAppeal, onDelete }: { what: "post" | "reply"; appealed?: boolean; onAppeal: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [why, setWhy] = useState("");
  const [err, setErr] = useState<string>();
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line pt-4">
      <p className="min-w-0 flex-1 basis-[220px] text-[13px] font-semibold text-coral-ink">
        Removed by a moderator · Only you can see this
        {appealed && <span className="block font-normal text-muted">Appeal sent. We&apos;ll tell you the decision here and by email.</span>}
      </p>
      <div className="flex gap-2">
        {!appealed && (
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            Appeal
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onDelete}>
          Delete
        </Button>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Appeal the removal of your ${what}`} description="A person on our team will look at it again.">
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!why.trim()) return setErr("Tell us why this should be reviewed again.");
            onAppeal();
            setOpen(false);
            toast("Appeal sent");
          }}
        >
          <Field label="Why this should be reviewed again" error={err} counter={<Counter value={why} max={500} />}>
            <Textarea value={why} onChange={(e) => setWhy(e.target.value)} max={500} hardStop rows={4} />
          </Field>
          <p className="text-[13px] text-muted">One appeal per decision, within 14 days.</p>
          <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
            <Button type="submit">Send appeal</Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function RemovedPost({ post }: { post: Post }) {
  const s = useStore();
  const group = s.groups.find((g) => g.id === post.groupId);
  return (
    <Panel as="article" className="p-5 sm:p-6">
      <p className="text-[13px] text-muted">
        {group ? <>{group.name} · </> : null}
        {ago(post.minutesAgo)}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <TypeChip type={post.type} />
      </div>
      <h2 className="mt-2 text-[18px] leading-snug font-semibold text-ink">{post.title}</h2>
      <p className="mt-1.5 line-clamp-3 text-[15px] leading-relaxed text-ink-soft">{post.body}</p>
      <Removed
        what="post"
        appealed={post.appealed}
        onAppeal={() => act.posts.appeal(post.id)}
        onDelete={() => {
          act.posts.remove(post.id);
          toast("Post deleted");
        }}
      />
    </Panel>
  );
}

function PostsTab() {
  const s = useStore();
  const { posts, stories } = mine(s);
  if (posts.length === 0 && stories.length === 0) {
    return (
      <EmptyState
        art="sprout"
        title="You haven't posted yet."
        body="Ask a question or share where you are. Your posts collect here."
        action={<LinkButton href="/posts/new">Write a post</LinkButton>}
      />
    );
  }
  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.id}>{p.status === "removed" ? <RemovedPost post={p} /> : <PostCard post={p} />}</li>
        ))}
      </ul>
      {stories.length > 0 && (
        <Panel className="p-5 sm:p-6" aria-labelledby="my-stories-h">
          <h2 id="my-stories-h" className="text-[16px] font-semibold">Your stories</h2>
          <ul className="mt-2 divide-y divide-line">
            {stories.map((st) => (
              <li key={st.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                <TypeChip type={st.type} />
                <Link href="/stories" className="min-w-0 flex-1 text-[15px] font-semibold text-ink hover:underline">
                  {st.title}
                </Link>
                <span className="text-[13px] text-muted">{ago(st.minutesAgo)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function RepliesTab() {
  const s = useStore();
  const { replies } = mine(s);
  if (replies.length === 0) {
    return <EmptyState art="birds" title="No replies yet." body="Replies you leave on other members' posts collect here." action={<LinkButton href="/feed" variant="secondary">Go to your feed</LinkButton>} />;
  }
  return (
    <ul className="space-y-3">
      {replies.map((c) => {
        const post = s.posts.find((p) => p.id === c.postId);
        const group = s.groups.find((g) => g.id === post?.groupId);
        return (
          <li key={c.id}>
            <Panel className="p-5">
              <p className="text-[13px] text-muted">
                {group ? <>{group.name} · </> : null}
                {ago(c.minutesAgo)}
                {c.status === "held" && <> · Only you can see this for now</>}
              </p>
              {post && (
                <Link href={`/posts/${post.id}#comments`} className="mt-0.5 block text-[15px] leading-snug font-semibold text-ink hover:underline">
                  On “{post.title}”
                </Link>
              )}
              <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-ink-soft">{c.body}</p>
              {c.status === "removed" ? (
                <Removed
                  what="reply"
                  appealed={c.appealed}
                  onAppeal={() => act.posts.appealComment(c.id)}
                  onDelete={() => {
                    act.posts.removeComment(c.id);
                    toast("Reply deleted");
                  }}
                />
              ) : (
                <p className="tabular mt-3 text-[13px] text-muted">{sel.plural(sel.score(c), "vote")}</p>
              )}
            </Panel>
          </li>
        );
      })}
    </ul>
  );
}

function GroupsTab() {
  const s = useStore();
  const { groups, posts } = mine(s);
  if (groups.length === 0) {
    return <EmptyState art="canopy" title="You haven't joined a group yet." body="Groups are where posts live. Join one that matches where you are." action={<LinkButton href="/groups">Browse groups</LinkButton>} />;
  }
  return (
    <div className="space-y-4">
      <Panel>
        <ul className="divide-y divide-line">
        {groups.map((g) => {
          const yours = posts.filter((p) => p.groupId === g.id).length;
          const muted = s.muted.includes(g.id);
          return (
            <li key={g.id} className="flex items-center gap-4 p-4 sm:px-5">
              <GroupCover group={g} size={52} />
              <div className="min-w-0 flex-1">
                <Link href={`/groups/${g.id}`} className="block truncate text-[15px] font-semibold text-ink hover:underline">
                  {g.name}
                </Link>
                <p className="tabular truncate text-[13px] text-muted">
                  {sel.plural(g.members, "member")} · {sel.plural(g.postsThisWeek, "post")} this week
                  {yours > 0 && <> · {sel.plural(yours, "post")} from you</>}
                  {muted && <> · Muted</>}
                </p>
              </div>
              <LinkButton href={`/posts/new?group=${g.id}`} variant="ghost" size="sm" aria-label={`Write a post in ${g.name}`}>
                <PenLine size={15} /> <span className="hidden sm:inline">Post</span>
              </LinkButton>
            </li>
          );
        })}
        </ul>
      </Panel>
      <LinkButton href="/groups" variant="secondary">
        Find more groups
      </LinkButton>
    </div>
  );
}

function SavedTab() {
  const s = useStore();
  const { saved, savedCount } = mine(s);
  if (savedCount === 0) {
    return <EmptyState art="bookmark" title="Nothing saved yet." body="Save posts, stories and articles to find them again before your next appointment." />;
  }
  const rows: { key: string; kind: string; title: string; href: string; meta?: string }[] = [
    ...saved.posts.map((p) => ({ key: p.id, kind: "Post", title: p.title, href: `/posts/${p.id}`, meta: s.groups.find((g) => g.id === p.groupId)?.name })),
    ...saved.stories.map((st) => ({ key: st.id, kind: "Story", title: st.title, href: "/stories", meta: st.type })),
    ...saved.articles.map((a) => ({ key: a!.slug, kind: "Article", title: a!.title, href: `/learn/${a!.slug}`, meta: "Learn library" })),
  ];
  return (
    <div className="space-y-4">
      <Panel>
        <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-4 p-4 sm:px-5">
            <span className="w-16 shrink-0 text-[13px] font-semibold text-muted">{r.kind}</span>
            <div className="min-w-0 flex-1">
              <Link href={r.href} className="block text-[15px] leading-snug font-semibold text-ink hover:underline">
                {r.title}
              </Link>
              {r.meta && <p className="truncate text-[13px] text-muted">{r.meta}</p>}
            </div>
          </li>
        ))}
        </ul>
      </Panel>
      <LinkButton href="/saved" variant="secondary">
        Manage saved
      </LinkButton>
    </div>
  );
}

/* The card's order (PRD §6): open ones first, waiting then connected, then the
   finished ones, each group newest first. "Not available right now" means the
   mentor declined. */
const MENTOR_ORDER: Record<MentorRequestStatus, number> = { waiting: 0, accepted: 1, declined: 2, expired: 2, ended: 2 };

const MENTOR_STATUS: Record<MentorRequestStatus, string> = {
  waiting: "Waiting for a reply",
  accepted: "Connected",
  declined: "Not available right now",
  expired: "Request expired",
  ended: "Mentoring ended",
};

/** Your mentors, and the members you mentor. Hidden until there is one. */
function MentoringCard() {
  const s = useStore();
  // TODO(api): no mentoring API yet; this orders the mock requests.
  const rows = s.mentorRequests
    .filter((r) => r.menteeId === "me" || r.mentorId === "me")
    .sort((a, b) => MENTOR_ORDER[a.status] - MENTOR_ORDER[b.status] || a.daysAgo - b.daysAgo)
    .map((r) => {
      const asMentee = r.menteeId === "me";
      const other = sel.person(s, asMentee ? r.mentorId : r.menteeId);
      return other ? { id: r.id, other, role: asMentee ? "Your mentor" : "You mentor them", status: MENTOR_STATUS[r.status] } : null;
    })
    .filter(Boolean)
    .slice(0, 4);
  if (!rows.length) return null;
  return (
    <Panel className="p-5" aria-labelledby="mentoring-h">
      <h2 id="mentoring-h" className="text-[16px] font-semibold">Mentoring</h2>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r!.id}>
            <Person member={r!.other} size={36} sub={`${r!.role} · ${r!.status}`} />
          </li>
        ))}
      </ul>
      <Link href="/mentors" className="mt-3 inline-block text-[14px] font-semibold text-accent hover:underline">
        Open mentors
      </Link>
    </Panel>
  );
}

function Dashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const s = useStore();
  const me = sel.meAsMember(s);
  const editing = params.get("edit") === "1";
  const asked = params.get("tab") as Tab | null;
  const tab: Tab = !editing && asked && TABS.includes(asked) ? asked : "overview";
  const [preview, setPreview] = useState(false);
  const consent = s.me.healthConsent;
  const counts = mine(s);

  const open = (t: Tab) => {
    setPreview(false);
    router.replace(t === "overview" ? "/dashboard" : `/dashboard?tab=${t}`, { scroll: false });
  };
  const togglePreview = () => {
    if (tab !== "overview") open("overview");
    setPreview((v) => !v);
  };

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar member={me} size={64} />
          <div className="min-w-0">
            <h1 className="serif text-[28px] leading-[1.1] text-ink lg:text-[32px]">Dashboard</h1>
            <p className="mt-1.5 text-[15px] text-ink-soft [overflow-wrap:anywhere]">
              <span className="font-semibold text-ink">{sel.displayName(me)}</span>
              <span className="text-muted">
                {" "}
                · {s.me.showRealName ? `@${s.me.handle}` : `${s.me.firstName} ${s.me.lastName.charAt(0)}. (only you see your name)`}
                {me.pronouns && <> · {me.pronouns}</>}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" aria-pressed={preview} onClick={togglePreview}>
            <Eye size={16} /> {preview ? "Back to my view" : "How others see me"}
          </Button>
          {!editing && (
            <Button onClick={() => router.push("/dashboard?edit=1")}>
              <PenLine size={16} /> Edit profile
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Tabs
            label="Dashboard"
            value={tab}
            onChange={open}
            tabs={[
              { id: "overview", label: "Overview" },
              { id: "posts", label: `Posts ${counts.posts.length + counts.stories.length}` },
              { id: "replies", label: `Replies ${counts.replies.length}` },
              { id: "groups", label: `Groups ${counts.groups.length}` },
              { id: "saved", label: `Saved ${counts.savedCount}` },
            ]}
          />
          {tab === "posts" && <PostsTab />}
          {tab === "replies" && <RepliesTab />}
          {tab === "groups" && <GroupsTab />}
          {tab === "saved" && <SavedTab />}
          {tab === "overview" && (
            <Overview editing={editing} preview={preview} consent={consent} onOpen={open} onDoneEditing={() => router.push("/dashboard")} />
          )}
        </div>
        <aside className="space-y-4" aria-label="Your people">
          <Connections />
          <MentoringCard />
          <PartnerCard />
        </aside>
      </div>
    </>
  );
}

function Overview({
  editing,
  preview,
  consent,
  onOpen,
  onDoneEditing,
}: {
  editing: boolean;
  preview: boolean;
  consent: boolean;
  onOpen: (t: Tab) => void;
  onDoneEditing: () => void;
}) {
  const s = useStore();
  return (
    <>
        {editing ? <EditProfile onDone={onDoneEditing} /> : preview ? <PublicPreview /> : null}
        <TreeHero />

        {!editing && !preview && <RecentActivity onOpen={onOpen} />}

        {!editing && !preview && (
          <Panel className="space-y-5 p-5 sm:p-7">
            <section>
              <h2 className="text-[16px] font-semibold">About me</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line text-ink">
                {s.me.aboutMe || <span className="text-muted">Nothing yet. A line about you helps people on your path find you.</span>}
              </p>
            </section>
            <section>
              <h2 className="text-[16px] font-semibold">My story</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line text-ink">
                {s.me.myStory || <span className="text-muted">Share the longer version whenever you&apos;re ready.</span>}
              </p>
            </section>
            <section>
              <h2 className="text-[16px] font-semibold">Your journey</h2>
              {consent ? (
                <dl className="mt-2 grid grid-cols-1 gap-3 text-[14px] sm:grid-cols-3">
                  {[
                    ["Diagnosis", s.me.diagnoses],
                    ["Stage", s.me.stages],
                    ["Path", s.me.paths],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-semibold">{(v as string[]).join(", ") || "—"}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-1.5 text-[14px] text-muted">
                  Not shared.{" "}
                  <Link href="/settings#privacy" className="font-semibold text-accent underline">
                    Give consent again
                  </Link>{" "}
                  to use your health answers for matching.
                </p>
              )}
              <p className="mt-2 text-[13px] text-muted">
                {s.me.shareJourney ? "Shown on your profile." : "Only you can see this."}{" "}
                <Link href="/settings#privacy" className="underline">
                  Change
                </Link>
              </p>
            </section>
          </Panel>
        )}

        {!editing && !preview && (
          <Panel className="p-5 sm:p-6">
            <ReferFriend />
          </Panel>
        )}
        <SunlightHistory />
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}
