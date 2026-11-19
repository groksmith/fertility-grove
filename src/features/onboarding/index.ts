// Barrel: named re-exports of what other layers consume.
export {
  ONBOARDING_STEP_FIELDS,
  type OnboardingInput,
  onboardingFields,
  onboardingSchema,
  onboardingStepSchemas,
} from "./schema";
export { onboardingService } from "./service";
export type { CommunityId } from "./types";
