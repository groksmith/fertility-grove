import { describe, expect, it } from "vitest";
import { MSG } from "@/lib/rules/validation";
import { familyInviteSchema, familyNoteSchema } from "./schema";

describe("family schemas", () => {
  it("needs a title and a body, with the PRD messages", () => {
    const r = familyNoteSchema.safeParse({ title: " ", body: "" });
    expect(r.error?.issues.map((i) => [i.path[0], i.message])).toEqual([
      ["title", MSG.noteTitle],
      ["body", MSG.noteBody],
    ]);
    expect(familyNoteSchema.safeParse({ title: "Plan", body: "Ask about it" }).success).toBe(true);
  });

  it("leaves the invite's email to the service", () => {
    expect(familyInviteSchema.safeParse({ email: "", note: "" }).success).toBe(true);
  });
});
