/* The shapes this feature's endpoints return. The domain model is shared in @/types/domain until
   the API spec lands; each feature re-exports the part it owns. */

export type {
  Comment,
  ContentStatus,
  Post,
  PostType,
  Source,
  Vote,
} from "@/types/domain";
export type { PostInput } from "./schema";
