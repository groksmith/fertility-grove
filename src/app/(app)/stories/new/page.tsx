"use client";

/* Share your story (PRD §10). Diagnosis starts empty; "Fill from my profile"
   copies it in with a note that members will see it, and is hidden when
   health-data consent is off. */

import { useState } from "react";
import { useUnsavedGuard } from "@/components/UnsavedGuard";
import { Spot } from "@/components/art/Scenes";
import { useResult } from "@/components/Safety";
import { Button, ChipSelect, Choices, Counter, Field, Input, LinkButton, PageHeader, Panel, Select, Textarea } from "@/components/ui";
import { act, useStore } from "@/lib/store";
import { DIAGNOSES, SOURCES, STORY_TYPES, WHAT_HELPED } from "@/lib/options";
import { canMentor } from "@/lib/rules/sunlight";
import type { Source, StoryType } from "@/lib/types";

export default function NewStoryPage() {
  const me = useStore((s) => s.me);
  const [type, setType] = useState<StoryType[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [filled, setFilled] = useState(false);
  const [whatHelped, setWhatHelped] = useState<string[]>([]);
  const [source, setSource] = useState<Source | "">("");
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const { handle, ui } = useResult();
  const guard = useUnsavedGuard({ dirty: !done && !!(title.trim() || body.trim() || diagnoses.length || whatHelped.length) });

  if (done) {
    const mentorReady = canMentor(me.level, me.founding) && !me.mentoring.on;
    return (
      <Panel className="mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center">
        <Spot kind="blossom" size={200} />
        <h1 className="serif mt-4 text-[36px] leading-tight">Thank you for sharing</h1>
        <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-ink-soft">
          Your story is in Success stories. It may be exactly what someone needs to read today.
        </p>
        {mentorReady ? (
          <p className="mt-4 rounded-[14px] bg-purple-tint px-4 py-3 text-[14px] text-purple-ink">
            You&apos;ve reached {me.level}, so you can mentor members who are where you were.
          </p>
        ) : (
          !me.mentoring.on && (
            <p className="mt-4 text-[14px] text-muted">When your tree reaches Blossom Tree, you can mentor members who are where you were.</p>
          )
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <LinkButton href="/stories">See Success stories</LinkButton>
          {mentorReady && (
            <LinkButton href="/mentors/setup" variant="secondary">
              Set up mentoring
            </LinkButton>
          )}
        </div>
      </Panel>
    );
  }

  return (
    <>
      <PageHeader title="Share your story" lede="A success story, a pregnancy update, or advice from the other side." />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (title.length > 150 || body.length > 5000) return setError("Titles can be up to 150 characters and stories up to 5,000.");
          const r = act.stories.create({ type: type[0] ?? "", title, body, diagnoses, whatHelped, source });
          if (!r.ok && r.code !== "unconfirmed") return setError(r.error);
          setError(undefined);
          if (handle(r)) setDone(true);
        }}
        className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="min-w-0 space-y-4">
          {error ? (
            <p role="alert" className="rounded-[20px] bg-danger-soft px-5 py-4 text-[14px] font-semibold text-danger">
              {error}
            </p>
          ) : null}
          <Panel className="space-y-6 p-5 sm:p-7">
            <Choices legend="Story type" options={STORY_TYPES} value={type} onChange={setType} columns={3} />
            <Field label="Title" counter={<Counter value={title} max={150} />}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Your story" counter={<Counter value={body} max={5000} />}>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={9} />
            </Field>
          </Panel>
          <Panel className="space-y-6 p-5 sm:p-7">
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[14px] font-semibold">
                  Diagnosis <span className="font-normal text-muted">(optional)</span>
                </p>
                {me.healthConsent && me.diagnoses.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDiagnoses(Array.from(new Set([...diagnoses, ...me.diagnoses])));
                      setFilled(true);
                    }}
                  >
                    Fill from my profile
                  </Button>
                )}
              </div>
              {filled && <p className="mb-2 text-[13px] text-muted">Members will see the diagnosis on your story.</p>}
              <ChipSelect label="Diagnosis" options={DIAGNOSES.filter((d) => d !== "Other")} value={diagnoses} onChange={setDiagnoses} />
            </div>
            <div>
              <p className="mb-2 text-[14px] font-semibold">
                What helped <span className="font-normal text-muted">(optional)</span>
              </p>
              <ChipSelect label="What helped" options={WHAT_HELPED} value={whatHelped} onChange={setWhatHelped} />
            </div>
            <Field label="Source">
              <Select value={source} onChange={(e) => setSource(e.target.value as Source)}>
                <option value="">Choose a source</option>
                {SOURCES.filter((x) => x !== "Clinician input").map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            </Field>
          </Panel>
          <Button type="submit" size="lg">
            Publish story
          </Button>
        </div>
        <aside>
          <Panel className="p-5 text-[14px] leading-relaxed text-ink-soft">
            <Spot kind="blossom" size={120} />
            <h2 className="mt-2 text-[16px] font-semibold text-ink">Your story, your way</h2>
            <p className="mt-1.5">Share as much or as little as you like. You don&apos;t have to name a diagnosis, and you can post under your handle.</p>
          </Panel>
        </aside>
        {ui}
        {guard.ui}
      </form>
    </>
  );
}
