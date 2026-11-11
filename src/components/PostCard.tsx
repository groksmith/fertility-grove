"use client";

/* A post in a list. Type chip, group, author with their tree, title, a body
   preview, source label, votes, comment count, save and the post menu. Items
   at −5 or below collapse behind "Show hidden content". */

import Link from "next/link";
import { Bookmark, MessageSquare, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { act, sel, useStore } from "@/lib/store";
import type { Post } from "@/lib/types";
import { ReportDialog, useResult } from "./Safety";
import { Avatar, Menu, Name, Panel, SourceLabel, TagChip, TypeChip, VoteControl, toast, useCopy } from "./ui";

export function PostCard({ post, matched, showGroup = true }: { post: Post; matched?: string; showGroup?: boolean }) {
  const s = useStore();
  const author = sel.person(s, post.authorId);
  const group = s.groups.find((g) => g.id === post.groupId);
  const [reveal, setReveal] = useState(false);
  const [report, setReport] = useState(false);
  const [, copy] = useCopy();
  const { handle, ui } = useResult();
  if (!author || !group) return null;

  const comments = sel.commentCount(s, post.id);
  const mine = post.authorId === "me";
  const hidden = sel.collapsed(post) && !reveal;

  if (post.status === "deleted") {
    return (
      <Panel as="article" className="px-5 py-4 text-[14px] text-muted">
        This post was deleted.{" "}
        {comments > 0 && (
          <Link href={`/posts/${post.id}`} className="font-semibold text-ink underline">
            Read the comments
          </Link>
        )}
      </Panel>
    );
  }

  return (
    <Panel as="article" className="relative p-5 sm:p-6">
      {matched && <p className="mb-3 text-[13px] font-semibold text-green-ink">{matched}</p>}
      {post.status === "held" && (
        <p className="mb-3 rounded-[10px] bg-yellow-tint px-3 py-2 text-[13px] text-[var(--yellow-700)]">
          Held for a moment while our team checks in. Only you can see it.
        </p>
      )}
      <header className="flex items-start gap-3">
        {author.badges.includes("team") ? (
          <Avatar member={author} size={40} />
        ) : (
          <Link href={author.id === "me" ? "/dashboard" : `/u/${author.handle}`} aria-hidden tabIndex={-1} className="shrink-0">
            <Avatar member={author} size={40} />
          </Link>
        )}
        <div className="min-w-0 flex-1 text-[14px]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Name member={author} pronouns={false} />
            <span className="text-muted">· {sel.timeAgo(post.minutesAgo)}</span>
            {post.edited && <span className="text-muted">· Edited</span>}
          </div>
          {showGroup && (
            <Link href={`/groups/${group.id}`} className="text-[13px] text-muted hover:text-ink hover:underline">
              {group.name}
            </Link>
          )}
        </div>
        <Menu
          label="Post options"
          trigger={(p) => (
            <button {...p} type="button" aria-label="Post options" className="press -mt-1 -mr-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink">
              <MoreHorizontal size={20} />
            </button>
          )}
          items={[
            {
              label: "Copy link",
              onSelect: () => {
                copy(`${location.origin}/posts/${post.id}`);
                toast("Link copied");
              },
            },
            post.allowSharing && {
              label: "Copy public link",
              onSelect: () => {
                copy(`${location.origin}/p/${post.id}`);
                toast("Public link copied");
              },
            },
            { label: post.saved ? "Remove from saved" : "Save", onSelect: () => act.posts.toggleSave(post.id) },
            ...(mine
              ? [{ label: "Delete post", danger: true, onSelect: () => act.posts.remove(post.id) }]
              : [
                  "divider" as const,
                  { label: "Report post", onSelect: () => setReport(true) },
                  { label: `Block ${sel.displayName(author)}`, danger: true, onSelect: () => { act.social.block(author.id); toast("Blocked. You won't see their posts."); } },
                ]),
          ]}
        />
      </header>

      {hidden ? (
        <div className="mt-4 rounded-[10px] bg-raised px-4 py-3 text-[14px] text-muted">
          Hidden because members voted it down.{" "}
          <button type="button" onClick={() => setReveal(true)} className="font-semibold text-ink underline">
            Show hidden content
          </button>
        </div>
      ) : (
        <Link href={`/posts/${post.id}`} className="group mt-4 block">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <TypeChip type={post.type} />
            {post.tags.slice(0, 3).map((t) => (
              <TagChip key={t}>{t}</TagChip>
            ))}
          </div>
          <h2 className="text-[18px] leading-snug font-semibold text-ink group-hover:underline">{post.title}</h2>
          <p className="mt-1.5 line-clamp-3 text-[15px] leading-relaxed text-ink-soft">{post.body}</p>
        </Link>
      )}

      <footer className="mt-4 flex flex-wrap items-center gap-2">
        <VoteControl
          up={post.up}
          down={post.down}
          my={post.myVote}
          allowDown={sel.allowsDownvote(post)}
          disabled={mine}
          onVote={(v) => handle(act.posts.vote(post.id, v))}
        />
        <Link href={`/posts/${post.id}#comments`} className="press inline-flex h-9 items-center gap-1.5 rounded-full bg-raised px-3 text-[14px] font-semibold text-ink-soft hover:text-ink">
          <MessageSquare size={16} />
          <span className="tabular">{comments}</span>
          <span className="sr-only">comments</span>
        </Link>
        <button
          type="button"
          onClick={() => act.posts.toggleSave(post.id)}
          aria-pressed={post.saved}
          aria-label={post.saved ? "Saved" : "Save"}
          className={`press grid h-9 w-9 place-items-center rounded-full bg-raised ${post.saved ? "text-accent" : "text-muted hover:text-ink"}`}
        >
          <Bookmark size={16} fill={post.saved ? "currentColor" : "none"} />
        </button>
        <span className="flex-1" />
        <SourceLabel source={post.source} link={post.sourceLink} />
      </footer>
      <ReportDialog open={report} onClose={() => setReport(false)} target={post.id} what="post" authorId={author.id} />
      {ui}
    </Panel>
  );
}
