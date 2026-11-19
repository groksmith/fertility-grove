/* Form schema for sharing a story (PRD §10). The required fields are the service's rule
   (`MSG.storyMissing`), so the schema only shapes the values. */

import { z } from "zod";
import type { Source, StoryType } from "@/types/domain";

export const createStorySchema = z.object({
  type: z.array(z.custom<StoryType>((v) => typeof v === "string")),
  title: z.string(),
  body: z.string(),
  diagnoses: z.array(z.string()),
  whatHelped: z.array(z.string()),
  source: z.custom<Source | "">((v) => typeof v === "string"),
});
export type CreateStoryInput = z.input<typeof createStorySchema>;
