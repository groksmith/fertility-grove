"use client";

/* A member's profile (PRD §6). What others see: display identity, tree and
   Sunlight, badges, About me, My story, journey only if they opted in, and
   their public posts. Never age, ZIP or gender. */

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { TreeArt } from "@/components/art/Tree";
import { PostCard } from "@/components/PostCard";
import { ReportDialog, useResult } from "@/components/Safety";
import {
  Avatar,
  BadgeChip,
  Button,
  ChipSelect,
  Counter,
  Dialog,
  EmptyState,
  Field,
  LinkButton,
  Menu,
  Panel,
  Textarea,
  toast,
} from "@/components/ui";
import { act, sel, useStore } from "@/lib/store";
import { MSG } from "@/lib/rules/validation";
import type { Member } from "@/lib/types";

function RequestMentor({ mentor, open, onClose }: { mentor: Member; open: boolean; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [help, setHelp] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const { handle, ui } = useResult();
  return (
    <Dialog open={open} onClose={onClose} title={`Ask ${sel.displayName(mentor)} to mentor you`}>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (message.length > 500) return setError("Messages can be up to 500 characters.");
          const r = act.mentors.request(mentor.id, message, help);
          if (!r.ok && r.code !== "unconfirmed") return setError(r.error);
          if (handle(r, "Request sent. We'll let you know when they reply.")) onClose();
        }}
      >
        <Field
          label="Message to the mentor"
          error={error === MSG.mentorMessage || error?.startsWith("Messages") ? error : undefined}
          counter={<Counter value={message} max={500} />}
        >
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Where you are, and how you'd like help" />
        </Field>
        {mentor.mentor && mentor.mentor.helpsWith.length > 0 && (
          <div>
            <p className="mb-2 text-[14px] font-semibold">
              I&apos;d like help with <span className="font-normal text-muted">(optional)</span>
            </p>
            <ChipSelect label="Help with" options={mentor.mentor.helpsWith} value={help} onChange={setHelp} />
          </div>
        )}
        {error && error !== MSG.mentorMessage && !error.startsWith("Messages") && (
          <p role="alert" className="text-[14px] font-semibold text-danger">
            {error}
          </p>
        )}
        <p className="text-[13px] text-muted">Mentors are members, not clinicians. They share experience, never medical advice.</p>
        <Button type="submit">Send request</Button>
      </form>
      {ui}
    </Dialog>
  );
}

export default function MemberPage() {
  const { handle } = useParams<{ handle: string }>();
  const router = useRouter();
  const s = useStore();
  const [report, setReport] = useState(false);
  const [asking, setAsking] = useState(false);
  const member = s.members.find((m) => m.handle === handle);
  const isMe = handle === s.me.handle;

  useEffect(() => {
    if (isMe) router.replace("/profile");
  }, [isMe, router]);

  if (isMe) return null;
  if (!member || member.unavailable || s.blocked.includes(member.id)) {
    return <EmptyState art="lens" title="This profile isn't available." action={<LinkButton href="/home" variant="secondary">Back to your grove</LinkButton>} />;
  }

  const following = s.following.includes(member.id);
  const team = member.badges.includes("team");
  const msg = team ? "open" : act.messages.canStart(member.id);
  const m = member.mentor;
  const mentorFull = m && m.activeMentees + m.waiting >= m.capacity;
  const myRequest = s.mentorRequests.find((r) => r.mentorId === member.id && (r.status === "waiting" || r.status === "accepted"));
  const posts = sel
    .visiblePosts(s)
    .filter((p) => p.authorId === member.id)
    .filter((p) => {
      const g = s.groups.find((x) => x.id === p.groupId);
      return g?.readAccess === "any" || s.joined.includes(p.groupId);
    });
  const name = sel.displayName(member);
  const conv = s.conversations.find((c) => c.memberId === member.id);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <Panel className="p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <Avatar member={member} size={72} />
            <div className="min-w-0 flex-1">
              <h1 className="serif text-[28px] leading-tight [overflow-wrap:anywhere] lg:text-[32px]">{name}</h1>
              <p className="mt-0.5 text-[14px] text-muted">
                {member.showRealName && <>@{member.handle} · </>}
                {member.pronouns && <>{member.pronouns} · </>}
                <span className="tabular">{member.followers.toLocaleString()}</span> followers
              </p>
              {member.badges.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {member.badges.map((b) => (
                    <BadgeChip key={b} badge={b} />
                  ))}
                </div>
              )}
              {member.credentials && <p className="mt-2 text-[14px] text-ink-soft">{member.credentials}</p>}
            </div>
            {!team && (
              <Menu
                label="Profile options"
                trigger={(p) => (
                  <button {...p} type="button" aria-label="Profile options" className="press grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink">
                    <MoreHorizontal size={20} />
                  </button>
                )}
                items={[
                  { label: "Report profile", onSelect: () => setReport(true) },
                  {
                    label: `Block ${name}`,
                    danger: true,
                    onSelect: () => {
                      act.social.block(member.id);
                      toast("Blocked. They can't message you, follow you or see your posts.");
                      router.push("/home");
                    },
                  },
                ]}
              />
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {!team && (
              <Button variant={following ? "quiet" : "primary"} aria-pressed={following} onClick={() => act.social.toggleFollow(member.id)}>
                {following ? "Following" : "Follow"}
              </Button>
            )}
            {conv ? (
              <LinkButton href={`/messages/${conv.id}`} variant="secondary">
                Message
              </LinkButton>
            ) : msg === "open" || msg === "request" ? (
              <LinkButton href={`/messages?to=${member.id}`} variant="secondary">
                {msg === "request" ? "Send a message request" : "Message"}
              </LinkButton>
            ) : null}
            {m &&
              !m.paused &&
              (myRequest ? (
                <span className="inline-flex h-11 items-center rounded-full bg-purple-tint px-4 text-[14px] font-semibold text-purple-ink">
                  {myRequest.status === "accepted" ? "Your mentor" : "Request sent"}
                </span>
              ) : mentorFull ? (
                <span className="inline-flex h-11 items-center rounded-full bg-raised px-4 text-[14px] text-muted">Not taking requests right now</span>
              ) : (
                <Button variant="secondary" onClick={() => setAsking(true)}>
                  Request mentoring
                </Button>
              ))}
          </div>
        </Panel>

        {(member.aboutMe || member.myStory) && (
          <Panel className="space-y-5 p-5 sm:p-7">
            {member.aboutMe && (
              <section>
                <h2 className="text-[16px] font-semibold">About me</h2>
                <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line">{member.aboutMe}</p>
              </section>
            )}
            {member.myStory && (
              <section>
                <h2 className="text-[16px] font-semibold">My story</h2>
                <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line">{member.myStory}</p>
              </section>
            )}
          </Panel>
        )}

        {m && (
          <Panel className="p-5 sm:p-7">
            <h2 className="text-[16px] font-semibold">As a mentor</h2>
            <p className="mt-1.5 text-[15px] leading-relaxed">{m.bio}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {m.helpsWith.map((h) => (
                <span key={h} className="inline-flex h-7 items-center rounded-full bg-purple-tint px-3 text-[13px] font-semibold text-purple-ink">
                  {h}
                </span>
              ))}
            </div>
          </Panel>
        )}

        <section aria-labelledby="posts-h" className="space-y-4">
          <h2 id="posts-h" className="pt-2 text-[18px] font-semibold">
            Posts <span className="tabular font-normal text-muted">{posts.length}</span>
          </h2>
          {posts.length === 0 ? (
            <EmptyState art="sprout" title={`${name} hasn't posted in groups you can read yet.`} compact />
          ) : (
            <ul className="space-y-4">
              {posts.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        {!team && (
          <Panel className="overflow-hidden">
            <div className="flex justify-center border-b border-line bg-white pt-4">
              <TreeArt level={member.level} size={140} title={member.level} />
            </div>
            <div className="p-5">
              <p className="serif text-[26px] leading-none">{member.level}</p>
              <p className="tabular mt-1 text-[14px] text-muted">{member.sunlight.toLocaleString()} Sunlight</p>
            </div>
          </Panel>
        )}
        {member.shareJourney && (member.diagnoses.length + member.stages.length + member.paths.length > 0) && (
          <Panel className="space-y-3 p-5 text-[14px]">
            <h2 className="text-[16px] font-semibold">Their journey</h2>
            {[
              ["Diagnosis", member.diagnoses],
              ["Stage", member.stages],
              ["Path", member.paths],
            ].map(([label, vals]) =>
              (vals as string[]).length ? (
                <div key={label as string}>
                  <p className="text-muted">{label}</p>
                  <p className="font-semibold">{(vals as string[]).join(", ")}</p>
                </div>
              ) : null,
            )}
          </Panel>
        )}
      </aside>

      <ReportDialog open={report} onClose={() => setReport(false)} target={member.id} what="profile" authorId={member.id} />
      {m && <RequestMentor mentor={member} open={asking} onClose={() => setAsking(false)} />}
    </div>
  );
}
