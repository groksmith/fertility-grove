// Barrel: named re-exports of what other layers consume.
export { type ReportInput, reportSchema } from "./schema";
export { peopleMatches } from "./selectors";
export { socialService } from "./service";
export type { Report, ReportReason } from "./types";
