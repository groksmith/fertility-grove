"use client";

/* A post and its conversation (PRD §9, §10). Comments sort Top by default,
   replies go one level deep, and a reply to a reply attaches to the same
   comment and mentions the person replied to. */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PostVisibility } from "@/components/PostVisibility";
import { useUnsavedGuard } from "@/components/UnsavedGuard";
import { ArrowLeft, BadgeCheck, Bookmark, MoreHorizontal, Reply } from "lucide-react";
import { GroupCover } from "@/components/art/Brand";
import { ReportDialog, useResult } from "@/components/Safety";
import {
  Avatar,
  Button,
  Counter,
  EmptyState,
  Field,
  Input,
  LinkButton,
  Menu,
  Name,
  Panel,
  Segmented,
  Select,
  SourceLabel,
  TagChip,
  Textarea,
  TypeChip,
  VoteControl,
  toast,
  useCopy,
} from "@/components/ui";
import { act, sel, useStore } from "@/lib/store";
import { SOURCES } from "@/lib/options";
import type { Comment, Group, Post, Source } from "@/lib/types";

function CommentComposer({
  post,
  parent,
  mention,
  onDone,
  autoFocus,
}: {
  post: Post;
  parent?: string;
  mention?: string;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const [body, setBody] = useState("");
  const [source, setSource] = useState<Source | "">("");
  const [error, setError] = useState<string>();
  const { handle, ui } = useResult();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return setError("Write something before replying.");
        if (body.length > 2000) return setError("Comments can be up to 2,000 characters.");
        const r = act.posts.comment(post.id, body, { parentId: parent, mention, source: source || undefined });
        if (handle(r, "Reply posted")) {
          setBody("");
          setSource("");
          setError(undefined);
          onDone?.();
        }
      }}
      className="space-y-3"
    >
      <Field
        label={mention ? `Reply to @${mention}` : "Add a comment"}
        error={error}
        counter={<Counter value={body} max={2000} />}
        hint={post.type === "Support needed" ? "They asked for support, not advice. A kind word goes a long way." : post.type === "Just venting" ? "They're not asking for advice. Let them know they're heard." : undefined}
      >
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} autoFocus={autoFocus} className="min-h-20" />
      </Field>
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 sm:max-w-64">
          <span className="mb-1.5 block text-[13px] text-muted">Source (optional)</span>
          <Select value={source} onChange={(e) => setSource(e.target.value as Source)} className="h-10 text-[14px]">
            <option value="">No source</option>
            {SOURCES.filter((x) => x !== "Clinician input").map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        </label>
        <Button type="submit">{parent ? "Reply" : "Comment"}</Button>
        {onDone && (
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
      {ui}
    </form>
  );
}

function CommentItem({ c, post, canTakePart, reply }: { c: Comment; post: Post; canTakePart: boolean; reply?: boolean }) {
  const s = useStore();
  const author = sel.person(s, c.authorId);
  const [replying, setReplying] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.body);
  const [report, setReport] = useState(false);
  const { handle, ui } = useResult();
  if (!author) return null;
  const mine = c.authorId === "me";

  if (c.status === "deleted") {
    return <p className="py-3 text-[14px] text-muted">This comment was deleted.</p>;
  }

  return (
    <div className={`flex gap-3 py-4 ${c.minutesAgo === 0 ? "rise" : ""}`}>
      <Avatar member={author} size={reply ? 30 : 36} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
          <Name member={author} pronouns={false} />
          <span className="text-muted">· {sel.timeAgo(c.minutesAgo)}</span>
          {c.edited && <span className="text-muted">· Edited</span>}
        </div>
        {sel.collapsed(c) && !reveal ? (
          <p className="mt-2 text-[14px] text-muted">
            Hidden because members voted it down.{" "}
            <button type="button" onClick={() => setReveal(true)} className="font-semibold text-ink underline">
              Show hidden content
            </button>
          </p>
        ) : editing ? (
          <div className="mt-2 space-y-2">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} max={2000} hardStop aria-label="Edit comment" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { act.posts.editComment(c.id, draft.trim()); setEditing(false); }} disabled={!draft.trim()}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line text-ink">
            {c.mention && <span className="font-semibold text-accent">@{c.mention} </span>}
            {c.body}
          </p>
        )}
        {c.status === "held" && <p className="mt-2 text-[13px] text-[var(--yellow-700)]">Held for a moment while our team checks in. Only you can see it.</p>}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <VoteControl
            compact
            up={c.up}
            down={c.down}
            my={c.myVote}
            allowDown={sel.allowsDownvote(post)}
            disabled={mine}
            onVote={(v) => handle(act.posts.voteComment(c.id, v))}
          />
          {canTakePart && (
            <Button size="sm" variant="ghost" onClick={() => setReplying((v) => !v)}>
              <Reply size={15} /> Reply
            </Button>
          )}
          {c.source && <SourceLabel source={c.source} />}
          <span className="flex-1" />
          <Menu
            label="Comment options"
            trigger={(p) => (
              <button {...p} type="button" aria-label="Comment options" className="press grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink">
                <MoreHorizontal size={18} />
              </button>
            )}
            items={
              mine
                ? [
                    { label: "Edit", onSelect: () => setEditing(true) },
                    { label: "Delete", danger: true, onSelect: () => act.posts.removeComment(c.id) },
                  ]
                : [
                    { label: "Report comment", onSelect: () => setReport(true) },
                    { label: `Block ${sel.displayName(author)}`, danger: true, onSelect: () => { act.social.block(author.id); toast("Blocked"); } },
                  ]
            }
          />
        </div>
        {replying && (
          <div className="mt-3">
            <CommentComposer
              post={post}
              parent={c.parentId ?? c.id}
              mention={author.id === "me" ? undefined : author.handle}
              onDone={() => setReplying(false)}
              autoFocus
            />
          </div>
        )}
      </div>
      <ReportDialog open={report} onClose={() => setReport(false)} target={c.id} what="comment" authorId={author.id} />
      {ui}
    </div>
  );
}

function EditPost({ post, group, onDone }: { post: Post; group: Group; onDone: () => void }) {
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [share, setShare] = useState({ allowSharing: post.allowSharing, showToVisitors: post.showToVisitors });
  const commit = () => {
    if (!title.trim() || !body.trim()) return false;
    act.posts.edit(post.id, {
      ...(title.trim() !== post.title || body.trim() !== post.body ? { title: title.trim(), body: body.trim() } : {}),
      ...share,
    });
    onDone();
    toast("Post updated");
    return true;
  };
  const dirty =
    title !== post.title || body !== post.body || share.allowSharing !== post.allowSharing || share.showToVisitors !== post.showToVisitors;
  const guard = useUnsavedGuard({ dirty, onSave: commit });
  return (
    <div className="mt-4 space-y-4">
      <Field label="Title" counter={<Counter value={title} max={150} />}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
      </Field>
      <Field label="Your post" counter={<Counter value={body} max={5000} />}>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} max={5000} hardStop />
      </Field>
      <PostVisibility group={group} type={post.type} allowSharing={share.allowSharing} showToVisitors={share.showToVisitors} onChange={setShare} />
      <div className="flex gap-2">
        <Button
          disabled={!title.trim() || !body.trim()}
          onClick={commit}
        >
          Save changes
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
      {guard.ui}
    </div>
  );
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const s = useStore();
  const [sort, setSort] = useState<"top" | "newest">("top");
  const [editing, setEditing] = useState(false);
  const [report, setReport] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [, copy] = useCopy();
  const { handle, ui } = useResult();

  const post = s.posts.find((p) => p.id === id);
  const group = post && s.groups.find((g) => g.id === post.groupId);
  const author = post && sel.person(s, post.authorId);
  const visible = post && (post.status === "published" || post.status === "deleted" || (post.status === "held" && post.authorId === "me"));

  if (!post || !group || !author || !visible || s.blocked.includes(post.authorId)) {
    return (
      <EmptyState
        art="lens"
        title="This post isn't available."
        body="It may have been deleted or removed."
        action={<LinkButton href="/feed" variant="secondary">Back to your feed</LinkButton>}
      />
    );
  }

  if (group.readAccess === "members-only" && !s.joined.includes(group.id)) {
    return (
      <EmptyState
        art="canopy"
        title="Any member can join this group and read posts."
        body={`This post is in ${group.name}, a Members-only group.`}
        action={<LinkButton href={`/groups/${group.id}`}>Go to the group</LinkButton>}
      />
    );
  }

  const joined = s.joined.includes(group.id);
  const canTakePart = joined && group.status === "active";
  const mine = post.authorId === "me";
  const threads = sel.commentsFor(s, post.id, sort);
  const total = sel.commentCount(s, post.id);
  const clinicianAnswered =
    post.type === "Question" &&
    s.comments.some((c) => c.postId === post.id && c.status === "published" && sel.person(s, c.authorId)?.badges.includes("clinician"));
  const deleted = post.status === "deleted";
  const hidden = sel.collapsed(post) && !reveal;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <button type="button" onClick={() => router.back()} className="press -ml-1 inline-flex h-11 items-center gap-1.5 rounded-full px-2 text-[15px] font-semibold text-muted hover:text-ink">
          <ArrowLeft size={16} /> Back
        </button>

        <Panel as="article" className="p-5 sm:p-7">
          {deleted ? (
            <p className="text-[15px] text-muted">This post was deleted. The conversation stays below.</p>
          ) : (
            <>
              <header className="flex items-start gap-3">
                <Avatar member={author} size={44} />
                <div className="min-w-0 flex-1 text-[14px]">
                  <Name member={author} />
                  <p className="mt-0.5 text-muted">
                    <Link href={`/groups/${group.id}`} className="hover:text-ink hover:underline">
                      {group.name}
                    </Link>{" "}
                    · {sel.timeAgo(post.minutesAgo)}
                    {post.edited && " · Edited"}
                  </p>
                </div>
                <Menu
                  label="Post options"
                  trigger={(p) => (
                    <button {...p} type="button" aria-label="Post options" className="press grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink">
                      <MoreHorizontal size={20} />
                    </button>
                  )}
                  items={[
                    { label: "Copy link", onSelect: () => { copy(`${location.origin}/posts/${post.id}`); toast("Link copied"); } },
                    { label: "Send in a message", onSelect: () => router.push(`/messages?attach=${post.id}`) },
                    post.allowSharing && { label: "Copy public link", onSelect: () => { copy(`${location.origin}/p/${post.id}`); toast("Public link copied. Comments never show outside."); } },
                    "divider",
                    ...(mine
                      ? [
                          { label: "Edit post", onSelect: () => setEditing(true) },
                          { label: "Delete post", danger: true, onSelect: () => { act.posts.remove(post.id); toast("Post deleted"); } },
                        ]
                      : [
                          { label: "Report post", onSelect: () => setReport(true) },
                          { label: `Block ${sel.displayName(author)}`, danger: true, onSelect: () => { act.social.block(author.id); router.push("/feed"); toast("Blocked"); } },
                        ]),
                  ]}
                />
              </header>

              {post.status === "held" && (
                <p className="mt-4 rounded-[10px] bg-yellow-tint px-4 py-3 text-[14px] text-[var(--yellow-700)]">
                  We&apos;ve held your post for a moment so our team can check in. You&apos;re not alone. If you&apos;re in danger now, call or text 988.
                </p>
              )}

              {editing ? (
                <EditPost post={post} group={group} onDone={() => setEditing(false)} />
              ) : hidden ? (
                <div className="mt-5 rounded-[10px] bg-raised px-4 py-3 text-[14px] text-muted">
                  Hidden because members voted it down.{" "}
                  <button type="button" onClick={() => setReveal(true)} className="font-semibold text-ink underline">
                    Show hidden content
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    <TypeChip type={post.type} />
                    {clinicianAnswered && (
                      <span className="inline-flex h-6 items-center gap-1 rounded-full bg-blue-tint px-2.5 text-[12px] font-semibold text-blue-ink">
                        <BadgeCheck size={13} /> Clinician answered
                      </span>
                    )}
                    {post.tags.map((t) => (
                      <TagChip key={t}>{t}</TagChip>
                    ))}
                  </div>
                  <h1 className="mt-3 text-[22px] leading-tight font-semibold text-ink sm:text-[26px] lg:text-[30px]">{post.title}</h1>
                  <p className="mt-3 max-w-[68ch] text-[16px] leading-relaxed whitespace-pre-line text-ink">{post.body}</p>
                </>
              )}

              <footer className="mt-6 flex flex-wrap items-center gap-2">
                <VoteControl up={post.up} down={post.down} my={post.myVote} allowDown={sel.allowsDownvote(post)} disabled={mine} onVote={(v) => handle(act.posts.vote(post.id, v))} />
                <button
                  type="button"
                  onClick={() => act.posts.toggleSave(post.id)}
                  aria-pressed={post.saved}
                  className={`press inline-flex h-9 items-center gap-1.5 rounded-full bg-raised px-3 text-[14px] font-semibold ${post.saved ? "text-accent" : "text-ink-soft hover:text-ink"}`}
                >
                  <Bookmark size={16} fill={post.saved ? "currentColor" : "none"} /> {post.saved ? "Saved" : "Save"}
                </button>
                <span className="flex-1" />
                <SourceLabel source={post.source} link={post.sourceLink} />
              </footer>
            </>
          )}
        </Panel>

        {!deleted && (post.type === "Support needed" || post.type === "Just venting") && (
          <p className="rounded-[20px] border border-pink bg-pink-tint px-5 py-3.5 text-[14px] text-ink">
            {post.type === "Support needed"
              ? "This member asked for support. Reply with kindness and your own experience, not advice."
              : "This member is venting and isn't asking for advice. Let them know they're heard."}
          </p>
        )}

        <Panel className="p-5 sm:p-7" id="comments" aria-labelledby="comments-h">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="comments-h" className="text-[18px] font-semibold">
              {post.type === "Question" ? "Answers" : "Comments"} <span className="tabular font-normal text-muted">{total}</span>
            </h2>
            <Segmented label="Sort comments" value={sort} onChange={setSort} options={[{ id: "top", label: "Top" }, { id: "newest", label: "Newest" }]} />
          </div>

          {canTakePart ? (
            <div className="mt-5 rounded-[14px] bg-ground p-4">
              <CommentComposer post={post} />
            </div>
          ) : group.status === "archived" ? (
            <p className="mt-5 rounded-[14px] bg-ground p-4 text-[14px] text-muted">This group is archived, so the conversation is read only.</p>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[14px] bg-ground p-4">
              <GroupCover group={group} size={36} />
              <p className="flex-1 text-[14px] text-ink-soft">Join {group.name} to comment and vote.</p>
              <Button size="sm" onClick={() => { act.groups.toggleJoin(group.id); toast(`Joined ${group.name}`); }}>
                Join group
              </Button>
            </div>
          )}

          {threads.length === 0 ? (
            <p className="mt-6 text-[15px] text-muted">No replies yet. Yours could be the first.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {threads.map(({ comment, replies }) => (
                <li key={comment.id}>
                  <CommentItem c={comment} post={post} canTakePart={canTakePart} />
                  {replies.length > 0 && (
                    <ul className="ml-6 border-l-2 border-line pl-4 sm:ml-12">
                      {replies.map((r) => (
                        <li key={r.id}>
                          <CommentItem c={r} post={post} canTakePart={canTakePart} reply />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <aside className="space-y-4">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <GroupCover group={group} size={48} />
            <div className="min-w-0">
              <Link href={`/groups/${group.id}`} className="font-semibold hover:underline">
                {group.name}
              </Link>
              <p className="tabular text-[13px] text-muted">{group.members.toLocaleString()} members</p>
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">{group.description}</p>
        </Panel>
        <Panel className="p-5 text-[14px] leading-relaxed text-ink-soft">
          <h2 className="text-[16px] font-semibold text-ink">About sources</h2>
          <p className="mt-1.5">Every post and comment can say where it comes from: personal experience, opinion, a doctor, or research. Clinician input comes only from verified clinicians.</p>
        </Panel>
      </aside>
      <ReportDialog open={report} onClose={() => setReport(false)} target={post.id} what="post" authorId={author.id} />
      {ui}
    </div>
  );
}
