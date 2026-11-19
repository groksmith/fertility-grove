import { describe, expect, it } from "vitest";
import { MSG } from "@/lib/rules/validation";
import { type CreatePostInput, commentSchema, createPostSchema } from "./schema";

const valid: CreatePostInput = {
  groupId: "g1",
  type: ["Question"],
  title: "Day 3 transfer?",
  body: "Has anyone had a day 3 transfer?",
  source: "",
  sourceLink: "",
  tags: [],
  allowSharing: false,
  showToVisitors: false,
  agreed: false,
};

/** [field, message] in the order the composer's error summary lists them. */
const errors = (v: Partial<CreatePostInput>) =>
  createPostSchema.safeParse({ ...valid, ...v }).error?.issues.map((i) => [i.path[0], i.message]);

describe("createPostSchema", () => {
  it("accepts a complete post", () => {
    expect(createPostSchema.safeParse(valid).success).toBe(true);
  });

  it("flags the PRD's required fields, then the group", () => {
    expect(errors({ groupId: "", type: [], title: " ", body: "" })).toEqual([
      ["title", MSG.postTitle],
      ["body", MSG.postBody],
      ["type", MSG.postType],
      ["groupId", "Choose a group to post in."],
    ]);
  });

  it("needs a link for research, and a full https address for any link", () => {
    expect(errors({ source: "From research or guidelines" })).toEqual([
      ["sourceLink", MSG.researchLink],
    ]);
    expect(errors({ sourceLink: "example.com" })).toEqual([["sourceLink", MSG.badLink]]);
    expect(errors({ sourceLink: "http://example.com" })).toEqual([["sourceLink", MSG.badLink]]);
    expect(errors({ sourceLink: "https://example.com" })).toBeUndefined();
  });

  it("applies the length limits, after the group", () => {
    expect(errors({ groupId: "", title: "t".repeat(151), body: "b".repeat(5001) })).toEqual([
      ["groupId", "Choose a group to post in."],
      ["title", "Titles can be up to 150 characters."],
      ["body", "Posts can be up to 5,000 characters."],
    ]);
    expect(errors({ title: "t".repeat(150), body: "b".repeat(5000) })).toBeUndefined();
  });

  it("lets a length limit replace the empty message in its place", () => {
    expect(errors({ groupId: "", title: " ".repeat(151) })).toEqual([
      ["title", "Titles can be up to 150 characters."],
      ["groupId", "Choose a group to post in."],
    ]);
  });
});

describe("commentSchema", () => {
  const msg = (body: string) =>
    commentSchema.safeParse({ body, source: "" }).error?.issues.map((i) => i.message);

  it("needs something to say, up to 2,000 characters", () => {
    expect(msg("  ")).toEqual([MSG.commentEmpty]);
    expect(msg("x".repeat(2001))).toEqual(["Comments can be up to 2,000 characters."]);
    expect(msg("x".repeat(2000))).toBeUndefined();
  });
});
