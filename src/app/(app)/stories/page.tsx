"use client";

/* Success stories (PRD §10): one space for the whole community, not a group.
   Anyone can post without joining, there are no downvotes, and stories stay
   out of the feed unless the member turns them on. */

import { Spot } from "@/components/art/Scenes";
import { useState } from "react";
import { ArrowBigUp, Bookmark, MessageSquare, PenLine } from "lucide-react";
import { useResult } from "@/components/Safety";
import { ChipSelect, EmptyState, LinkButton, Name, Panel, SourceLabel, TagChip, TypeChip } from "@/components/ui";
import { act, sel, useStore } from "@/lib/store";
import { WHAT_HELPED } from "@/lib/options";
import type { Story } from "@/lib/types";

function StoryCard({ story }: { story: Story }) {
  const s = useStore();
  const author = sel.person(s, story.authorId);
  const { handle, ui } = useResult();
  if (!author) return null;
  const mine = story.authorId === "me";
  return (
    <Panel as="article" className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
        <Name member={author} pronouns={false} />
        <span className="text-muted">· {sel.timeAgo(story.minutesAgo)}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <TypeChip type={story.type} />
        {story.diagnoses.map((d) => (
          <TagChip key={d}>{d}</TagChip>
        ))}
      </div>
      <h2 className="mt-3 text-[20px] leading-snug font-semibold">{story.title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-ink">{story.body}</p>
      {story.whatHelped.length > 0 && (
        <p className="mt-3 text-[14px] text-muted">
          <span className="font-semibold text-ink-soft">What helped:</span> {story.whatHelped.join(", ")}
        </p>
      )}
      <footer className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={mine}
          aria-pressed={story.myVote === 1}
          onClick={() => handle(act.stories.upvote(story.id))}
          className={`press inline-flex h-9 items-center gap-1.5 rounded-full bg-raised px-3 text-[14px] font-semibold ${story.myVote === 1 ? "text-accent" : "text-ink-soft hover:text-ink"} disabled:opacity-50`}
        >
          <ArrowBigUp size={18} fill={story.myVote === 1 ? "currentColor" : "none"} />
          <span className="tabular">{story.up}</span>
          <span className="sr-only">upvotes</span>
        </button>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-raised px-3 text-[14px] font-semibold text-ink-soft">
          <MessageSquare size={16} /> <span className="tabular">{story.comments}</span>
          <span className="sr-only">comments</span>
        </span>
        <button
          type="button"
          onClick={() => act.stories.toggleSave(story.id)}
          aria-pressed={story.saved}
          aria-label={story.saved ? "Saved" : "Save"}
          className={`press grid h-9 w-9 place-items-center rounded-full bg-raised ${story.saved ? "text-accent" : "text-muted hover:text-ink"}`}
        >
          <Bookmark size={16} fill={story.saved ? "currentColor" : "none"} />
        </button>
        <span className="flex-1" />
        <SourceLabel source={story.source} />
      </footer>
      {ui}
    </Panel>
  );
}

export default function StoriesPage() {
  const s = useStore();
  const [diag, setDiag] = useState<string[]>([]);
  const [helped, setHelped] = useState<string[]>([]);
  const diagnoses = Array.from(new Set(s.stories.flatMap((x) => x.diagnoses)));
  const helpedOptions = WHAT_HELPED.filter((h) => s.stories.some((x) => x.whatHelped.includes(h)));
  const stories = s.stories
    .filter((x) => !s.blocked.includes(x.authorId))
    .filter((x) => !diag.length || x.diagnoses.some((d) => diag.includes(d)))
    .filter((x) => !helped.length || x.whatHelped.some((h) => helped.includes(h)))
    .sort((a, b) => a.minutesAgo - b.minutesAgo);

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
        <div className="flex min-w-0 items-center gap-4">
          <Spot kind="stories" size={104} className="hidden sm:block" />
          <div>
            <h1 className="serif text-[28px] leading-[1.1] lg:text-[32px]">Success stories</h1>
            <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">
              Hope from the other side, kept in its own space so you can visit when you&apos;re ready.
            </p>
          </div>
        </div>
        <LinkButton href="/stories/new">
          <PenLine size={17} /> Share your story
        </LinkButton>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {stories.length === 0 ? (
            <EmptyState
              art="blossom"
              title={s.stories.length ? "No stories match those filters." : "No stories here yet. When you're ready, yours could be the first."}
              action={s.stories.length ? undefined : <LinkButton href="/stories/new">Share your story</LinkButton>}
            />
          ) : (
            <ul className="space-y-4">
              {stories.map((x) => (
                <li key={x.id}>
                  <StoryCard story={x} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className="space-y-4">
          <Panel className="space-y-5 p-5">
            <h2 className="text-[16px] font-semibold">Filter stories</h2>
            <div>
              <p className="mb-2 text-[14px] text-muted">Diagnosis</p>
              <ChipSelect label="Diagnosis" options={diagnoses} value={diag} onChange={setDiag} />
            </div>
            <div>
              <p className="mb-2 text-[14px] text-muted">What helped</p>
              <ChipSelect label="What helped" options={helpedOptions} value={helped} onChange={setHelped} />
            </div>
          </Panel>
          <Panel className="p-5 text-[14px] leading-relaxed text-ink-soft">
            <h2 className="text-[16px] font-semibold text-ink">In your feed?</h2>
            <p className="mt-1.5">
              Stories only appear in your feed if you turn on &quot;Show success stories in my feed&quot; in Settings. It&apos;s{" "}
              {s.me.showStories ? "on" : "off"} for you right now.
            </p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
