/* Form schema for the Help page's "Contact support" form (PRD §4). The email message comes word for
   word from the PRD (`checks` in @/lib/rules/validation). */

import { z } from "zod";
import { checks } from "@/lib/rules/validation";

export const contactSupportSchema = z.object({
  email: z.string().superRefine((v, ctx) => {
    const message = checks.email(v);
    if (message) ctx.addIssue({ code: "custom", message });
  }),
  message: z.string().superRefine((v, ctx) => {
    if (!v.trim()) ctx.addIssue({ code: "custom", message: "Tell us how we can help." });
  }),
});
export type ContactSupportInput = z.input<typeof contactSupportSchema>;
