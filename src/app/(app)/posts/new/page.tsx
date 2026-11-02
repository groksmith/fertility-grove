"use client";

/* Write a post (PRD §9). Fields, limits and messages follow the spec word for
   word. The first post asks the member to accept the community guidelines. */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useUnsavedGuard } from "@/components/UnsavedGuard";
import { Spot } from "@/components/art/Scenes";
import { useResult } from "@/components/Safety";
import {
  Button,
  Checkbox,
  ChipSelect,
  Choices,
  Counter,
  EmptyState,
  Field,
  Input,
  LinkButton,
  PageHeader,
  Panel,
  Select,
  Textarea,
  Toggle,
} from "@/components/ui";
import { act, validatePost, useStore } from "@/lib/store";
import { POST_TYPES, POST_TYPE_HELP, SOURCES, TOPIC_TAGS } from "@/lib/options";
import type { PostType, Source } from "@/lib/types";

const GUIDELINES = [
  "Share your own experience. Say when something is your opinion or came from your doctor.",
  "No medical advice about someone else's care, no selling, and no pressure.",
  "Keep pregnancy news in Success stories, so others can choose when to see it.",
  "Never share someone else's private information.",
  "If someone may be in danger, report it. We review those first.",
];

function Composer() {
  const params = useSearchParams();
  const router = useRouter();
  const s = useStore();
  const joinedGroups = s.groups.filter((g) => s.joined.includes(g.id) && g.status === "active");
  const pre = params.get("group") ?? "";
  const [groupId, setGroupId] = useState(joinedGroups.some((g) => g.id === pre) ? pre : "");
  const [type, setType] = useState<PostType[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [source, setSource] = useState<Source | "">("");
  const [sourceLink, setSourceLink] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [allowSharing, setAllowSharing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errs, setErrs] = useState<Record<string, string | undefined>>({});
  const [done, setDone] = useState<string | null>(null);
  const guard = useUnsavedGuard({ dirty: !done && !!(title.trim() || body.trim() || sourceLink.trim() || tags.length) });
  const { handle, ui } = useResult();

  const group = s.groups.find((g) => g.id === groupId);
  const membersOnly = group?.readAccess === "members-only";
  const clinician = false; // the demo member is not a verified clinician
  const sources = SOURCES.filter((x) => x !== "Clinician input" || clinician);

  if (joinedGroups.length === 0) {
    return (
      <EmptyState
        art="canopy"
        title="Join a group to write a post."
        body="Posts live inside groups, so the right people see them."
        action={<LinkButton href="/groups">Browse groups</LinkButton>}
      />
    );
  }

  if (done) {
    const p = s.posts.find((x) => x.id === done);
    return (
      <Panel className="mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center">
        <Spot kind="seedlings" size={200} />
        <h1 className="serif mt-4 text-[36px] leading-tight">Your post is up</h1>
        <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-ink-soft">
          {p?.status === "held"
            ? "We've held it for a moment so our team can check in. Only you can see it for now."
            : `It's in ${group?.name}. We'll let you know when someone replies.`}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <LinkButton href={`/posts/${done}`}>See your post</LinkButton>
          <LinkButton href="/home" variant="ghost">
            Back to your grove
          </LinkButton>
        </div>
        {ui}
      </Panel>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = { groupId, type: type[0] ?? "", title, body, source, sourceLink, tags, allowSharing: allowSharing && !membersOnly };
    const v: Record<string, string | undefined> = { ...validatePost(input) };
    if (!groupId) v.groupId = "Choose a group to post in.";
    if (title.length > 150) v.title = "Titles can be up to 150 characters.";
    if (body.length > 5000) v.body = "Posts can be up to 5,000 characters.";
    if (!s.me.guidelinesAccepted && !agreed) v.agreed = "Please accept the community guidelines to post.";
    setErrs(v);
    if (Object.values(v).some(Boolean)) {
      document.getElementById("post-errors")?.focus();
      return;
    }
    const r = act.posts.create(input);
    if (handle(r) && r.ok && r.id) setDone(r.id);
  };

  const errorList = Object.values(errs).filter(Boolean) as string[];

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        {errorList.length > 0 && (
          <div id="post-errors" tabIndex={-1} role="alert" className="rounded-[20px] bg-danger-soft px-5 py-4 text-[14px] text-danger outline-none">
            <p className="font-semibold">Check {errorList.length === 1 ? "this" : "these"} before posting:</p>
            <ul className="mt-1 list-disc pl-5">
              {Array.from(new Set(errorList)).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        <Panel className="space-y-6 p-5 sm:p-7">
          <Field label="Post in" error={errs.groupId}>
            <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Choose one of your groups</option>
              {joinedGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>
          <Choices legend="Post type" options={POST_TYPES} value={type} onChange={setType} error={!type.length ? errs.typeSource : undefined} />
          {type[0] && <p className="-mt-3 text-[13px] text-muted">{POST_TYPE_HELP[type[0]]}</p>}
          <Field label="Title" error={errs.title} counter={<Counter value={title} max={150} />}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you want to ask or share?" />
          </Field>
          <Field
            label="Your post"
            error={errs.body}
            counter={<Counter value={body} max={5000} />}
            hint="Bold, italic, lists and links are fine. No images."
          >
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
          </Field>
        </Panel>

        <Panel className="space-y-6 p-5 sm:p-7">
          <Field label="Source" error={!source ? errs.typeSource : undefined} hint="Where does what you're sharing come from?">
            <Select value={source} onChange={(e) => setSource(e.target.value as Source)}>
              <option value="">Choose a source</option>
              {sources.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field
            label="Source link"
            optional={source !== "From research or guidelines"}
            error={errs.sourceLink}
            hint="A full web address, starting with https://"
          >
            <Input value={sourceLink} onChange={(e) => setSourceLink(e.target.value)} inputMode="url" type="url" autoCapitalize="none" placeholder="https://" />
          </Field>
          <div>
            <p className="mb-2 flex items-baseline justify-between text-[14px] font-semibold">
              Topic tags <span className="tabular font-normal text-muted">{tags.length} / 5</span>
            </p>
            <ChipSelect label="Topic tags" options={TOPIC_TAGS} value={tags} onChange={setTags} max={5} />
          </div>
          {!membersOnly && (
            <Toggle
              checked={allowSharing}
              onChange={setAllowSharing}
              label="Allow sharing outside Fertility Grove"
              description="Lets members make a public link to this post. Comments are never shown outside."
            />
          )}
        </Panel>

        {!s.me.guidelinesAccepted && (
          <Panel className="p-5 sm:p-7">
            <h2 className="text-[16px] font-semibold">Before your first post</h2>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-ink-soft">
              {GUIDELINES.map((g) => (
                <li key={g} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {g}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Checkbox checked={agreed} onChange={setAgreed} error={errs.agreed}>
                I&apos;ve read and accept the community guidelines
              </Checkbox>
            </div>
          </Panel>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="lg">
            Post
          </Button>
          <Button variant="ghost" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>
      <aside className="space-y-4">
        <Panel className="p-5">
          <Spot kind="sprout" size={120} />
          <h2 className="mt-2 text-[16px] font-semibold">Getting good replies</h2>
          <ul className="mt-2 space-y-2 text-[14px] leading-relaxed text-ink-soft">
            <li>Say where you are: diagnosis, stage, what you&apos;ve tried.</li>
            <li>Pick the post type that matches what you need. Support needed and Just venting tell people you want kindness, not advice.</li>
            <li>Choose a source so readers know how much weight to give it.</li>
          </ul>
        </Panel>
        <Panel className="p-5 text-[14px] leading-relaxed text-ink-soft">
          If you&apos;re struggling right now, you can call or text <strong className="text-ink">988</strong> any time.{" "}
          <Link href="/help" className="font-semibold text-accent hover:underline">
            Crisis resources
          </Link>
        </Panel>
      </aside>
      {ui}
      {guard.ui}
    </form>
  );
}

export default function NewPostPage() {
  return (
    <>
      <PageHeader title="Write a post" lede="Ask, share or vent. Your post goes to one of your groups." />
      <Suspense>
        <Composer />
      </Suspense>
    </>
  );
}
