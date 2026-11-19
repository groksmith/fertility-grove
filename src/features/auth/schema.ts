/* Form schemas for the auth screens (forms skill §1). Field messages come word for word from the
   PRD (`MSG` / `checks` in @/lib/rules/validation). */

import { z } from "zod";
import { checks, MSG } from "@/lib/rules/validation";

/** Sign in (PRD §4). No client-side rules on purpose: the error never says which field was wrong,
    so the service decides and the form shows its one message. */
export const signInSchema = z.object({
  email: z.string(),
  password: z.string(),
  keep: z.boolean(),
});
export type SignInInput = z.input<typeof signInSchema>;

/** Adds a rule's message (if it has one) as a custom issue: at `path` from an object refinement,
    on the field itself when `path` is left out. */
const flag = (ctx: z.RefinementCtx, message: string | undefined, path?: string) => {
  if (message) ctx.addIssue({ code: "custom", message, ...(path ? { path: [path] } : {}) });
};

/** Create account (PRD §4), email or Google. Mirrors `authService.signUp`: a Google sign-up skips
    the email and password rules. All rules run together so every message shows at once. */
export const signUpSchema = z
  .object({
    email: z.string(),
    password: z.string(),
    adult: z.boolean(),
    terms: z.boolean(),
    google: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.google) {
      flag(ctx, checks.email(v.email), "email");
      flag(ctx, checks.password(v.password), "password");
    }
    if (!v.adult) flag(ctx, MSG.age, "adult");
    if (!v.terms) flag(ctx, MSG.terms, "terms");
  });
export type SignUpInput = z.input<typeof signUpSchema>;

/** "Sign-ups are paused" (PRD §4): the email is optional, but checked when given. */
export const signUpWaitlistSchema = z.object({
  email: z.string().superRefine((v, ctx) => {
    if (v) flag(ctx, checks.email(v));
  }),
});
export type SignUpWaitlistInput = z.input<typeof signUpWaitlistSchema>;

/** The guest "leave your email" prompt (PRD §4), as `authService.joinWaitlist` checks it. */
export const joinWaitlistSchema = z.object({
  email: z.string().superRefine((v, ctx) => flag(ctx, checks.email(v))),
});
export type JoinWaitlistInput = z.input<typeof joinWaitlistSchema>;

/** Forgot password (PRD §4). */
export const forgotPasswordSchema = z.object({
  email: z.string().superRefine((v, ctx) => flag(ctx, checks.email(v))),
});
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

/** Choose a new password (PRD §4). Mirrors `authService.resetPassword`; both rules run together. */
export const resetPasswordSchema = z
  .object({ password: z.string(), confirm: z.string() })
  .superRefine((v, ctx) => {
    flag(ctx, checks.password(v.password), "password");
    if (v.password !== v.confirm) flag(ctx, MSG.passwordsDiffer, "confirm");
  });
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

/** Appeal a suspension (PRD §19). */
export const appealSchema = z.object({
  appeal: z.string().superRefine((v, ctx) => {
    if (!v.trim()) flag(ctx, "Tell us why this should be reviewed again.");
  }),
});
export type AppealInput = z.input<typeof appealSchema>;
