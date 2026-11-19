import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { MSG } from "@/lib/rules/validation";
import {
  ONBOARDING_STEP_FIELDS,
  type OnboardingInput,
  onboardingSchema,
  onboardingStepSchemas,
} from "./schema";

const blank: OnboardingInput = {
  stages: [],
  treatments: [],
  nextDate: "",
  healthConsent: false,
  diagnoses: [],
  otherDiagnosis: "",
  paths: [],
  gender: "",
  genderSelf: "",
  pronouns: "",
  pronounsSelf: "",
  ageRange: "",
  zip: "",
  lookingFor: [],
  connectStyle: [],
  community: "",
  firstName: "",
  lastName: "",
  handle: "",
  showRealName: false,
  avatarHue: "green",
  avatarPreset: -1,
  aboutMe: "",
  suggestMe: true,
  messagePolicy: "anyone",
  wantMentor: false,
  showStories: false,
  shareJourney: false,
  notify: {
    comments: true,
    messages: true,
    mentoring: true,
    partner: true,
    includeFollows: true,
    pauseAll: false,
  },
};

const filled: OnboardingInput = {
  ...blank,
  stages: ["Trying to conceive"],
  healthConsent: true,
  gender: "Female",
  zip: "94110",
  lookingFor: ["Support"],
  community: "womens",
  firstName: "Annie",
  lastName: "Moss",
  handle: "new_annie",
};

const issues = (r: { error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  r.error?.issues.map((i) => [i.path[0], i.message]) ?? [];

describe("onboarding schemas", () => {
  it("parses every screen's schema (no .pick on a refined object)", () => {
    for (const schema of Object.values(onboardingStepSchemas))
      expect(schema.safeParse(filled).success).toBe(true);
    expect(onboardingSchema.safeParse(filled).success).toBe(true);
  });

  it("reports each screen's messages in the summary's order", () => {
    expect(issues(onboardingStepSchemas[1].safeParse(blank))).toEqual([
      ["stages", MSG.selectOne],
      ["healthConsent", MSG.consent],
    ]);
    expect(issues(onboardingStepSchemas[2].safeParse({ ...blank, diagnoses: ["Other"] }))).toEqual([
      ["otherDiagnosis", MSG.otherDiagnosis],
    ]);
    expect(
      issues(
        onboardingStepSchemas[3].safeParse({
          ...blank,
          gender: "Prefer to self-describe",
          pronouns: "Prefer to self-describe",
        }),
      ),
    ).toEqual([
      ["genderSelf", MSG.genderSelf],
      ["pronounsSelf", MSG.pronounsSelf],
      ["zip", MSG.zip],
    ]);
    expect(issues(onboardingStepSchemas[4].safeParse(blank))).toEqual([
      ["lookingFor", MSG.lookingFor],
    ]);
    expect(issues(onboardingStepSchemas[5].safeParse(blank))).toEqual([
      ["community", MSG.community],
    ]);
    expect(
      issues(onboardingStepSchemas[6].safeParse({ ...blank, aboutMe: "x".repeat(1001) })),
    ).toEqual([
      ["firstName", MSG.names],
      ["handle", MSG.handleFormat],
      ["aboutMe", "About me can be up to 1,000 characters."],
    ]);
    expect(onboardingStepSchemas[7].safeParse(blank).success).toBe(true);
  });

  it("lists every reported field among its screen's fields", () => {
    for (const [step, schema] of Object.entries(onboardingStepSchemas)) {
      const fields: readonly string[] =
        ONBOARDING_STEP_FIELDS[Number(step) as keyof typeof ONBOARDING_STEP_FIELDS];
      for (const [path] of issues(schema.safeParse(blank))) expect(fields).toContain(path);
    }
  });

  it("never throws on any About me text", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 1200 }), (aboutMe) => {
        const r = onboardingStepSchemas[6].safeParse({ ...filled, aboutMe });
        expect(r.success).toBe(aboutMe.length <= 1000);
      }),
    );
  });
});
