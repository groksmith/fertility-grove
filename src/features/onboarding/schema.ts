/* Form schema for the eight onboarding screens (PRD §5; forms skill §1, §3 multi-step). One
   unrefined base holds every answer; each screen's schema picks its fields and adds that screen's
   rules last. Messages come word for word from the PRD (`MSG` / `checks` in
   @/lib/rules/validation). */

import { z } from "zod";
import { checks, MSG } from "@/lib/rules/validation";

/** Unrefined base: every answer the onboarding form holds, typed as the profile stores it. */
export const onboardingFields = z.object({
  stages: z.array(z.string()),
  treatments: z.array(z.string()),
  nextDate: z.string(),
  healthConsent: z.boolean(),
  diagnoses: z.array(z.string()),
  otherDiagnosis: z.string(),
  paths: z.array(z.string()),
  gender: z.string(),
  genderSelf: z.string(),
  pronouns: z.string(),
  pronounsSelf: z.string(),
  ageRange: z.string(),
  zip: z.string(),
  lookingFor: z.array(z.string()),
  connectStyle: z.array(z.string()),
  community: z.enum(["womens", "partners", ""]),
  firstName: z.string(),
  lastName: z.string(),
  handle: z.string(),
  showRealName: z.boolean(),
  avatarHue: z.enum(["green", "coral", "yellow", "blue", "pink", "purple"]),
  avatarPreset: z.number(),
  aboutMe: z.string(),
  suggestMe: z.boolean(),
  messagePolicy: z.enum(["anyone", "following", "no-one"]),
  wantMentor: z.boolean(),
  showStories: z.boolean(),
  shareJourney: z.boolean(),
  notify: z.object({
    comments: z.boolean(),
    messages: z.boolean(),
    mentoring: z.boolean(),
    partner: z.boolean(),
    includeFollows: z.boolean(),
    pauseAll: z.boolean(),
  }),
});
export type OnboardingInput = z.input<typeof onboardingFields>;
type Field = keyof OnboardingInput;

/** The fields each screen asks for, in the order its error summary lists them. */
export const ONBOARDING_STEP_FIELDS = {
  1: ["stages", "healthConsent", "treatments", "nextDate"],
  2: ["diagnoses", "otherDiagnosis", "paths"],
  3: ["gender", "genderSelf", "pronouns", "pronounsSelf", "zip", "ageRange"],
  4: ["lookingFor", "connectStyle"],
  5: ["community"],
  6: ["firstName", "handle", "aboutMe", "lastName", "showRealName", "avatarHue", "avatarPreset"],
  7: ["suggestMe", "messagePolicy", "wantMentor", "showStories", "shareJourney", "notify"],
  8: [],
} as const satisfies Record<number, readonly Field[]>;

type Issue = [Field, string];

/* Each screen's rules, in the order the summary lists their messages. */
const step1 = (d: Pick<OnboardingInput, "stages" | "healthConsent">): Issue[] => {
  const e: Issue[] = [];
  if (!d.stages.length) e.push(["stages", MSG.selectOne]);
  if (!d.healthConsent) e.push(["healthConsent", MSG.consent]);
  return e;
};
const step2 = (d: Pick<OnboardingInput, "diagnoses" | "otherDiagnosis">): Issue[] =>
  d.diagnoses.includes("Other") && !d.otherDiagnosis.trim()
    ? [["otherDiagnosis", MSG.otherDiagnosis]]
    : [];
const step3 = (
  d: Pick<OnboardingInput, "gender" | "genderSelf" | "pronouns" | "pronounsSelf" | "zip">,
): Issue[] => {
  const e: Issue[] = [];
  if (!d.gender) e.push(["gender", MSG.gender]);
  if (d.gender === "Prefer to self-describe" && !d.genderSelf.trim())
    e.push(["genderSelf", MSG.genderSelf]);
  if (d.pronouns === "Prefer to self-describe" && !d.pronounsSelf.trim())
    e.push(["pronounsSelf", MSG.pronounsSelf]);
  const zip = checks.zip(d.zip);
  if (zip) e.push(["zip", zip]);
  return e;
};
const step4 = (d: Pick<OnboardingInput, "lookingFor">): Issue[] =>
  d.lookingFor.length ? [] : [["lookingFor", MSG.lookingFor]];
const step5 = (d: Pick<OnboardingInput, "community">): Issue[] =>
  d.community ? [] : [["community", MSG.community]];
const step6 = (
  d: Pick<OnboardingInput, "firstName" | "lastName" | "handle" | "aboutMe">,
): Issue[] => {
  const e: Issue[] = [];
  // One message for both names; it shows on First name.
  if (!d.firstName.trim() || !d.lastName.trim()) e.push(["firstName", MSG.names]);
  const h = checks.handle(d.handle);
  if (h) e.push(["handle", h]);
  if (d.aboutMe.length > 1000) e.push(["aboutMe", "About me can be up to 1,000 characters."]);
  return e;
};

function report(issues: Issue[], ctx: z.core.$RefinementCtx) {
  for (const [path, message] of issues) ctx.addIssue({ code: "custom", path: [path], message });
}

/** One schema per screen: the picked fields, then that screen's rules. */
export const onboardingStepSchemas = {
  1: onboardingFields
    .pick({ stages: true, treatments: true, nextDate: true, healthConsent: true })
    .superRefine((d, ctx) => report(step1(d), ctx)),
  2: onboardingFields
    .pick({ diagnoses: true, otherDiagnosis: true, paths: true })
    .superRefine((d, ctx) => report(step2(d), ctx)),
  3: onboardingFields
    .pick({
      gender: true,
      genderSelf: true,
      pronouns: true,
      pronounsSelf: true,
      ageRange: true,
      zip: true,
    })
    .superRefine((d, ctx) => report(step3(d), ctx)),
  4: onboardingFields
    .pick({ lookingFor: true, connectStyle: true })
    .superRefine((d, ctx) => report(step4(d), ctx)),
  5: onboardingFields.pick({ community: true }).superRefine((d, ctx) => report(step5(d), ctx)),
  6: onboardingFields
    .pick({
      firstName: true,
      lastName: true,
      handle: true,
      showRealName: true,
      avatarHue: true,
      avatarPreset: true,
      aboutMe: true,
    })
    .superRefine((d, ctx) => report(step6(d), ctx)),
  7: onboardingFields.pick({
    suggestMe: true,
    messagePolicy: true,
    wantMentor: true,
    showStories: true,
    shareJourney: true,
    notify: true,
  }),
};

/** The whole form: every screen's rules. The page validates only the current screen's fields
    (`ONBOARDING_STEP_FIELDS`) with `form.trigger`. */
export const onboardingSchema = onboardingFields.superRefine((d, ctx) => {
  for (const rules of [step1, step2, step3, step4, step5, step6]) report(rules(d), ctx);
});
