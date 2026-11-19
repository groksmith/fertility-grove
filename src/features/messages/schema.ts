/* Form schema for the message composer and for editing a sent message (PRD §14). The service
   decides what can be sent, so the schema only shapes the value. */

import { z } from "zod";

export const messageSchema = z.object({
  body: z.string(),
});
export type MessageInput = z.input<typeof messageSchema>;
