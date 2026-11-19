"use client";

/* Onboarding, PRD v2.0 §5: eight screens, progress saved after each one.
   Next is always enabled and shows what's missing; Skip appears only on
   screens 2 and 7. The grove beside the form gains one piece per answer. */

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CircleHelp, Lock, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Controller, type UseFormReturn, useForm, useWatch } from "react-hook-form";
import { GroupCover } from "@/components/art/Brand";
import { Backdrop } from "@/components/art/Cozy";
import { PlantingScene } from "@/components/art/PlantingScene";
import { TreeArt } from "@/components/art/Tree";
import { Name, Person } from "@/components/common/Person";
import { ReferFriend } from "@/components/common/ReferFriend";
import { useSignOut } from "@/components/common/SignOut";
import { Logo } from "@/components/icons/Logo";
import { Avatar, AvatarPicker, FormField, HueSwatches } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Choices } from "@/components/ui/choices";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import {
  AGE_RANGES,
  COMMUNITIES,
  CONNECT_STYLES,
  DIAGNOSES,
  GENDERS,
  JOURNEY_STAGES,
  LOOKING_FOR,
  PATHS,
  PRONOUNS,
  TREATMENTS,
} from "@/config/options";
import { journey, meAsMember } from "@/features/auth";
import { groupMatches, groupService } from "@/features/groups";
import { GUIDE_STARTERS } from "@/features/guide";
import { ARTICLES } from "@/features/learn";
import { mentorMatches } from "@/features/mentors";
import {
  ONBOARDING_STEP_FIELDS,
  type OnboardingInput,
  onboardingSchema,
  onboardingService,
  onboardingStepSchemas,
} from "@/features/onboarding";
import { partnerService } from "@/features/partner";
import { firstErrors, settingsService } from "@/features/settings";
import { peopleMatches, socialService } from "@/features/social";
import { get, type Me, useHydrated, useStore } from "@/lib/mock-server";
import { checks } from "@/lib/rules/validation";
import type { CommunityId, MessagePolicy } from "@/types/domain";

/* ------------------------------------------------------------- Screens */

type Screen = { title: string; why: string; intro?: string };

// A non-empty tuple, so SCREENS[0] is always a Screen.
const SCREENS: [Screen, ...Screen[]] = [
  {
    title: "Where are you in your fertility journey?",
    intro:
      "A few questions so we can match you with the right people, groups and information. Only you see your answers unless you choose to share them.",
    why: "We use this to match you. Only you see it.",
  },
  {
    title: "Has a doctor named anything specific?",
    why: "This helps us find people with the same diagnosis. It stays private unless you choose to show it.",
  },
  {
    title: "A little about you",
    why: "Your gender, age range and ZIP code are never shown to anyone. Pronouns show only if you add them.",
  },
  {
    title: "What are you looking for?",
    why: "This shapes what we suggest first. You can change it any time.",
  },
  {
    title: "Your community",
    why: "Content and tools are the same in both communities; only the space differs. You can switch later.",
  },
  {
    title: "Your profile",
    why: "This is how other members see you. You post under your handle unless you choose your real name.",
  },
  {
    title: "Connections and notifications",
    why: "You can change any of this later. We will never send more than one activity email a day.",
  },
  {
    title: "You're all set",
    why: "Everything here was picked for where you are. Each suggestion says why.",
  },
];

type Draft = Pick<
  Me,
  | "stages"
  | "treatments"
  | "nextDate"
  | "healthConsent"
  | "diagnoses"
  | "otherDiagnosis"
  | "paths"
  | "gender"
  | "genderSelf"
  | "pronouns"
  | "pronounsSelf"
  | "ageRange"
  | "zip"
  | "lookingFor"
  | "connectStyle"
  | "community"
  | "firstName"
  | "lastName"
  | "handle"
  | "showRealName"
  | "avatarHue"
  | "avatarPreset"
  | "aboutMe"
  | "suggestMe"
  | "messagePolicy"
  | "wantMentor"
  | "showStories"
  | "shareJourney"
  | "notify"
>;

function initialDraft(): Draft {
  const s = get();
  const me = s.me;
  const partner = !!s.invitedBy;
  const d: Draft = {
    stages: me.stages.length ? me.stages : partner ? ["I am a partner / spouse"] : [],
    treatments: me.treatments,
    nextDate: me.nextDate,
    healthConsent: me.healthConsent,
    diagnoses: me.diagnoses,
    otherDiagnosis: me.otherDiagnosis,
    paths: me.paths,
    gender: me.gender,
    genderSelf: me.genderSelf,
    pronouns: me.pronouns,
    pronounsSelf: me.pronounsSelf,
    ageRange: me.ageRange,
    zip: me.zip,
    lookingFor: me.lookingFor.length
      ? me.lookingFor
      : partner
        ? ["Support as a partner, or for my partner"]
        : [],
    // Saved before this was multi-select: a single answer becomes a one-item list.
    connectStyle: Array.isArray(me.connectStyle)
      ? me.connectStyle
      : me.connectStyle
        ? [me.connectStyle]
        : [],
    community: me.community || (partner ? "partners" : ""),
    firstName: me.firstName,
    lastName: me.lastName,
    handle: me.handle,
    showRealName: me.showRealName,
    avatarHue: me.avatarHue,
    avatarPreset: me.avatarPreset,
    aboutMe: me.aboutMe,
    suggestMe: me.suggestMe,
    messagePolicy: me.messagePolicy,
    wantMentor: me.wantMentor,
    showStories: me.showStories,
    shareJourney: me.shareJourney,
    notify: me.notify,
  };
  // Screen 7 defaults follow screen 4 until screen 7 has been saved once.
  if (s.step <= 7) {
    d.wantMentor = d.lookingFor.includes("A mentor who has been through it");
    d.showStories = d.lookingFor.includes("Hope from success stories");
  }
  return d;
}

/** Which community to suggest, and why (PRD §5 screen 5). */
function suggestion(d: Pick<Draft, "stages" | "gender">): {
  pick: CommunityId | null;
  why: string;
} {
  const partner = d.stages.includes("I am a partner / spouse");
  const women = ["Female", "Transgender female"].includes(d.gender);
  const men = ["Male", "Transgender male"].includes(d.gender);
  if (women && !partner)
    return { pick: "womens", why: "Suggested because of the gender identity you chose." };
  if ((men || partner) && !women)
    return {
      pick: "partners",
      why: partner
        ? "Suggested because you're joining as a partner."
        : "Suggested because of the gender identity you chose.",
    };
  return { pick: null, why: "Both spaces are open to you. Choose the one that feels right." };
}

/** What each screen writes to the profile. */
function patchFor(step: number, d: Draft): Partial<Me> {
  switch (step) {
    case 1:
      return {
        stages: d.stages,
        treatments: d.stages.includes("Pursuing treatment") ? d.treatments : [],
        nextDate: d.stages.includes("Pursuing treatment") ? d.nextDate : "",
        healthConsent: d.healthConsent,
      };
    case 2:
      return {
        diagnoses: d.diagnoses,
        otherDiagnosis: d.diagnoses.includes("Other") ? d.otherDiagnosis.trim() : "",
        paths: d.paths,
      };
    case 3:
      return {
        gender: d.gender,
        genderSelf: d.genderSelf.trim(),
        pronouns: d.pronouns,
        pronounsSelf: d.pronounsSelf.trim(),
        ageRange: d.ageRange,
        zip: d.zip.trim(),
      };
    case 4:
      return { lookingFor: d.lookingFor, connectStyle: d.connectStyle };
    case 5:
      return { community: d.community };
    case 6:
      return {
        firstName: d.firstName.trim(),
        lastName: d.lastName.trim(),
        handle: d.handle.trim(),
        showRealName: d.showRealName,
        avatarHue: d.avatarHue,
        avatarPreset: d.avatarPreset,
        aboutMe: d.aboutMe.trim(),
      };
    case 7:
      return {
        suggestMe: d.suggestMe,
        messagePolicy: d.messagePolicy,
        wantMentor: d.wantMentor,
        showStories: d.showStories,
        shareJourney: d.shareJourney,
        notify: d.notify,
      };
    default:
      return {};
  }
}

/* ---------------------------------------------------------- Step bodies */

type Form = UseFormReturn<OnboardingInput>;
type StepProps = { form: Form };

function Step1({ form }: StepProps) {
  const treating = useWatch({ control: form.control, name: "stages" }).includes(
    "Pursuing treatment",
  );
  return (
    <div className="space-y-7">
      <Controller
        control={form.control}
        name="stages"
        render={({ field, fieldState }) => (
          <Choices
            legend="Journey stage"
            multi
            options={JOURNEY_STAGES}
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      {treating && (
        <div className="space-y-6 rounded-[20px] border border-line bg-panel p-5">
          <Controller
            control={form.control}
            name="treatments"
            render={({ field }) => (
              <Choices
                legend="Which treatment?"
                multi
                options={TREATMENTS}
                value={field.value}
                onChange={field.onChange}
                hint="Optional."
              />
            )}
          />
          <Controller
            control={form.control}
            name="nextDate"
            render={({ field }) => (
              <Field label="Next treatment or cycle date" optional hint="Only you see this.">
                <Input
                  type="date"
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  className="max-w-[240px]"
                />
              </Field>
            )}
          />
        </div>
      )}
      <div className="rounded-[20px] border border-line bg-panel p-5">
        <Controller
          control={form.control}
          name="healthConsent"
          render={({ field, fieldState }) => (
            <Toggle
              checked={field.value}
              onChange={field.onChange}
              label="I agree that Fertility Grove uses my answers about my health to match me with people, groups and information."
              description={
                <>
                  Read our{" "}
                  <Link
                    href="/privacy#health-data"
                    className="font-semibold underline"
                    target="_blank"
                  >
                    Consumer Health Data Privacy Policy
                  </Link>
                  . You can withdraw this any time in Settings.
                </>
              }
              error={fieldState.error?.message}
            />
          )}
        />
      </div>
    </div>
  );
}

function Step2({ form }: StepProps) {
  const diagnoses = useWatch({ control: form.control, name: "diagnoses" });
  return (
    <div className="space-y-7">
      <Controller
        control={form.control}
        name="diagnoses"
        render={({ field }) => (
          <Choices
            legend="Diagnosis"
            multi
            options={DIAGNOSES}
            value={field.value}
            onChange={field.onChange}
            hint="Optional. Pick everything a doctor has named."
          />
        )}
      />
      {diagnoses.includes("Other") && (
        <FormField
          form={form}
          name="otherDiagnosis"
          label="Other diagnosis"
          counterMax={100}
          maxLength={100}
        />
      )}
      <Controller
        control={form.control}
        name="paths"
        render={({ field }) => (
          <Choices
            legend="Path to parenthood"
            multi
            options={PATHS}
            value={field.value}
            onChange={field.onChange}
            hint="Optional."
          />
        )}
      />
    </div>
  );
}

function Step3({ form }: StepProps) {
  const [gender, pronouns] = useWatch({ control: form.control, name: ["gender", "pronouns"] });
  return (
    <div className="space-y-7">
      <Controller
        control={form.control}
        name="gender"
        render={({ field, fieldState }) => (
          <Choices
            legend="Gender identity"
            options={GENDERS}
            value={field.value ? [field.value] : []}
            onChange={([g]) => field.onChange(g)}
            error={fieldState.error?.message}
            hint="Private. Never shown on your profile."
          />
        )}
      />
      {gender === "Prefer to self-describe" && (
        <FormField
          form={form}
          name="genderSelf"
          label="How you describe your gender identity"
          counterMax={50}
          maxLength={50}
        />
      )}
      <Controller
        control={form.control}
        name="pronouns"
        render={({ field }) => (
          <Choices
            legend="Pronouns"
            options={PRONOUNS}
            value={field.value ? [field.value] : []}
            onChange={([p]) => field.onChange(p)}
            hint="Optional. Shown next to your name if you add them."
            columns={3}
          />
        )}
      />
      {pronouns === "Prefer to self-describe" && (
        <FormField
          form={form}
          name="pronounsSelf"
          label="Your pronouns"
          counterMax={30}
          maxLength={30}
        />
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          form={form}
          name="ageRange"
          kind="select"
          label="Age range"
          optional
          hint="Never shown."
          options={[
            { value: "", label: "Choose" },
            ...AGE_RANGES.map((a) => ({ value: a, label: a })),
          ]}
        />
        <FormField
          form={form}
          name="zip"
          label="ZIP code"
          hint="Never shown. Helps us match you with people in your region."
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={10}
        />
      </div>
    </div>
  );
}

function Step4({ form }: StepProps) {
  return (
    <div className="space-y-7">
      <Controller
        control={form.control}
        name="lookingFor"
        render={({ field, fieldState }) => (
          <Choices
            legend="I'm looking for"
            multi
            options={LOOKING_FOR}
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="connectStyle"
        render={({ field }) => (
          <Choices
            legend="How I like to connect"
            multi
            options={CONNECT_STYLES}
            value={field.value}
            onChange={field.onChange}
            hint="Optional."
          />
        )}
      />
    </div>
  );
}

function Step5({ form }: StepProps) {
  const [stages, gender] = useWatch({ control: form.control, name: ["stages", "gender"] });
  const { pick, why } = suggestion({ stages, gender });
  const order: CommunityId[] =
    pick === "partners" ? ["partners", "womens"] : ["womens", "partners"];
  return (
    <Controller
      control={form.control}
      name="community"
      render={({ field, fieldState }) => (
        <fieldset>
          <legend className="sr-only">Community</legend>
          <p className="mb-4 text-[15px] text-ink-soft">{why}</p>
          <div className="grid gap-3">
            {order.map((id) => {
              const on = field.value === id;
              const c = COMMUNITIES[id];
              return (
                <label
                  key={id}
                  className={`press flex cursor-pointer gap-4 rounded-[20px] border-2 bg-panel p-5 ${on ? "border-accent" : "border-transparent hover:border-line-strong"}`}
                >
                  <input
                    type="radio"
                    name="community"
                    className="sr-only"
                    checked={on}
                    onChange={() => field.onChange(id)}
                  />
                  <span
                    aria-hidden
                    className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? "border-accent bg-accent" : "border-[var(--grey-300)]"}`}
                  >
                    {on && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  <span>
                    <span className="flex flex-wrap items-center gap-2 text-[18px] font-semibold text-ink">
                      {c.name}
                      {pick === id && (
                        <span className="rounded-full bg-green-tint px-2.5 py-0.5 text-[12px] font-semibold text-green-ink">
                          Suggested for you
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-[15px] leading-relaxed text-ink-soft">
                      {c.blurb}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {fieldState.error?.message && (
            <p role="alert" className="mt-3 text-[13px] font-semibold text-danger">
              {fieldState.error.message}
            </p>
          )}
        </fieldset>
      )}
    />
  );
}

function Step6({ form, touched, touch }: StepProps & { touched: boolean; touch: () => void }) {
  const [
    firstName,
    lastName,
    handle,
    showRealName,
    avatarHue,
    avatarPreset,
    pronouns,
    pronounsSelf,
    aboutMe,
  ] = useWatch({
    control: form.control,
    name: [
      "firstName",
      "lastName",
      "handle",
      "showRealName",
      "avatarHue",
      "avatarPreset",
      "pronouns",
      "pronounsSelf",
      "aboutMe",
    ],
  });
  const live = handle ? checks.handle(handle) : undefined;
  const preview = {
    ...meAsMember(get()),
    firstName: firstName || "Your",
    lastInitial: (lastName || " ").charAt(0).trim() || "N",
    handle: handle || "your_handle",
    showRealName,
    avatarHue,
    pronouns:
      pronouns && !["Prefer not to say", "Prefer to self-describe"].includes(pronouns)
        ? pronouns
        : pronouns === "Prefer to self-describe"
          ? pronounsSelf || undefined
          : undefined,
    badges: [],
    level: "Seed" as const,
    sunlight: 0,
  };
  const initial = firstName ? `${firstName} ${(lastName || "")[0] ?? ""}.` : "Annie M.";
  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField
          form={form}
          name="firstName"
          label="First name"
          autoComplete="given-name"
          maxLength={50}
        />
        <FormField
          form={form}
          name="lastName"
          label="Last name"
          hint="Only your initial is ever shown."
          autoComplete="family-name"
          maxLength={50}
        />
      </div>
      <Controller
        control={form.control}
        name="handle"
        render={({ field, fieldState }) => {
          const handleErr = fieldState.error?.message ?? (touched ? live : undefined);
          return (
            <Field
              label="Handle"
              error={handleErr}
              hint={
                !handleErr
                  ? "3 to 30 characters: lowercase letters, numbers and underscores, starting with a letter."
                  : undefined
              }
            >
              <div className="relative">
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-3.5 grid place-items-center text-[15px] text-muted"
                >
                  @
                </span>
                <Input
                  name={field.name}
                  ref={field.ref}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  onBlur={() => {
                    field.onBlur();
                    touch();
                  }}
                  placeholder="hopeful_annie"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={30}
                  className="pl-8"
                />
              </div>
            </Field>
          );
        }}
      />

      <Controller
        control={form.control}
        name="showRealName"
        render={({ field }) => (
          <fieldset>
            <legend className="mb-2 text-[14px] font-semibold text-ink">How your name shows</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                {
                  real: false,
                  title: "Show my handle instead",
                  body: `Members see @${handle || "your_handle"}.`,
                },
                { real: true, title: "Show my real name", body: `Members see ${initial}` },
              ].map((o) => {
                const on = field.value === o.real;
                return (
                  <label
                    key={o.title}
                    className={`press cursor-pointer rounded-[14px] border-2 bg-panel p-4 ${on ? "border-accent" : "border-transparent hover:border-line-strong"}`}
                  >
                    <input
                      type="radio"
                      name="display"
                      className="sr-only"
                      checked={on}
                      onChange={() => field.onChange(o.real)}
                    />
                    <span className="block text-[15px] font-semibold text-ink">{o.title}</span>
                    <span className="mt-0.5 block text-[14px] text-muted">{o.body}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      />

      <fieldset>
        <legend className="mb-2 text-[14px] font-semibold text-ink">
          Photo or avatar <span className="font-normal text-muted">(optional)</span>
        </legend>
        <Controller
          control={form.control}
          name="avatarPreset"
          render={({ field }) => (
            <AvatarPicker
              member={{ ...preview, avatarHue }}
              value={field.value}
              onChange={field.onChange}
              size={48}
            />
          )}
        />
        <Controller
          control={form.control}
          name="avatarHue"
          render={({ field }) => <HueSwatches value={field.value} onChange={field.onChange} />}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled
          title="Photo upload isn't available in the prototype"
          className="mt-3"
        >
          Upload from my computer
        </Button>
        {!showRealName && avatarPreset < 0 && (
          <p className="mt-2 text-[13px] text-muted">
            An avatar keeps your handle private and still helps people recognise you.
          </p>
        )}
      </fieldset>

      <FormField
        form={form}
        name="aboutMe"
        kind="textarea"
        label="About me"
        optional
        counterMax={1000}
        rows={4}
        placeholder="What brought you here, where you are, what you're hoping to find"
      />

      <div>
        <p className="mb-2 text-[14px] font-semibold text-ink">How others see you</p>
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <Avatar member={preview} size={48} />
            <Name member={preview} link={false} />
          </div>
          {aboutMe && (
            <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-ink-soft">{aboutMe}</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Step7({ form }: StepProps) {
  const policies: { id: MessagePolicy; label: string }[] = [
    { id: "anyone", label: "Anyone" },
    { id: "following", label: "Members I follow" },
    { id: "no-one", label: "No one" },
  ];
  return (
    <div className="space-y-4">
      <Panel className="space-y-6 p-5 sm:p-6">
        <h2 className="text-[16px] font-semibold">Connections</h2>
        <Controller
          control={form.control}
          name="suggestMe"
          render={({ field }) => (
            <Toggle
              checked={field.value}
              onChange={field.onChange}
              label="Suggest me to members on my path"
              description="People with a similar journey may see you in their matches."
            />
          )}
        />
        <div>
          <label htmlFor="who-msg" className="text-[15px] font-semibold text-ink">
            Who can message me
          </label>
          <p className="mt-0.5 text-[14px] text-muted">
            Others can still send a message request you can accept or delete.
          </p>
          <Controller
            control={form.control}
            name="messagePolicy"
            render={({ field }) => (
              <Select
                id="who-msg"
                name={field.name}
                ref={field.ref}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value as MessagePolicy)}
                onBlur={field.onBlur}
                className="mt-2 max-w-[280px]"
              >
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>
        <Controller
          control={form.control}
          name="wantMentor"
          render={({ field }) => (
            <Toggle
              checked={field.value}
              onChange={field.onChange}
              label="I'd like a mentor"
              description="We'll suggest members who have been through it."
            />
          )}
        />
        <Controller
          control={form.control}
          name="showStories"
          render={({ field }) => (
            <Toggle
              checked={field.value}
              onChange={field.onChange}
              label="Show success stories in my feed"
              description="Off means stories stay in their own space."
            />
          )}
        />
        <Controller
          control={form.control}
          name="shareJourney"
          render={({ field }) => (
            <Toggle
              checked={field.value}
              onChange={field.onChange}
              label="Show my diagnosis, stage and path on my profile"
              description="Off by default. Matching still works when this is off."
            />
          )}
        />
      </Panel>
      <Panel className="space-y-6 p-5 sm:p-6">
        <h2 className="text-[16px] font-semibold">Email</h2>
        <Controller
          control={form.control}
          name="notify.comments"
          render={({ field }) => (
            <Toggle
              checked={field.value}
              onChange={field.onChange}
              label="Comments and replies on my posts"
              description="In your daily update."
            />
          )}
        />
        <Controller
          control={form.control}
          name="notify.messages"
          render={({ field }) => (
            <Toggle
              checked={field.value}
              onChange={field.onChange}
              label="New direct messages"
              description="In your daily update."
            />
          )}
        />
        <Controller
          control={form.control}
          name="notify.includeFollows"
          render={({ field }) => (
            <Toggle
              checked={field.value}
              onChange={field.onChange}
              label="Include follows, levels and matches in my daily update"
            />
          )}
        />
      </Panel>
    </div>
  );
}

function Step8({ finish, preview }: { finish: (to: string) => void; preview: boolean }) {
  const s = useStore();
  const groups = groupMatches(s, 5);
  const people = peopleMatches(s, 3);
  const mentors = s.me.wantMentor ? mentorMatches(s, 3) : [];
  const j = journey(s);
  const articles = ARTICLES.filter((a) => a.diagnoses.some((d) => j.diagnoses.includes(d)))
    .concat(ARTICLES)
    .filter((a, i, all) => all.indexOf(a) === i)
    .slice(0, 3);
  const starters =
    GUIDE_STARTERS[j.diagnoses.find((d) => GUIDE_STARTERS[d]) ?? "default"] ??
    GUIDE_STARTERS.default;
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteErr, setInviteErr] = useState<string>();
  const [invited, setInvited] = useState(false);
  const showInvite = !s.invitedBy && !s.partner.linked;

  // Screen 8 completes onboarding as it opens: the personal invite link is
  // behind the onboarding gate (PRD §5, §10).
  useEffect(() => {
    if (!preview) onboardingService.completeOnboarding();
  }, [preview]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[20px] border border-line bg-white p-5">
        <div className="flex items-center gap-4">
          <TreeArt level="Seed" size={104} animate title="Seed" />
          <div>
            <p className="text-[17px] font-semibold text-ink">
              You&apos;ve planted your Seed in Fertility Grove.
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">
              Your tree grows with Sunlight, each time another member finds you helpful: Seed, Bush,
              Tree, Blossom Tree, Orange Tree.
            </p>
          </div>
        </div>
        <div className="mt-5 border-t border-line pt-5">
          <ReferFriend />
        </div>
      </div>

      {groups.length > 0 && (
        <Panel className="p-5 sm:p-6" aria-labelledby="g8">
          <h2 id="g8" className="text-[16px] font-semibold">
            Groups for you
          </h2>
          <ul className="mt-3 space-y-3">
            {groups.map(({ group, why }) => {
              const joined = s.joined.includes(group.id);
              return (
                <li key={group.id} className="flex items-center gap-3">
                  <GroupCover group={group} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{group.name}</p>
                    <p className="truncate text-[13px] text-muted">{why}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={joined ? "quiet" : "secondary"}
                    aria-pressed={joined}
                    onClick={() => groupService.toggleJoin(group.id)}
                  >
                    {joined ? "Joined" : "Join"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {people.length > 0 && (
        <Panel className="p-5 sm:p-6" aria-labelledby="p8">
          <h2 id="p8" className="text-[16px] font-semibold">
            People on your path
          </h2>
          <ul className="mt-3 space-y-3">
            {people.map(({ member, why }) => {
              const on = s.following.includes(member.id);
              return (
                <li key={member.id}>
                  <Person member={member} sub={why}>
                    <Button
                      size="sm"
                      variant={on ? "quiet" : "secondary"}
                      aria-pressed={on}
                      onClick={() => socialService.toggleFollow(member.id)}
                    >
                      {on ? "Following" : "Follow"}
                    </Button>
                  </Person>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {mentors.length > 0 && (
        <Panel className="p-5 sm:p-6" aria-labelledby="m8">
          <h2 id="m8" className="text-[16px] font-semibold">
            Mentors who have been there
          </h2>
          <ul className="mt-3 space-y-4">
            {mentors.map(({ member, why }) => (
              <li key={member.id}>
                <Person member={member} sub={why} />
                {member.mentor && (
                  <p className="mt-1.5 pl-[52px] text-[14px] leading-relaxed text-ink-soft line-clamp-2">
                    {member.mentor.bio}
                  </p>
                )}
                <div className="mt-2 pl-[52px]">
                  <Button size="sm" variant="ghost" onClick={() => finish(`/u/${member.handle}`)}>
                    View profile
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel className="p-5 sm:p-6" aria-labelledby="r8">
        <h2 id="r8" className="text-[16px] font-semibold">
          Suggested readings
        </h2>
        <ul className="mt-3 space-y-3">
          {articles.map((a) => {
            const saved = s.savedArticles.includes(a.slug);
            return (
              <li key={a.slug} className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted">
                    {j.diagnoses.some((d) => a.diagnoses.includes(d))
                      ? `Matched on ${a.diagnosis.toLowerCase()}. `
                      : "A good place to start. "}
                    {a.summary}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="ghost" onClick={() => finish(`/learn/${a.slug}`)}>
                    Read
                  </Button>
                  <Button
                    size="sm"
                    variant={saved ? "quiet" : "secondary"}
                    aria-pressed={saved}
                    onClick={() => settingsService.saveArticle(a.slug)}
                  >
                    {saved ? "Saved" : "Save"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel className="p-5 sm:p-6" aria-labelledby="q8">
        <h2 id="q8" className="flex items-center gap-2 text-[16px] font-semibold">
          <Sparkles size={17} className="text-blue-ink" aria-hidden /> Ask the Grove Guide
        </h2>
        <p className="mt-1 text-[14px] leading-relaxed text-muted">
          Answers come from our clinician-reviewed library. You can also ask about information you
          upload, like test results or a letter from your clinic.
        </p>
        <ul className="mt-3 space-y-2">
          {starters.map((q) => (
            <li key={q}>
              <button
                type="button"
                onClick={() => finish(`/guide?q=${encodeURIComponent(q)}`)}
                className="press w-full rounded-[14px] bg-blue-tint px-4 py-3 text-left text-[15px] font-medium text-blue-ink hover:brightness-[0.98]"
              >
                {q}
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      {showInvite && (
        <Panel className="p-5 sm:p-6" aria-labelledby="i8">
          <h2 id="i8" className="text-[16px] font-semibold">
            Invite your partner
          </h2>
          <p className="mt-1 text-[14px] leading-relaxed text-muted">
            They get their own private account. You choose what to share with them.
          </p>
          {invited ? (
            <p role="status" className="mt-3 text-[15px] font-semibold text-green-ink">
              Invite sent to {inviteEmail}.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap items-start gap-2">
              <div className="min-w-[220px] flex-1">
                <Field label="Partner's email" error={inviteErr}>
                  <Input
                    type="email"
                    autoComplete="off"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </Field>
              </div>
              <Button
                variant="secondary"
                className="sm:mt-[30px]"
                onClick={() => {
                  if (preview) {
                    toast("Preview only: nothing was sent");
                    return;
                  }
                  const r = partnerService.invite(inviteEmail, "");
                  if (!r.ok) setInviteErr(r.error);
                  else setInvited(true);
                }}
              >
                Send invite
              </Button>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Page */

function OnboardingStep() {
  const params = useParams<{ step: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const s = useStore();
  const step = Math.min(8, Math.max(1, Number(params.step) || 1));
  const preview = search.get("preview") === "1";
  // Arriving on screen 8 completes onboarding there, so stay on it until Finish.
  const [onFinal, setOnFinal] = useState(false);
  if (hydrated && step === 8 && s.step === 8 && !onFinal) setOnFinal(true);

  // Signed out mid-onboarding: sign in, and onboarding resumes where it stopped.
  const target = !hydrated
    ? null
    : !s.signedIn && !preview
      ? "/login"
      : s.step >= 9 && !preview && !onFinal
        ? "/feed"
        : step > s.step && !preview
          ? `/onboarding/${s.step}`
          : null;

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (!hydrated || target) return <div className="min-h-dvh" aria-busy="true" />;
  return <StepView key={step} step={step} preview={preview} />;
}

function StepView({ step, preview }: { step: number; preview: boolean }) {
  const router = useRouter();
  const signOut = useSignOut();
  const firstName = useStore((s) => s.me.firstName);
  const [initial] = useState<Draft>(initialDraft);
  // Errors show only after Next and clear on the next change (below); the summary takes focus.
  const form = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: initial,
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const [handleTouched, setHandleTouched] = useState(false);
  const summary = useRef<HTMLDivElement>(null);
  const screen = SCREENS[step - 1] ?? SCREENS[0];
  const q = preview ? "?preview=1" : "";
  const fields: readonly (keyof OnboardingInput)[] =
    ONBOARDING_STEP_FIELDS[step as keyof typeof ONBOARDING_STEP_FIELDS] ?? [];

  // Any change clears every error, as each answer may fix more than one.
  useEffect(
    () =>
      form.subscribe({
        formState: { values: true },
        callback: () => {
          if (Object.keys(form.formState.errors).length) form.clearErrors();
        },
      }),
    [form],
  );

  const go = (n: number) => router.push(`/onboarding/${n}${q}`);

  // Validated synchronously, as before, so the summary shows in the same frame as the click and
  // takes focus on the next one.
  const next = () => {
    const schema = onboardingStepSchemas[step as keyof typeof onboardingStepSchemas] as
      | typeof onboardingSchema
      | undefined;
    const e = schema ? firstErrors(schema, form.getValues()) : {};
    form.clearErrors();
    for (const [name, message] of Object.entries(e))
      if (message) form.setError(name as keyof OnboardingInput, { message });
    if (Object.keys(e).length) {
      setHandleTouched(true);
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    if (!preview) onboardingService.save(step, patchFor(step, form.getValues()));
    go(step + 1);
  };

  const skip = () => {
    // Skipping saves nothing from the screen, except screen 7, which keeps its defaults.
    if (!preview) {
      if (step === 2) onboardingService.save(2, {}, ["diagnosis", "path"]);
      else onboardingService.save(7, patchFor(7, initialDraft()));
    }
    go(step + 1);
  };

  const finish = (to: string) => {
    if (!preview) {
      onboardingService.completeOnboarding();
      // Screen 8 already celebrated the Seed; don't repeat it on Home.
      settingsService.acknowledgeLevelUp();
    }
    router.push(to);
  };

  const title = step === 8 ? `You're all set, ${firstName || "friend"}!` : screen.title;
  const errors = form.formState.errors;
  const errList = fields
    .map((f) => errors[f]?.message)
    .filter((m): m is string => typeof m === "string" && m !== "");

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)]">
      <div className="flex min-h-dvh flex-col px-4 pt-[max(12px,env(safe-area-inset-top))] sm:px-8 lg:px-14">
        <header>
          <div className="flex h-14 items-center justify-between gap-4">
            <Logo height={38} priority />
            <div className="flex items-center gap-4 text-[14px] font-semibold text-ink-soft">
              <Link href="/help" className="inline-flex items-center gap-1.5 hover:text-ink">
                <CircleHelp size={16} aria-hidden />
                Help
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-danger hover:underline hover:underline-offset-4"
                onClick={signOut.ask}
              >
                <LogOut size={16} aria-hidden />
                Sign out
              </button>
              {signOut.ui}
            </div>
          </div>

          <div
            className="mt-2"
            aria-label={`Step ${step} of 8`}
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={8}
            aria-valuenow={step}
          >
            <div className="flex gap-1.5">
              {Array.from({ length: 8 }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < step ? "bg-accent" : "bg-line"}`}
                />
              ))}
            </div>
            <p className="mt-2 text-[13px] text-muted">Step {step} of 8</p>
          </div>
        </header>

        <div className="relative -mx-4 mt-4 h-32 overflow-hidden sm:-mx-8 lg:hidden" aria-hidden>
          <PlantingScene step={step} compact />
        </div>

        <main className="mx-auto w-full max-w-[600px] flex-1 py-8 lg:py-12">
          <h1 className="serif text-[36px] leading-[1.08] text-ink sm:text-[44px]">{title}</h1>
          {screen.intro && (
            <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">{screen.intro}</p>
          )}
          <p className="mt-3 flex items-start gap-2 text-[14px] leading-snug text-muted">
            <Lock size={15} className="mt-0.5 shrink-0" aria-hidden />
            {screen.why}
          </p>

          {errList.length > 0 && (
            <div
              ref={summary}
              tabIndex={-1}
              role="alert"
              className="mt-6 rounded-[14px] bg-danger-soft px-4 py-3 text-[14px] text-danger outline-none"
            >
              <p className="font-semibold">
                {errList.length === 1
                  ? "One thing needs your attention"
                  : `${errList.length} things need your attention`}
              </p>
              <ul className="mt-1 list-disc pl-5">
                {errList.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <form
            noValidate
            className="mt-8"
            onSubmit={(e) => {
              e.preventDefault();
              if (step < 8) next();
              else finish("/feed");
            }}
          >
            {step === 1 && <Step1 form={form} />}
            {step === 2 && <Step2 form={form} />}
            {step === 3 && <Step3 form={form} />}
            {step === 4 && <Step4 form={form} />}
            {step === 5 && <Step5 form={form} />}
            {step === 6 && (
              <Step6 form={form} touched={handleTouched} touch={() => setHandleTouched(true)} />
            )}
            {step === 7 && <Step7 form={form} />}
            {step === 8 && <Step8 finish={finish} preview={preview} />}

            <div className="sticky bottom-0 -mx-4 mt-8 flex items-center gap-2 bg-ground/95 px-4 py-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:bg-transparent sm:px-0">
              {step >= 2 && step <= 7 && (
                <Button variant="ghost" onClick={() => go(step - 1)}>
                  <ArrowLeft size={17} /> Back
                </Button>
              )}
              <span className="flex-1" />
              {(step === 2 || step === 7) && (
                <Button variant="ghost" onClick={skip}>
                  Skip
                </Button>
              )}
              <Button type="submit">{step === 8 ? "Finish" : "Next"}</Button>
            </div>
          </form>
        </main>
      </div>
      <aside className="sticky top-0 hidden h-dvh p-4 lg:block" aria-hidden>
        <div className="relative h-full overflow-hidden rounded-[20px]">
          <Backdrop kind="auth" wash />
          <PlantingScene step={step} />
        </div>
      </aside>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <OnboardingStep />
    </Suspense>
  );
}
