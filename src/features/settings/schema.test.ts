import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { MSG } from "@/lib/rules/validation";
import {
  changeEmailSchema,
  changePasswordSchema,
  editProfileSchema,
  firstErrors,
  removalAppealSchema,
} from "./schema";

const profile = {
  firstName: "Annie",
  lastName: "Moss",
  handle: "hopeful_annie",
  showRealName: false,
  avatarHue: "green" as const,
  avatarPreset: 0,
  pronouns: "",
  pronounsSelf: "",
  aboutMe: "",
  myStory: "",
};

describe("settings schemas", () => {
  it("checks the new email with the PRD rule", () => {
    expect(firstErrors(changeEmailSchema, { email: "nope" })).toEqual({ email: MSG.email });
    expect(firstErrors(changeEmailSchema, { email: "a@b.co" })).toEqual({});
  });

  it("reports each password field once", () => {
    expect(firstErrors(changePasswordSchema, { current: "", next: "short", confirm: "" })).toEqual({
      current: "Enter your current password.",
      next: MSG.passwordShort,
      confirm: MSG.passwordsDiffer,
    });
    expect(
      firstErrors(changePasswordSchema, {
        current: "old-one",
        next: "a-new-secret",
        confirm: "a-new-secret",
      }),
    ).toEqual({});
  });

  it("checks the profile, leaving the handle to the service", () => {
    expect(
      firstErrors(editProfileSchema, {
        ...profile,
        lastName: " ",
        handle: "!!",
        pronouns: "Prefer to self-describe",
        aboutMe: "x".repeat(1001),
      }),
    ).toEqual({
      firstName: MSG.names,
      aboutMe: "About me can be up to 1,000 characters.",
      pronouns: MSG.pronounsSelf,
    });
    expect(editProfileSchema.safeParse(profile).success).toBe(true);
  });

  it("needs a reason to appeal, whatever is typed", () => {
    fc.assert(
      fc.property(fc.string(), (why) => {
        expect(removalAppealSchema.safeParse({ why }).success).toBe(why.trim() !== "");
      }),
    );
  });
});
