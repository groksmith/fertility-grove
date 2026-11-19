/* Form schemas for the Grove Guide and appointment questions (forms skill §1). Copy comes word for
   word from the screens and services that already showed it; rules that need the store (credits)
   stay with the service. */

import { z } from "zod";

/** The ask box. No client rules: an empty question is the service's ("Type a question first."). */
export const guideQuestionSchema = z.object({
  question: z.string(),
});
export type GuideQuestionInput = z.input<typeof guideQuestionSchema>;

/** "Not helpful" with an optional reason. */
export const guideRatingSchema = z.object({
  reason: z.string(),
});
export type GuideRatingInput = z.input<typeof guideRatingSchema>;

/** Make a new appointment question list. */
export const appointmentListSchema = z.object({
  type: z.string().superRefine((v, ctx) => {
    if (!v) ctx.addIssue({ code: "custom", message: "Choose the appointment type." });
  }),
  date: z.string(),
  onMind: z.string(),
});
export type AppointmentListInput = z.input<typeof appointmentListSchema>;

/** Edit or add one question. A blank question is ignored on submit, never flagged. */
export const appointmentQuestionSchema = z.object({
  text: z.string(),
});
export type AppointmentQuestionInput = z.input<typeof appointmentQuestionSchema>;

/** Share a list with a linked partner. */
export const appointmentShareSchema = z.object({
  access: z.array(z.enum(["View", "Edit"])),
});
export type AppointmentShareInput = z.input<typeof appointmentShareSchema>;
