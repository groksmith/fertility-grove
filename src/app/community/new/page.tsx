"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ListFilter, Plus, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { FigmaArt } from "@/components/Illustrations";
import { Button, fieldWidth, Modal, Select, Tag } from "@/components/ui";
import { COMMUNITY_GUIDELINES } from "@/lib/data";
import { COMMUNITY_TABS } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { POST_TYPES, type PostType } from "@/lib/types";

export default function CreatePostPage() {
  const router = useRouter();
  const { groups, addPost, profile } = useStore();
  const [target, setTarget] = useState("General Community");
  const [type, setType] = useState<PostType | "">("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [tagOpen, setTagOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const joined = groups.filter((g) => g.joined);

  function publish() {
    const next: Record<string, string> = {};
    if (!type) next.type = "Choose one type of post.";
    if (title.trim().length < 3) next.title = "Give your post a title.";
    if (body.trim().length < 10) next.body = "Add a little more to your post.";
    if (tags.length === 0) next.tags = "Add at least one tag before publishing.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const group = groups.find((g) => g.name === target);
    addPost({
      community: group ? group.name : profile.community || "General Community",
      groupId: group?.id,
      title: title.trim(),
      body: body.trim(),
      type: type as PostType,
      tags,
    });
    setSuccess(true);
  }

  function addTag() {
    const t = tagDraft.trim();
    if (!t || tags.length >= 5 || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagDraft("");
    setTagOpen(false);
    setErrors((e) => ({ ...e, tags: "" }));
  }

  return (
    <AppShell section="community" tabs={COMMUNITY_TABS} rail={<Guidelines />}>
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-[14px] text-ink"
      >
        <ChevronLeft size={17} /> back to Community board
      </Link>

      <h2 className="serif mt-5 text-[32px]">Create a post</h2>

      <div className="mt-5 flex items-center gap-2">
        <span className="text-[15px]">Post in:</span>
        <Select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          aria-label="Post in"
          className="!w-auto !border-0 !py-1 !pl-1 !text-[15px] !font-medium"
        >
          <option>General Community</option>
          {joined.map((g) => (
            <option key={g.id}>{g.name}</option>
          ))}
        </Select>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="text-[15px]">Type of post:</span>
        {POST_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              setErrors((e) => ({ ...e, type: "" }));
            }}
            aria-pressed={type === t}
            className="h-9 rounded-full px-4 text-[14px] font-medium transition"
            style={{
              background: type === t ? "var(--fg-coral)" : "#F1F1F1",
              color: type === t ? "var(--ink)" : "var(--ink-soft)",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {errors.type && <FieldError>{errors.type}</FieldError>}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={150}
        placeholder="*Title..."
        aria-label="Title"
        className={`mt-6 w-full ${fieldWidth} rounded-xl border px-4 py-3.5 text-[15px] placeholder:text-muted focus:outline-none ${
          errors.title
            ? "border-[#E0574F]"
            : "border-line-strong focus:border-green"
        }`}
      />
      {errors.title && <FieldError>{errors.title}</FieldError>}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
        rows={8}
        placeholder="*Body..."
        aria-label="Body"
        className={`mt-4 w-full resize-none rounded-xl border px-4 py-3.5 text-[15px] leading-relaxed placeholder:text-muted focus:outline-none ${
          errors.body ? "border-[#E0574F]" : "border-line-strong focus:border-green"
        }`}
      />
      {errors.body && <FieldError>{errors.body}</FieldError>}
      <p className="mt-1 text-right text-[12.5px] text-muted-light">
        {body.length}/5,000
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {tags.map((t) => (
          <button key={t} onClick={() => setTags(tags.filter((x) => x !== t))}>
            <Tag tone="green">
              {t} <X size={12} className="ml-1.5 inline" />
            </Tag>
          </button>
        ))}
        {tags.length < 5 && (
          <button
            onClick={() => setTagOpen(true)}
            className="h-9 rounded-full px-4 text-[14px] font-medium transition hover:brightness-95"
            style={{
              background: "#F1F1F1",
              boxShadow: errors.tags ? "inset 0 0 0 1.5px #E0574F" : undefined,
            }}
          >
            <Plus size={14} className="mr-1 inline" />
            Add tags (minimum of 1)
          </button>
        )}
      </div>
      {errors.tags && <FieldError>{errors.tags}</FieldError>}

      {tagOpen && (
        <form
          className="mt-3 flex max-w-sm gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addTag();
          }}
        >
          <input
            autoFocus
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            placeholder="e.g. IVF, Tips, Anxious"
            aria-label="New tag"
            className={`w-full ${fieldWidth} rounded-lg border border-line-strong px-3 py-2 text-[14px] focus:outline-none`}
          />
          <Button type="submit" size="sm">
            Add
          </Button>
        </form>
      )}

      <div className="mt-9">
        <Button variant="coral" size="lg" onClick={publish}>
          Publish post
        </Button>
      </div>

      <Modal
        open={success}
        onClose={() => router.push("/community")}
        width={520}
        labelledBy="post-success"
      >
        <div className="relative">
          <button
            onClick={() => router.push("/community")}
            aria-label="Close"
            className="absolute right-0 top-0"
          >
            <X size={20} />
          </button>
          <div className="flex flex-col items-center px-6 pb-2 pt-6 text-center">
            <FigmaArt name="post-published" className="w-[190px]" />
            <h3 id="post-success" className="serif mt-6 text-[26px]">
              🎉 Success
            </h3>
            <p className="serif mt-2 max-w-[320px] text-[19px] leading-snug">
              Your post has been published. Thanks for contributing to our
              community!
            </p>
            <Button
              className="mt-7"
              variant="coral"
              onClick={() => router.push("/community")}
            >
              Back to the board
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-2 text-[13px] font-medium text-[#B23A2E]">
      {children}
    </p>
  );
}

function Guidelines() {
  return (
    <div>
      <h3 className="serif flex items-center gap-2 text-[21px]">
        <ListFilter size={17} /> Community Guidelines
      </h3>
      <ul className="mt-4 space-y-4">
        {COMMUNITY_GUIDELINES.map((g) => (
          <li key={g.title}>
            <p className="text-[13.5px] font-semibold">{g.title}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{g.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
