"use client";

import { useState } from "react";
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react";
import { Avatar, fieldWidth, Tag } from "./ui";
import { useStore } from "@/lib/store";
import type { Post } from "@/lib/types";

const TYPE_TONE: Record<string, "green" | "coral" | "blue" | "yellow" | "purple"> = {
  Question: "blue",
  "Seeking Input": "green",
  "Support Needed": "coral",
  "Just Venting": "purple",
  "Just Sharing": "yellow",
};

export function displayName(author: Post["author"]) {
  return author.anonymous ? author.handle : author.name;
}

export function PostCard({
  post,
  showSource = true,
}: {
  post: Post;
  showSource?: boolean;
}) {
  const { toggleLike, toggleSave, addComment, profile } = useStore();
  const [comment, setComment] = useState("");
  const [openComments, setOpenComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reported, setReported] = useState(false);

  return (
    <article className="border-b border-line pb-7">
      {showSource && (
        <p className="text-[13.5px] text-muted">
          from <span className="text-ink">{post.community}</span> community
        </p>
      )}

      <h3 className="mt-1 text-[17.5px] font-bold leading-snug">{post.title}</h3>

      <div className="mt-2 flex items-center gap-2.5">
        <Avatar name={displayName(post.author)} size={26} />
        <span className="text-[13.5px] font-medium">{displayName(post.author)}</span>
        <span className="text-[13px] text-muted-light">•</span>
        <span className="text-[13px] text-muted">{post.createdAt}</span>
        <div className="relative ml-auto">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="text-muted-light transition hover:text-ink"
            aria-label={`More options for ${post.title}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <ul
              role="menu"
              className="pop-in absolute right-0 top-7 z-10 w-44 rounded-xl border border-line bg-white py-1 shadow-lg"
            >
              <li>
                <button
                  role="menuitem"
                  onClick={() => {
                    toggleSave(post.id);
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-[13.5px] hover:bg-surface"
                >
                  {post.saved ? "Remove from saved" : "Save this post"}
                </button>
              </li>
              <li>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setReported(true);
                  }}
                  className="w-full px-4 py-2 text-left text-[13.5px] hover:bg-surface"
                >
                  Report this post
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Tag tone={TYPE_TONE[post.type] ?? "gray"} outlined>
          {post.type}
        </Tag>
        {post.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>

      <p className="mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-ink">
        {post.body}
      </p>

      <div className="mt-4 flex items-center gap-6">
        <button
          onClick={() => toggleLike(post.id)}
          aria-pressed={!!post.liked}
          className="flex items-center gap-2 text-[14px] transition"
          style={{ color: post.liked ? "var(--fg-coral-dark)" : "var(--ink)" }}
        >
          <Heart size={17} fill={post.liked ? "currentColor" : "none"} />
          {post.liked ? "Liked" : "Like"}
          {post.likes > 0 && (
            <span className="text-muted">· {post.likes}</span>
          )}
        </button>
        <button
          onClick={() => toggleSave(post.id)}
          aria-pressed={!!post.saved}
          className="flex items-center gap-2 text-[14px] transition"
          style={{ color: post.saved ? "var(--fg-green-dark)" : "var(--ink)" }}
        >
          <Bookmark size={17} fill={post.saved ? "currentColor" : "none"} />
          {post.saved ? "Saved" : "Save"}
        </button>
        <button
          onClick={() => setOpenComments((v) => !v)}
          className="flex items-center gap-2 text-[14px]"
        >
          <MessageCircle size={17} />
          {post.comments.length === 0
            ? "Comments"
            : `${post.comments.length} ${
                post.comments.length === 1 ? "comment" : "comments"
              }`}
        </button>
      </div>

      {openComments && post.comments.length > 0 && (
        <ul className="mt-4 space-y-4 border-l-2 border-line pl-4">
          {post.comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar name={displayName(c.author)} size={28} />
              <div>
                <p className="text-[13.5px]">
                  <span className="font-semibold">{displayName(c.author)}</span>{" "}
                  <span className="text-muted-light">· {c.createdAt}</span>
                </p>
                <p className="mt-1 text-[14px] leading-relaxed">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className={`mt-4 flex ${fieldWidth} items-center gap-2 rounded-[10px] bg-surface px-4 py-1`}
        onSubmit={(e) => {
          e.preventDefault();
          if (!comment.trim()) return;
          addComment(post.id, comment.trim());
          setComment("");
          setOpenComments(true);
        }}
      >
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comment..."
          aria-label={`Comment on ${post.title}`}
          className="w-full bg-transparent py-2.5 text-[14px] placeholder:text-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={!comment.trim()}
          aria-label="Post comment"
          className="text-muted transition enabled:hover:text-green-dark disabled:opacity-30"
        >
          <Send size={17} />
        </button>
        <Avatar
          name={`${profile.firstName} ${profile.lastName}`}
          size={26}
          preset={profile.avatarPreset}
        />
      </form>
      {reported && (
        <p
          role="status"
          className="mt-3 rounded-lg bg-tint-green px-4 py-2.5 text-[13px] text-green-dark"
        >
          Reported. A moderator will take a look.
        </p>
      )}
    </article>
  );
}
