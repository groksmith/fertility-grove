/* Form schemas for the family space (PRD §7, §7a; forms skill §1). Field messages come word for
   word from the PRD (`MSG` in @/lib/rules/validation); the partner invite's rules stay with the
   service, which decides between its messages. */

import { z } from "zod";
import { MSG } from "@/lib/rules/validation";

/** Invite a partner. No client rules: the service checks the email, self-invites and links. */
export const familyInviteSchema = z.object({
  email: z.string(),
  note: z.string(),
});
export type FamilyInviteInput = z.input<typeof familyInviteSchema>;

/** Share an item with the linked partner. Nothing chosen means the submit is ignored. */
export const familyShareSchema = z.object({
  item: z.string(),
  access: z.array(z.enum(["View", "Edit"])),
  note: z.string(),
});
export type FamilyShareInput = z.input<typeof familyShareSchema>;

/** A family note, new or edited. */
export const familyNoteSchema = z.object({
  title: z.string().superRefine((v, ctx) => {
    if (!v.trim()) ctx.addIssue({ code: "custom", message: MSG.noteTitle });
  }),
  body: z.string().superRefine((v, ctx) => {
    if (!v.trim()) ctx.addIssue({ code: "custom", message: MSG.noteBody });
  }),
});
export type FamilyNoteInput = z.input<typeof familyNoteSchema>;
