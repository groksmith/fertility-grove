/* The shapes this feature's endpoints return. The domain model is shared in @/types/domain until
   the API spec lands; each feature re-exports the part it owns. */

export type { Me } from "@/lib/mock-server";
export type {
  Hue,
  SunlightEvent,
  TreeLevel,
} from "@/types/domain";
