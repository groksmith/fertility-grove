import { confirmed, fail, ok, type Result, set, uid } from "@/lib/mock-server";
import { detectCrisis } from "@/lib/rules/crisis";
import { MSG } from "@/lib/rules/validation";
import type { Source, StoryType } from "@/types/domain";

/* --------------------------------------------------------------- Stories */

export const storyService = {
  create(st: {
    type: StoryType | "";
    title: string;
    body: string;
    diagnoses: string[];
    whatHelped: string[];
    source: Source | "";
  }): Result {
    const gate = confirmed();
    if (gate) return gate;
    if (!st.type || !st.title.trim() || !st.body.trim() || !st.source)
      return fail(MSG.storyMissing);
    const id = uid("s");
    const crisis = detectCrisis(`${st.title} ${st.body}`);
    set((s) => ({
      ...s,
      stories: [
        {
          id,
          authorId: "me",
          type: st.type as StoryType,
          title: st.title.trim(),
          body: st.body.trim(),
          diagnoses: st.diagnoses,
          whatHelped: st.whatHelped,
          source: st.source as Source,
          minutesAgo: 0,
          up: 0,
          myVote: 0,
          comments: 0,
          saved: false,
        },
        ...s.stories,
      ],
    }));
    return ok({ id, crisis });
  },
  upvote(id: string): Result {
    const gate = confirmed();
    if (gate) return gate;
    set((s) => ({
      ...s,
      stories: s.stories.map((x) =>
        x.id === id && x.authorId !== "me"
          ? { ...x, myVote: x.myVote === 1 ? 0 : 1, up: x.up + (x.myVote === 1 ? -1 : 1) }
          : x,
      ),
    }));
    return ok();
  },
  toggleSave(id: string) {
    set((s) => ({
      ...s,
      stories: s.stories.map((x) => (x.id === id ? { ...x, saved: !x.saved } : x)),
    }));
  },
};
