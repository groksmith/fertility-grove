import { describe, expect, it } from "vitest";
import { MSG } from "@/lib/rules/validation";
import { mentorRequestSchema, mentorSetupSchema } from "./schema";

describe("mentor schemas", () => {
  it("flags every missing setup answer with the PRD messages", () => {
    const r = mentorSetupSchema.safeParse({ bio: "  ", helpsWith: [], capacity: 3, agreed: false });
    expect(r.error?.issues.map((i) => [i.path[0], i.message])).toEqual([
      ["bio", MSG.mentorBio],
      ["helpsWith", MSG.mentorHelps],
      ["agreed", MSG.mentorGuidelines],
    ]);
  });

  it("accepts a complete setup", () => {
    const ok = { bio: "Two rounds of IVF", helpsWith: ["IVF"], capacity: 2, agreed: true };
    expect(mentorSetupSchema.safeParse(ok).success).toBe(true);
  });

  it("leaves a request's message to the service", () => {
    expect(mentorRequestSchema.safeParse({ message: "", helpWith: [] }).success).toBe(true);
  });
});
