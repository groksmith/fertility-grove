/* Form schemas for posts and comments (PRD §9, §10). Field messages come word for word from the
   PRD (`MSG` / `checks` in @/lib/rules/validation); the composer's own limits keep their wording. */

import { z } from "zod";
import { checks, MSG } from "@/lib/rules/validation";
import type { PostType, Source } from "@/types/domain";

/** What `postService.create` accepts. */
export interface PostInput {
  groupId: string;
  type: PostType | "";
  title: string;
  body: string;
  source: Source | "";
  sourceLink: string;
  tags: string[];
  allowSharing: boolean;
  showToVisitors: boolean;
}

const source = z.custom<Source | "">((v) => typeof v === "string");

/** Unrefined base: the composer's fields as the form holds them (`type` is the Choices array). */
export const postFields = z.object({
  groupId: z.string(),
  type: z.array(z.custom<PostType>((v) => typeof v === "string")),
  title: z.string(),
  body: z.string(),
  source,
  sourceLink: z.string(),
  tags: z.array(z.string()),
  allowSharing: z.boolean(),
  showToVisitors: z.boolean(),
  /** First post only; the page checks it against the member's state. */
  agreed: z.boolean(),
});

/** Write a post. One message per field; when a field breaks two rules the later one wins, and the
    fields are reported in this order (the composer's error summary lists them so). */
export const createPostSchema = postFields.superRefine((p, ctx) => {
  const errs: Partial<Record<keyof typeof p, string>> = {};
  if (!p.title.trim()) errs.title = MSG.postTitle;
  if (!p.body.trim()) errs.body = MSG.postBody;
  // Source and topic tags are optional; only the post type is required.
  if (!p.type[0]) errs.type = MSG.postType;
  if (p.source === "From research or guidelines" && !p.sourceLink.trim())
    errs.sourceLink = MSG.researchLink;
  else {
    const l = checks.link(p.sourceLink);
    if (l) errs.sourceLink = l;
  }
  if (!p.groupId) errs.groupId = "Choose a group to post in.";
  if (p.title.length > 150) errs.title = "Titles can be up to 150 characters.";
  if (p.body.length > 5000) errs.body = "Posts can be up to 5,000 characters.";
  for (const [key, message] of Object.entries(errs))
    ctx.addIssue({ code: "custom", path: [key], message });
});
export type CreatePostInput = z.input<typeof createPostSchema>;

/** A comment or reply. */
export const commentSchema = z.object({
  body: z.string().superRefine((v, ctx) => {
    if (!v.trim()) ctx.addIssue({ code: "custom", message: MSG.commentEmpty });
    else if (v.length > 2000)
      ctx.addIssue({ code: "custom", message: "Comments can be up to 2,000 characters." });
  }),
  source,
});
export type CommentInput = z.input<typeof commentSchema>;
