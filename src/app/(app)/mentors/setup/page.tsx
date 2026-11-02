"use client";

/* Mentor setup (PRD §12). Opens at Blossom Tree or with a Founding mentor
   badge; no application. Bio, what I can help with, how many at once, and the
   mentor guidelines. */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useUnsavedGuard } from "@/components/UnsavedGuard";
import { Spot } from "@/components/art/Scenes";
import { TreeArt } from "@/components/art/Tree";
import { Button, Checkbox, Choices, Counter, Field, PageHeader, Panel, Select, Textarea, toast } from "@/components/ui";
import { DIAGNOSES, JOURNEY_STAGES, PATHS, TREATMENTS } from "@/lib/options";
import { canMentor, progress } from "@/lib/rules/sunlight";
import { act, useStore } from "@/lib/store";

const HELP_OPTIONS: string[] = Array.from(
  new Set<string>([...DIAGNOSES.filter((d) => d !== "Other" && d !== "Not diagnosed yet"), ...TREATMENTS.filter((t) => t !== "Other"), ...JOURNEY_STAGES.slice(0, 8), ...PATHS.slice(1, 5)]),
);

export default function MentorSetupPage() {
  const me = useStore((s) => s.me);
  const [bio, setBio] = useState(me.mentoring.bio);
  const [helps, setHelps] = useState<string[]>(me.mentoring.helpsWith);
  const [capacity, setCapacity] = useState(me.mentoring.capacity || 3);
  const [agreed, setAgreed] = useState(me.mentoring.on);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const eligible = canMentor(me.level, me.founding);
  const m = me.mentoring;
  const dirty =
    eligible &&
    (bio !== m.bio || capacity !== (m.capacity || 3) || agreed !== m.on || helps.length !== m.helpsWith.length || helps.some((h) => !m.helpsWith.includes(h)));
  const commit = () => {
    const r = act.mentors.setup({ bio, helpsWith: helps, capacity, agreed });
    setErrs(r.errs);
    if (r.ok) toast(m.on ? "Mentor profile saved." : "Mentoring is on. Your badge now shows on your profile.");
    return r.ok;
  };
  const guard = useUnsavedGuard({ dirty, onSave: commit });

  if (!eligible) {
    const pct = Math.round((me.level === "Tree" ? progress(me.level, me.sunlight) : me.sunlight / 750) * 100);
    return (
      <>
        <Link href="/mentors" className="mb-3 -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-semibold text-muted hover:text-ink">
          <ArrowLeft size={16} /> Mentors
        </Link>
        <Panel className="mx-auto flex max-w-xl flex-col items-center p-8 text-center">
          <TreeArt level="Blossom Tree" size={160} />
          <h1 className="serif mt-4 text-[36px] leading-tight">Mentoring opens at Blossom Tree</h1>
          <p className="tabular mt-2 text-[15px] text-ink-soft">
            Reach 750 Sunlight and the mentoring switch turns on. You have {me.sunlight.toLocaleString()}.
          </p>
          <div className="mt-5 h-2 w-full max-w-sm overflow-hidden rounded-full bg-raised" role="progressbar" aria-valuenow={Math.min(100, pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to Blossom Tree">
            <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <p className="mt-3 text-[13px] text-muted">Sunlight comes from members finding your posts and comments helpful.</p>
        </Panel>
      </>
    );
  }

  const profileHelps = [...me.diagnoses, ...me.treatments, ...me.stages].filter((x) => HELP_OPTIONS.includes(x));

  return (
    <>
      <Link href="/mentors" className="mb-3 -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[15px] font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> Mentors
      </Link>
      <PageHeader
        title={me.mentoring.on ? "Your mentor profile" : "Become a mentor"}
        lede="Newer members on your path will see this. Mentoring is free, and you choose how many people you help at once."
        art={<Spot kind="shelter" size={88} className="hidden sm:block" />}
      />
      <Panel className="max-w-3xl p-6 sm:p-8">
        <form
          className="space-y-7"
          onSubmit={(e) => {
            e.preventDefault();
            if (commit()) guard.leaveTo("/mentors");
          }}
        >
          <Field label="Mentor bio" error={errs.bio} counter={<Counter value={bio} max={500} />} hint="What you went through, and what you can help with.">
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} max={500} hardStop rows={5} />
          </Field>
          <div>
            <Choices legend="I can help with" options={HELP_OPTIONS} value={helps} onChange={setHelps} multi error={errs.helpsWith} columns={3} />
            {me.healthConsent && profileHelps.length > 0 && (
              <button type="button" onClick={() => setHelps(Array.from(new Set([...helps, ...profileHelps])))} className="mt-3 text-[14px] font-semibold text-accent hover:underline">
                Fill from my profile
              </button>
            )}
          </div>
          <Field label="How many people I can mentor at once" hint="Waiting requests count toward this.">
            <Select value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="sm:max-w-40">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </Select>
          </Field>
          <div className="rounded-[14px] bg-raised p-4">
            <p className="text-[15px] font-semibold">Mentor guidelines</p>
            <ul className="mt-2 space-y-1 text-[14px] leading-relaxed text-ink-soft">
              <li>Share your experience, never medical advice.</li>
              <li>No selling or promoting products or services.</li>
              <li>If someone may be in danger, share crisis resources and report it.</li>
              <li>Keep what you hear private.</li>
            </ul>
            <div className="mt-4">
              <Checkbox checked={agreed} onChange={setAgreed} error={errs.agreed}>
                I agree to the mentor guidelines
              </Checkbox>
            </div>
          </div>
          <Button type="submit">{me.mentoring.on ? "Save changes" : "Start mentoring"}</Button>
        </form>
        {guard.ui}
      </Panel>
    </>
  );
}
