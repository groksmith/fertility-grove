/* Form schemas for the member's own account: Settings (email, password) and the Dashboard (profile
   edit, appealing a removal). Messages come word for word from the PRD (`MSG` / `checks` in
   @/lib/rules/validation). Rules that need the store (a handle's cooldown or owner) stay with the
   service. */

import { z } from "zod";
import { checks, MSG } from "@/lib/rules/validation";

/** Change email. */
export const changeEmailSchema = z.object({
  email: z.string().superRefine((v, ctx) => {
    const e = checks.email(v);
    if (e) ctx.addIssue({ code: "custom", message: e });
  }),
});
export type ChangeEmailInput = z.input<typeof changeEmailSchema>;

/** Unrefined base for changing the password. */
export const changePasswordFields = z.object({
  current: z.string(),
  next: z.string(),
  confirm: z.string(),
});

/** Change password: current is required, the new one follows the sign-up rule and must match. */
export const changePasswordSchema = changePasswordFields.superRefine((v, ctx) => {
  if (!v.current)
    ctx.addIssue({ code: "custom", path: ["current"], message: "Enter your current password." });
  const p = checks.password(v.next);
  if (p) ctx.addIssue({ code: "custom", path: ["next"], message: p });
  if (v.next !== v.confirm)
    ctx.addIssue({ code: "custom", path: ["confirm"], message: MSG.passwordsDiffer });
});
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

/** Unrefined base for the profile editor (PRD §6), keyed as the profile stores it. */
export const editProfileFields = z.object({
  firstName: z.string(),
  lastName: z.string(),
  handle: z.string(),
  showRealName: z.boolean(),
  avatarHue: z.enum(["green", "coral", "yellow", "blue", "pink", "purple"]),
  avatarPreset: z.number(),
  pronouns: z.string(),
  pronounsSelf: z.string(),
  aboutMe: z.string(),
  myStory: z.string(),
});

/** Edit profile. The handle is checked by `settingsService.changeHandle` (it knows the cooldown);
    the self-described pronouns message shows on Pronouns. */
export const editProfileSchema = editProfileFields.superRefine((v, ctx) => {
  if (!v.firstName.trim() || !v.lastName.trim())
    ctx.addIssue({ code: "custom", path: ["firstName"], message: MSG.names });
  if (v.aboutMe.length > 1000)
    ctx.addIssue({
      code: "custom",
      path: ["aboutMe"],
      message: "About me can be up to 1,000 characters.",
    });
  if (v.pronouns === "Prefer to self-describe" && !v.pronounsSelf.trim())
    ctx.addIssue({ code: "custom", path: ["pronouns"], message: MSG.pronounsSelf });
});
export type EditProfileInput = z.input<typeof editProfileSchema>;

/** Appeal a moderator's removal (PRD §19). */
export const removalAppealSchema = z.object({
  why: z.string().superRefine((v, ctx) => {
    if (!v.trim())
      ctx.addIssue({ code: "custom", message: "Tell us why this should be reviewed again." });
  }),
});
export type RemovalAppealInput = z.input<typeof removalAppealSchema>;

/** Validates synchronously and returns the first message per top-level field, as `zodResolver`
    would. For saves that must answer at once (the unsaved-changes guard's "Save and leave"). */
export function firstErrors<T extends z.ZodType>(
  schema: T,
  values: z.input<T>,
): Partial<Record<keyof z.input<T> & string, string>> {
  const r = schema.safeParse(values);
  const out: Partial<Record<string, string>> = {};
  if (!r.success)
    for (const issue of r.error.issues) {
      const key = String(issue.path[0] ?? "root");
      out[key] ??= issue.message;
    }
  return out;
}
