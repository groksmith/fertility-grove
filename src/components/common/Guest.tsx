"use client";

/* Guest browsing pieces (PRD v1.2 §10): the sign-up prompt that answers
   anything a guest can't do, and the public post card. Guests read; voting,
   replying, saving, sharing, following, joining, messaging and opening a
   profile all open the prompt, and nothing is saved. A signed-in member on a
   guest page goes to the real thing instead. */

import { zodResolver } from "@hookform/resolvers/zod";
import { Bookmark, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Name } from "@/components/common/Person";
import { Avatar, FormField, SourceLabel, TypeChip, VoteControl } from "@/components/shared";
import { Button, LinkButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Panel } from "@/components/ui/panel";
import { authService, joinWaitlistSchema, signUpStatus } from "@/features/auth";
import { allowsDownvote, type PublicPost } from "@/features/posts";
import { plural, timeAgo } from "@/lib/format";
import { useStore } from "@/lib/mock-server";

/** Run `memberHref` for members; for guests, open the sign-up prompt. */
export function useGuestAction() {
  const router = useRouter();
  const s = useStore();
  const [open, setOpen] = useState(false);
  const ask = (memberHref: string) => {
    if (s.signedIn && s.step >= 9) return router.push(memberHref);
    // TODO(api): GET /api/v1/auth/sign-up-status.
    if (!signUpStatus(s).isInviteOnly) return router.push("/signup");
    setOpen(true);
  };
  return { ask, ui: <SignUpPrompt open={open} onClose={() => setOpen(false)} /> };
}

function SignUpPrompt({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Checked on submit only; the message stays until the next submit, and focus stays put.
  const form = useForm({
    resolver: zodResolver(joinWaitlistSchema),
    defaultValues: { email: "" },
    reValidateMode: "onSubmit",
    shouldFocusError: false,
  });
  const [done, setDone] = useState<string>();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Join Fertility Grove to take part"
      description="Fertility Grove is invite-only during the beta. Ask a member for an invite link, or leave your email and we'll tell you when it opens."
    >
      {done ? (
        <p
          role="status"
          className="rounded-[14px] bg-green-tint px-4 py-3 text-[15px] leading-relaxed text-ink"
        >
          Thank you. We&apos;ll email {done} as soon as sign-up opens.
        </p>
      ) : (
        <form
          noValidate
          className="space-y-4"
          onSubmit={form.handleSubmit(({ email }) => {
            // TODO(api): POST /api/v1/auth/sign-up-waitlist.
            const r = authService.joinWaitlist(email);
            if (r.ok) setDone(email.trim());
            else form.setError("email", { message: r.error });
          })}
        >
          <FormField
            form={form}
            name="email"
            label="Your email"
            kind="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
          />
          <Button type="submit">Let me know</Button>
        </form>
      )}
      <p className="mt-5 text-[14px] text-muted">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-accent underline">
          Sign in
        </Link>
      </p>
    </Dialog>
  );
}

/** The author line guests see: display identity, tree, pronouns and badges.
    The name and avatar open the prompt, never a profile. */
export function PublicByline({
  item,
  ask,
  size = 40,
}: {
  item: PublicPost;
  ask: (href: string) => void;
  size?: number;
}) {
  const { author, post } = item;
  const profile = author.id === "me" ? "/dashboard" : `/u/${author.handle}`;
  return (
    <div className="flex min-w-0 items-start gap-3">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={() => ask(profile)}
        className="shrink-0 rounded-full"
      >
        <Avatar member={author} size={size} />
      </button>
      <div className="min-w-0 flex-1 text-[14px]">
        <button
          type="button"
          onClick={() => ask(profile)}
          className="max-w-full text-left hover:[&_.truncate]:underline"
        >
          <Name member={author} link={false} />
        </button>
        <p className="text-[13px] text-muted">{timeAgo(post.minutesAgo)} ago</p>
      </div>
    </div>
  );
}

/** A post in the public feed or on a public group page. */
export function PublicPostCard({
  item,
  ask,
  showGroup = true,
}: {
  item: PublicPost;
  ask: (href: string) => void;
  showGroup?: boolean;
}) {
  const { post, group, replies } = item;
  return (
    <Panel as="article" className="p-5 sm:p-6">
      <PublicByline item={item} ask={ask} />
      <Link href={`/p/${post.id}`} className="group mt-4 block">
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <TypeChip type={post.type} />
          {showGroup && <span className="text-[13px] text-muted">{group.name}</span>}
        </div>
        <h2 className="text-[18px] leading-snug font-semibold text-ink group-hover:underline">
          {post.title}
        </h2>
        <p className="mt-1.5 line-clamp-3 text-[15px] leading-relaxed text-ink-soft">{post.body}</p>
      </Link>
      <footer className="mt-4 flex flex-wrap items-center gap-2">
        <VoteControl
          up={post.up}
          down={post.down}
          my={0}
          allowDown={allowsDownvote(post)}
          onVote={() => ask(`/posts/${post.id}`)}
        />
        <Link
          href={`/p/${post.id}`}
          className="press inline-flex h-9 items-center gap-1.5 rounded-full bg-raised px-3 text-[14px] font-semibold text-ink-soft hover:text-ink"
        >
          <MessageSquare size={16} aria-hidden />
          <span className="tabular">{plural(replies, "reply", "replies")}</span>
        </Link>
        <button
          type="button"
          onClick={() => ask(`/posts/${post.id}`)}
          aria-label="Save"
          className="press grid h-9 w-9 place-items-center rounded-full bg-raised text-muted hover:text-ink"
        >
          <Bookmark size={16} />
        </button>
        <span className="flex-1" />
        <SourceLabel source={post.source} link={post.sourceLink} />
      </footer>
    </Panel>
  );
}

/** The invitation at the foot of every guest page. */
export function JoinBlock({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-[20px] bg-grove p-6 text-white sm:p-8">
      <h2 className="serif text-[30px] leading-tight">{title}</h2>
      {children}
      <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-white/85">
        Fertility Grove is a private community for people going through infertility, and their
        partners. Replies stay inside.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <LinkButton href="/signup" variant="light">
          Create account
        </LinkButton>
        <Link
          href="/login"
          className="press inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold text-white hover:bg-white/10"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
