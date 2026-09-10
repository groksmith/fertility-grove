"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button, Field, Input, Logo, notWired, Select } from "@/components/ui";
import { ConfettiField, FigmaArt } from "@/components/Illustrations";
import { COMMUNITIES } from "@/lib/data";
import { useStore } from "@/lib/store";
import {
  DIAGNOSES,
  GENDER_IDENTITIES,
  JOURNEY_STAGES,
  PRONOUNS,
} from "@/lib/types";

const TOTAL = 9;

const AVATAR_PRESETS = [
  { bg: "#E0F6EB", fg: "#0A7A3B" },
  { bg: "#FFE7DE", fg: "#C24A28" },
  { bg: "#DFF3FF", fg: "#326A97" },
  { bg: "#F1E7F1", fg: "#7546A4" },
  { bg: "#FFFBE8", fg: "#A8862A" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, completeOnboarding } = useStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    zip: "",
    genderIdentity: "",
    genderSelfDescribe: "",
    pronouns: "",
    pronounsSelfDescribe: "",
    birthYear: "",
    aboutMe: "",
    community: "",
    stages: [] as string[],
    diagnoses: [] as string[],
    handle: "",
    anonymous: false,
    notifications: { comments: true, messages: true, donations: true, digest: false },
    avatarPreset: -1,
  });
  const [error, setError] = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggle = (k: "stages" | "diagnoses", v: string) =>
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v],
    }));

  function validate(): string {
    switch (step) {
      case 1:
        if (!form.firstName.trim() || !form.lastName.trim())
          return "First and last name are required.";
        if (!/^\d{5}(-\d{4})?$/.test(form.zip))
          return "Enter a valid 5-digit ZIP code.";
        if (!form.genderIdentity) return "Choose a gender identity.";
        if (form.genderIdentity === "Prefer to self-describe" && !form.genderSelfDescribe.trim())
          return "Tell us how you'd like to describe your gender identity.";
        if (!form.pronouns) return "Choose your pronouns.";
        if (form.pronouns === "Prefer to self-describe" && !form.pronounsSelfDescribe.trim())
          return "Tell us your pronouns.";
        return "";
      case 3:
        return form.community ? "" : "Choose one community to continue.";
      case 4:
        return form.stages.length ? "" : "Select at least one option.";
      case 6:
        if (!/^[a-z][a-z0-9_]{2,29}$/.test(form.handle))
          return "Handles are 3–30 characters: lowercase letters, numbers, underscores, starting with a letter.";
        return "";
      default:
        return "";
    }
  }

  function next() {
    const err = validate();
    setError(err);
    if (err) return;
    if (step === TOTAL) {
      completeOnboarding({
        firstName: form.firstName,
        lastName: form.lastName,
        zip: form.zip,
        genderIdentity:
          form.genderIdentity === "Prefer to self-describe"
            ? form.genderSelfDescribe
            : form.genderIdentity,
        pronouns:
          form.pronouns === "Prefer to self-describe"
            ? form.pronounsSelfDescribe
            : form.pronouns,
        birthYear: Number(form.birthYear) || profile.birthYear,
        aboutMe: form.aboutMe || profile.aboutMe,
        community: form.community,
        stages: form.stages,
        diagnoses: form.diagnoses,
        handle: form.handle,
        anonymous: form.anonymous,
        notifications: form.notifications,
        avatarPreset: form.avatarPreset,
      });
      router.push("/dashboard");
      return;
    }
    setStep((s) => s + 1);
  }

  /* Left-panel artwork, keyed to the step. Steps 1, 3, 4 and 8 use the exact
     illustrations from the Figma frames; the steps the export didn't cover
     borrow the nearest piece from the same set. */
  const art = [
    "onb-basic-info",
    "onb-basic-info",
    "onb-community",
    "onb-traveling",
    "learn-diagnoses",
    "learn-emotional",
    "learn-faq",
    "onb-photo",
  ][step - 1];

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[42.5%_57.5%]">
      {/* Left: progress + illustration */}
      <div className="relative flex flex-col overflow-hidden bg-[#F5F5F5] px-10 py-8 lg:px-14 lg:py-12">
        <Logo />
        <div className="mt-9 flex gap-2" aria-label={`Step ${step} of ${TOTAL}`}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <span
              key={i}
              className="h-2 w-11 rounded-full transition-colors"
              style={{ background: i < step ? "#3D3D3D" : "#DCDCDC" }}
            />
          ))}
        </div>
        {step === TOTAL ? (
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <ConfettiField />
          </div>
        ) : (
          <div className="mt-auto hidden w-full max-w-[440px] self-center pb-6 lg:block">
            <FigmaArt name={art} className="w-full" />
          </div>
        )}
      </div>

      {/* Right: form */}
      <div className="flex flex-col px-8 py-10 lg:px-16 lg:py-14">
        <div className="flex-1">
          {step === 1 && (
            <Step title="Let’s get some basic info about you">
              <div className="max-w-[420px] space-y-5">
                <Field label="First name">
                  <Input
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                  />
                </Field>
                <Field label="Last name">
                  <Input
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                  />
                </Field>
                <Field label="Zip Code">
                  <Input
                    value={form.zip}
                    inputMode="numeric"
                    placeholder="94549"
                    onChange={(e) => set("zip", e.target.value)}
                  />
                </Field>
                <Field label="Gender Identity">
                  <Select
                    value={form.genderIdentity}
                    onChange={(e) => set("genderIdentity", e.target.value)}
                  >
                    <option value="">Select…</option>
                    {GENDER_IDENTITIES.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </Select>
                </Field>
                {form.genderIdentity === "Prefer to self-describe" && (
                  <Field label="Describe your gender identity" required>
                    <Input
                      value={form.genderSelfDescribe}
                      onChange={(e) => set("genderSelfDescribe", e.target.value)}
                    />
                  </Field>
                )}
                <Field label="Pronouns">
                  <Select
                    value={form.pronouns}
                    onChange={(e) => set("pronouns", e.target.value)}
                  >
                    <option value="">Select…</option>
                    {PRONOUNS.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </Select>
                </Field>
                {form.pronouns === "Prefer to self-describe" && (
                  <Field label="Your pronouns" required>
                    <Input
                      value={form.pronounsSelfDescribe}
                      onChange={(e) => set("pronounsSelfDescribe", e.target.value)}
                    />
                  </Field>
                )}
              </div>

              <div className="mt-12 space-y-3 text-[14px]">
                <p>
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium underline underline-offset-2"
                  >
                    Log In
                  </Link>
                </p>
                <p>
                  By signing up, I am agreeing to Fertility Grove’s{" "}
                  <Link
                    href="/help"
                    className="font-medium underline underline-offset-2"
                  >
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/help"
                    className="font-medium underline underline-offset-2"
                  >
                    Privacy Policy.
                  </Link>
                </p>
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step
              title="Tell us a little about you."
              sub="Optional — you can fill this in later from your profile. Members see this when they open your profile."
            >
              <Field label="About me" hint={`${form.aboutMe.length}/1,000`}>
                <textarea
                  value={form.aboutMe}
                  maxLength={1000}
                  onChange={(e) => set("aboutMe", e.target.value)}
                  rows={9}
                  placeholder="What brought you here, where you are, what you're hoping to find…"
                  className="w-full resize-none rounded-[10px] border border-line-strong bg-white px-3.5 py-3 text-[14.5px] leading-relaxed placeholder:text-muted-light focus:border-green focus:outline-none"
                />
              </Field>
            </Step>
          )}

          {step === 3 && (
            <Step
              title="Choose your Community."
              sub="To create safe, focused spaces for support, our community is split into two groups. We know everyone’s experience is personal — please join the community that best fits your journey. You’ll see the same content and tools, but your community space will reflect your perspective and needs."
            >
              <div className="max-w-[640px]">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[14.5px] font-medium">
                    Which community would you like to join?
                  </span>
                  <span
                    className="group relative inline-grid h-[18px] w-[18px] place-items-center rounded-full border border-ink text-[11px] font-semibold"
                    tabIndex={0}
                    role="note"
                    aria-label="The content and tools are identical in both communities — only the space differs."
                  >
                    i
                    <span className="pointer-events-none absolute left-6 top-0 z-10 hidden w-[260px] rounded-lg bg-ink px-3 py-2 text-[12.5px] font-normal leading-snug text-white group-hover:block group-focus:block">
                      The content and tools are identical in both communities —
                      only the space differs.
                    </span>
                  </span>
                </div>
                <Select
                  value={form.community}
                  onChange={(e) => set("community", e.target.value)}
                  aria-label="Which community would you like to join?"
                  className="h-12"
                >
                  <option value="">Select…</option>
                  {COMMUNITIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                {form.community && (
                  <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
                    {COMMUNITIES.find((c) => c.name === form.community)?.description}
                  </p>
                )}
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step
              title="Where are you in your fertility journey?"
              sub="You can select multiple options."
            >
              <ChipGrid
                options={[...JOURNEY_STAGES]}
                selected={form.stages}
                onToggle={(v) => toggle("stages", v)}
              />
            </Step>
          )}

          {step === 5 && (
            <Step
              title="Has a doctor named anything specific?"
              sub="Optional. This shapes which articles and groups we surface first — it is never shown on your profile."
            >
              <ChipGrid
                options={[...DIAGNOSES]}
                selected={form.diagnoses}
                onToggle={(v) => toggle("diagnoses", v)}
              />
            </Step>
          )}

          {step === 6 && (
            <Step
              title="How would you like to appear?"
              sub="Most members post under a handle. You can switch this at any time from Settings."
            >
              <Field
                label="Pick a handle"
                required
                hint="Lowercase letters, numbers and underscores. Starts with a letter."
              >
                <div className="flex items-center gap-2">
                  <span className="text-[16px] text-muted">@</span>
                  <Input
                    value={form.handle}
                    placeholder="hopeful_annie"
                    onChange={(e) =>
                      set("handle", e.target.value.toLowerCase().replace(/\s/g, "_"))
                    }
                  />
                </div>
              </Field>

              <div className="mt-6 space-y-3">
                {[
                  {
                    v: false,
                    title: "Show my real name",
                    body: "Posts, comments, and messages show your first and last name.",
                  },
                  {
                    v: true,
                    title: "Show my handle instead",
                    body: "You participate fully, but nobody sees your real name.",
                  },
                ].map((opt) => (
                  <button
                    key={String(opt.v)}
                    type="button"
                    onClick={() => set("anonymous", opt.v)}
                    aria-pressed={form.anonymous === opt.v}
                    className="block w-full rounded-xl border-2 p-4 text-left transition"
                    style={{
                      borderColor:
                        form.anonymous === opt.v ? "#A874DB" : "var(--line)",
                      background:
                        form.anonymous === opt.v ? "var(--tint-purple)" : "#fff",
                    }}
                  >
                    <span className="block text-[15px] font-semibold">{opt.title}</span>
                    <span className="mt-1 block text-[13.5px] text-muted">
                      {opt.body}
                    </span>
                  </button>
                ))}
              </div>
            </Step>
          )}

          {step === 7 && (
            <Step
              title="What should we tell you about?"
              sub="You can change any of this later. We will never email you more than once a day."
            >
              <ul className="divide-y divide-line rounded-xl border border-line">
                {(
                  [
                    ["comments", "Comments and replies on my posts"],
                    ["messages", "New direct messages"],
                    ["donations", "Donations to my support campaign"],
                    ["digest", "A daily email digest of what I missed"],
                  ] as const
                ).map(([key, label]) => (
                  <li key={key} className="flex items-center justify-between px-4 py-3.5">
                    <span className="text-[14.5px]">{label}</span>
                    <Switch
                      checked={form.notifications[key]}
                      label={label}
                      onChange={(v) =>
                        set("notifications", { ...form.notifications, [key]: v })
                      }
                    />
                  </li>
                ))}
              </ul>
            </Step>
          )}

          {step === 8 && (
            <Step title="Add a profile photo." sub="(Adding a photo is optional)">
              <div
                className="grid h-[100px] w-[100px] place-items-center overflow-hidden rounded-full"
                style={{ background: "var(--tint-green)" }}
              >
                {form.avatarPreset >= 0 ? (
                  <PresetFace fg={AVATAR_PRESETS[form.avatarPreset].fg} />
                ) : (
                  <UserGlyph size={44} />
                )}
              </div>
              <button
                type="button"
                className="mt-4 text-[14.5px] underline-offset-2 hover:underline disabled:no-underline disabled:opacity-40"
                {...notWired}
              >
                Upload from my computer
              </button>

              <h3 className="serif mt-12 text-[26px]">or, select an avatar</h3>
              <div className="mt-4 flex flex-wrap gap-6">
                {AVATAR_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => set("avatarPreset", i)}
                    aria-label={`Avatar ${i + 1}`}
                    aria-pressed={form.avatarPreset === i}
                    className="grid h-11 w-11 place-items-center rounded-full transition"
                    style={{
                      color: form.avatarPreset === i ? preset.fg : "var(--ink)",
                      background:
                        form.avatarPreset === i ? preset.bg : "transparent",
                    }}
                  >
                    <UserGlyph size={26} />
                  </button>
                ))}
              </div>
            </Step>
          )}

          {step === 9 && (
            <Step
              title={`You're all set, ${form.firstName || "friend"}!`}
              sub=""
            >
              <h3 className="serif -mt-4 text-[30px] leading-snug">
                Welcome to Fertility Grove — we&rsquo;re glad you&rsquo;re here.
              </h3>
              <div className="mt-6 space-y-5 text-[15.5px] leading-relaxed">
                <p>
                  Infertility is tough, emotionally and physically, but you
                  don&rsquo;t have to face it alone.
                </p>
                <p>
                  Fertility Grove brings everything you need into one place:
                  organize your journey, connect with others, find trusted
                  providers, and access support and information — all tailored for
                  you.
                </p>
                <p>We&rsquo;re here to support you every step of the way.</p>
              </div>
            </Step>
          )}

        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-[#FDECEA] px-4 py-3 text-[13.5px] font-medium text-[#B23A2E]"
          >
            {error}
          </p>
        )}

        <div className="mt-10 flex items-center justify-between">
          {step > 1 && step < TOTAL ? (
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep((s) => s - 1);
              }}
              className="text-[15px] text-ink underline-offset-4 hover:underline"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          <Button
            onClick={next}
            size="lg"
            variant="green"
            className={`min-w-[120px] ${
              step === 1 ? "!bg-[#3D3D3D] !text-white" : ""
            }`}
          >
            {step === TOTAL ? "Finish" : "Next"}
            {step !== TOTAL && step !== 1 && <ArrowRight size={17} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

function Step({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="fade-up">
      <h2 className="serif text-[38px] leading-tight tracking-[-0.01em]">{title}</h2>
      {sub && (
        <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-ink-soft">
          {sub}
        </p>
      )}
      <div className="mt-8">{children}</div>
    </div>
  );
}

function ChipGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            aria-pressed={on}
            className="rounded-full border-2 px-4 py-2.5 text-[14px] font-medium transition"
            style={{
              borderColor: on ? "#42C074" : "var(--line-strong)",
              background: on ? "var(--tint-green)" : "#fff",
              color: on ? "#0A7A3B" : "var(--ink)",
            }}
          >
            {on && <Check size={14} className="mr-1.5 inline" />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-6 w-11 rounded-full transition"
      style={{ background: checked ? "#42C074" : "#D6D6D6" }}
    >
      <span
        className="absolute top-0.5 block h-5 w-5 rounded-full bg-white transition-all"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
}

function UserGlyph({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3.2" />
      <path d="M6.2 18.4a6.4 6.4 0 0 1 11.6 0" />
    </svg>
  );
}

function PresetFace({ fg }: { fg: string }) {
  return (
    <svg viewBox="0 0 92 92" className="h-full w-full" aria-hidden>
      <circle cx="46" cy="38" r="15" fill={fg} opacity="0.9" />
      <path d="M20 82a26 26 0 0 1 52 0Z" fill={fg} opacity="0.65" />
    </svg>
  );
}

