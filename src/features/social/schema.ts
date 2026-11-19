/* Form schema for the report (and block) dialog (PRD §19). It only shapes the values: the service
   checks them (a reason, details for "Other", the hourly limit) and returns one message at a time,
   which the dialog shows exactly where it always has. */

import { z } from "zod";
import type { ReportReason } from "./types";

export const reportSchema = z.object({
  reason: z.array(z.custom<ReportReason>((v) => typeof v === "string")),
  details: z.string(),
  block: z.boolean(),
});
export type ReportInput = z.input<typeof reportSchema>;
