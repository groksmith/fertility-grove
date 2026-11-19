// Barrel: named re-exports of what other layers consume.
export { GUIDE_STARTERS } from "@/lib/mock-server/seed/social";
export {
  type AppointmentListInput,
  type AppointmentQuestionInput,
  type AppointmentShareInput,
  appointmentListSchema,
  appointmentQuestionSchema,
  appointmentShareSchema,
  type GuideQuestionInput,
  type GuideRatingInput,
  guideQuestionSchema,
  guideRatingSchema,
} from "./schema";
export { guideService } from "./service";
export type {
  AppointmentList,
  AppointmentQuestion,
  GuideChat,
  GuideCitation,
  GuideReplyKind,
  GuideTurn,
} from "./types";
