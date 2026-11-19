/* Form schemas for mentoring (PRD §12; forms skill §1). Field messages come word for word from the
   PRD (`MSG` in @/lib/rules/validation). A request's rules stay with the service: the email gate
   and the open-request and two-mentor limits come from the store. */

import { z } from "zod";
import { MSG } from "@/lib/rules/validation";

/** Ask a mentor. The service decides (MSG.mentorMessage among its messages). */
export const mentorRequestSchema = z.object({
  message: z.string(),
  helpWith: z.array(z.string()),
});
export type MentorRequestInput = z.input<typeof mentorRequestSchema>;

/** Feedback after a connection ends. Both answers are optional. */
export const mentorFeedbackSchema = z.object({
  helpful: z.array(z.enum(["Yes", "Somewhat", "No"])),
  thanks: z.string(),
});
export type MentorFeedbackInput = z.input<typeof mentorFeedbackSchema>;

/** Mentor setup: bio, what I can help with, capacity and the guidelines. */
export const mentorSetupSchema = z.object({
  bio: z.string().superRefine((v, ctx) => {
    if (!v.trim()) ctx.addIssue({ code: "custom", message: MSG.mentorBio });
  }),
  helpsWith: z.array(z.string()).superRefine((v, ctx) => {
    if (!v.length) ctx.addIssue({ code: "custom", message: MSG.mentorHelps });
  }),
  capacity: z.number(),
  agreed: z.boolean().superRefine((v, ctx) => {
    if (!v) ctx.addIssue({ code: "custom", message: MSG.mentorGuidelines });
  }),
});
export type MentorSetupInput = z.input<typeof mentorSetupSchema>;
