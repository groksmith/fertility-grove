"use client";

/* Write a post (PRD §9). Fields, limits and messages follow the spec word for
   word. The first post asks the member to accept the community guidelines. */

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Spot } from "@/components/art/Scenes";
import { offersVisitors, PostVisibility } from "@/components/common/PostVisibility";
import { useResult } from "@/components/common/Safety";
import { EmptyState, FormField, PageHeader, useUnsavedGuard } from "@/components/shared";
import { Button, LinkButton } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChipSelect } from "@/components/ui/chip-select";
import { Choices } from "@/components/ui/choices";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { POST_TYPE_HELP, POST_TYPES, SOURCES, TOPIC_TAGS } from "@/config/options";
import { createPostSchema, type PostInput, postService } from "@/features/posts";
import { useStore } from "@/lib/mock-server";

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
  // Errors show on Post and stay until the next Post; the summary takes focus, not a field.
  const form = useForm({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      groupId: joinedGroups.some((g) => g.id === pre) ? pre : "",
      type: [],
      title: "",
      body: "",
      source: "",
      sourceLink: "",
      tags: [],
      allowSharing: false,
      showToVisitors: false,
      agreed: false,
    },
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const [groupId, type, title, body, source, sourceLink, tags, allowSharing, showToVisitors] =
    useWatch({
      control: form.control,
      name: [
        "groupId",
        "type",
        "title",
        "body",
        "source",
        "sourceLink",
        "tags",
        "allowSharing",
        "showToVisitors",
      ],
    });
  const errs = form.formState.errors;
  const [done, setDone] = useState<string | null>(null);
  const guard = useUnsavedGuard({
    dirty: !done && !!(title.trim() || body.trim() || sourceLink.trim() || tags.length),
  });
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
          <LinkButton href="/feed" variant="ghost">
            Back to your feed
          </LinkButton>
        </div>
        {ui}
      </Panel>
    );
  }

  /** The guidelines rule reads the member's state, so it runs beside the schema, last. */
  const missingAgreement = (agreed: boolean) => {
    if (s.me.guidelinesAccepted || agreed) return false;
    form.setError("agreed", { message: "Please accept the community guidelines to post." });
    return true;
  };
  const focusSummary = () => document.getElementById("post-errors")?.focus();

  const submit = form.handleSubmit(
    (values) => {
      if (missingAgreement(values.agreed)) return focusSummary();
      const visitors = values.showToVisitors && offersVisitors(group);
      const input: PostInput = {
        groupId: values.groupId,
        type: values.type[0] ?? "",
        title: values.title,
        body: values.body,
        source: values.source,
        sourceLink: values.sourceLink,
        tags: values.tags,
        allowSharing: (values.allowSharing || visitors) && !membersOnly,
        showToVisitors: visitors,
      };
      const r = postService.create(input);
      if (handle(r) && r.ok && r.id) setDone(r.id);
    },
    () => {
      missingAgreement(form.getValues("agreed"));
      focusSummary();
    },
  );

  const errorList = Object.values(errs)
    .map((e) => e?.message)
    .filter(Boolean) as string[];

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="min-w-0 space-y-4">
        {errorList.length > 0 && (
          <div
            id="post-errors"
            tabIndex={-1}
            role="alert"
            className="rounded-[20px] bg-danger-soft px-5 py-4 text-[14px] text-danger outline-none"
          >
            <p className="font-semibold">
              Check {errorList.length === 1 ? "this" : "these"} before posting:
            </p>
            <ul className="mt-1 list-disc pl-5">
              {Array.from(new Set(errorList)).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        <Panel className="space-y-6 p-5 sm:p-7">
          <FormField
            form={form}
            name="groupId"
            label="Post in"
            kind="select"
            options={[
              { value: "", label: "Choose one of your groups" },
              ...joinedGroups.map((g) => ({ value: g.id, label: g.name })),
            ]}
            onValueChange={(id) => {
              // A group that isn't visible to guests can't offer it: clear it.
              if (!offersVisitors(s.groups.find((g) => g.id === id)))
                form.setValue("showToVisitors", false);
            }}
          />
          <Controller
            control={form.control}
            name="type"
            render={({ field, fieldState }) => (
              <Choices
                legend="Post type"
                options={POST_TYPES}
                value={field.value}
                onChange={field.onChange}
                error={!field.value.length ? fieldState.error?.message : undefined}
              />
            )}
          />
          {type[0] && <p className="-mt-3 text-[13px] text-muted">{POST_TYPE_HELP[type[0]]}</p>}
          <FormField
            form={form}
            name="title"
            label="Title"
            counterMax={150}
            placeholder="What do you want to ask or share?"
          />
          <FormField
            form={form}
            name="body"
            label="Your post"
            kind="textarea"
            counterMax={5000}
            hint="Bold, italic, lists and links are fine. No images."
            rows={8}
          />
        </Panel>

        <Panel className="space-y-6 p-5 sm:p-7">
          <FormField
            form={form}
            name="source"
            label="Source"
            kind="select"
            optional
            hint="Where does what you're sharing come from?"
            options={[
              { value: "", label: "No source" },
              ...sources.map((x) => ({ value: x, label: x })),
            ]}
          />
          {/* Controller, not FormField: this input is type="url", which FormField doesn't set. */}
          <Controller
            control={form.control}
            name="sourceLink"
            render={({ field, fieldState }) => (
              <Field
                label="Source link"
                optional={source !== "From research or guidelines"}
                error={fieldState.error?.message}
                hint="A full web address, starting with https://"
              >
                <Input
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputMode="url"
                  type="url"
                  autoCapitalize="none"
                  placeholder="https://"
                />
              </Field>
            )}
          />
          <div>
            <p className="mb-2 flex items-baseline justify-between text-[14px] font-semibold">
              <span>
                Topic tags<span className="font-normal text-muted"> (optional)</span>
              </span>
              <span className="tabular font-normal text-muted">{tags.length} / 5</span>
            </p>
            <Controller
              control={form.control}
              name="tags"
              render={({ field }) => (
                <ChipSelect
                  label="Topic tags"
                  options={TOPIC_TAGS}
                  value={field.value}
                  onChange={field.onChange}
                  max={5}
                />
              )}
            />
          </div>
          <PostVisibility
            group={group}
            type={type[0]}
            allowSharing={allowSharing}
            showToVisitors={showToVisitors}
            onChange={(v) => {
              form.setValue("allowSharing", v.allowSharing);
              form.setValue("showToVisitors", v.showToVisitors);
            }}
          />
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
              <Controller
                control={form.control}
                name="agreed"
                render={({ field, fieldState }) => (
                  <Checkbox
                    checked={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  >
                    I&apos;ve read and accept the community guidelines
                  </Checkbox>
                )}
              />
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
            <li>
              Pick the post type that matches what you need. Support needed and Just venting tell
              people you want kindness, not advice.
            </li>
            <li>
              Adding a source, if you have one, helps readers know how much weight to give it.
            </li>
          </ul>
        </Panel>
        <Panel className="p-5 text-[14px] leading-relaxed text-ink-soft">
          If you&apos;re struggling right now, you can call or text{" "}
          <strong className="text-ink">988</strong> any time.{" "}
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
      <PageHeader
        title="Write a post"
        lede="Ask, share or vent. Your post goes to one of your groups."
      />
      <Suspense>
        <Composer />
      </Suspense>
    </>
  );
}
