/* Form schema for the search boxes (people by handle, the Learn library). The query is free text;
   each screen decides what it matches. */

import { z } from "zod";

export const searchSchema = z.object({
  q: z.string(),
});
export type SearchInput = z.input<typeof searchSchema>;
