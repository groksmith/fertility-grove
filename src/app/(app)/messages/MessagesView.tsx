"use client";

/* Messages (PRD §14). The screen's question: who is waiting on a reply from
   me? Desktop shows the list and the open thread side by side; a phone shows
   one pane at a time with a back control. */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MoreHorizontal, Pencil, Search, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Spot } from "@/components/art/Scenes";
import { ReportDialog, useResult } from "@/components/Safety";
import { Avatar, Button, Counter, Dialog, EmptyState, LinkButton, Menu, Name, Panel, Textarea, toast } from "@/components/ui";
import { MSG } from "@/lib/rules/validation";
import { act, sel, useStore, type State } from "@/lib/store";
import type { Conversation, Member, Message } from "@/lib/types";

type Filter = "all" | "unread" | "mentoring" | "requests";

function preview(c: Conversation) {
  const last = c.messages[c.messages.length - 1];
  if (!last) return "";
  if (last.deleted) return "Message deleted";
  const body = last.body || (last.attachedPostId ? "Shared a post" : "");
  return last.from === "me" ? `You: ${body}` : body;
}

function MentoringLabel() {
  return <span className="inline-flex h-5 items-center rounded-full bg-purple-tint px-2 text-[11.5px] font-semibold text-purple-ink">Mentoring</span>;
}

function ConversationList({ activeId, s }: { activeId: string | null; s: State }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const requests = s.conversations.filter((c) => c.request === "incoming");
  const query = q.trim().toLowerCase();
  const rows = s.conversations
    .filter((c) => !s.blocked.includes(c.memberId))
    .filter((c) =>
      filter === "unread" ? c.unread : filter === "mentoring" ? c.kind === "mentoring" : filter === "requests" ? c.request === "incoming" : c.request !== "incoming",
    )
    .filter((c) => {
      if (!query) return true;
      const m = sel.person(s, c.memberId);
      const who = m ? sel.displayName(m).toLowerCase() : "";
      return who.includes(query) || c.messages.some((x) => !x.deleted && x.body.toLowerCase().includes(query));
    })
    .sort((a, b) => Math.min(...a.messages.map((m) => m.minutesAgo)) - Math.min(...b.messages.map((m) => m.minutesAgo)));

  const FILTERS: { id: Filter; label: string; n?: number }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "mentoring", label: "Mentoring" },
    { id: "requests", label: "Requests", n: requests.length },
  ];

  return (
    <Panel className="flex min-h-0 flex-col p-3 lg:h-full">
      <label className="search-field flex h-10 items-center gap-2 rounded-full bg-raised px-3.5 text-muted focus-within:bg-white focus-within:ring-2 focus-within:ring-accent">
        <Search size={16} aria-hidden />
        <span className="sr-only">Search messages</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names and messages" className="w-full bg-transparent text-[14px] text-ink placeholder:text-muted focus:outline-none" />
      </label>
      <div role="radiogroup" aria-label="Filter conversations" className="mt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`press inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold ${filter === f.id ? "bg-ink text-white" : "bg-raised text-ink-soft hover:text-ink"}`}
          >
            {f.label}
            {!!f.n && <span className={`tabular rounded-full px-1.5 text-[11.5px] ${filter === f.id ? "bg-white text-ink" : "bg-accent text-white"}`}>{f.n}</span>}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="px-2 py-8 text-center text-[14px] text-muted">
          {filter === "requests" ? "No message requests." : query ? "No conversations match that." : "No messages yet. You can message people from their profile."}
        </p>
      ) : (
        <ul className="mt-2 space-y-0.5">
          {rows.map((c) => {
            const m = sel.person(s, c.memberId);
            if (!m) return null;
            const t = Math.min(...c.messages.map((x) => x.minutesAgo));
            const on = c.id === activeId;
            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  aria-current={on ? "page" : undefined}
                  className={`press flex items-center gap-3 rounded-[14px] p-2.5 ${on ? "bg-raised ring-1 ring-line" : "hover:bg-raised"}`}
                >
                  <Avatar member={m} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0 truncate">
                        <Name member={m} link={false} badges={false} pronouns={false} />
                      </span>
                      {c.kind === "mentoring" && <MentoringLabel />}
                      <span className="tabular ml-auto shrink-0 text-[12.5px] text-muted">{sel.timeAgo(t)}</span>
                    </span>
                    <span className={`mt-0.5 flex items-center gap-2 text-[13.5px] ${c.unread ? "font-semibold text-ink" : "text-muted"}`}>
                      <span className="truncate">{c.request === "incoming" ? "Message request" : preview(c)}</span>
                      {c.unread && <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function AttachedPost({ postId }: { postId: string }) {
  const post = useStore((s) => s.posts.find((p) => p.id === postId));
  const group = useStore((s) => s.groups.find((g) => g.id === post?.groupId));
  if (!post || post.status === "deleted") return <p className="mt-2 rounded-[10px] bg-white/70 p-3 text-[13px] text-muted">This post isn&apos;t available.</p>;
  return (
    <Link href={`/posts/${post.id}`} className="mt-2 block rounded-[10px] bg-white p-3 text-ink hover:underline">
      <span className="block text-[12.5px] text-muted">{group?.name}</span>
      <span className="block text-[14px] font-semibold leading-snug">{post.title}</span>
    </Link>
  );
}

function Bubble({ convId, m, other }: { convId: string; m: Message; other: Member }) {
  const mine = m.from === "me";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(m.body);
  const editable = mine && !m.deleted && m.minutesAgo <= 15;
  return (
    <li className={`flex flex-col ${mine ? "items-end" : "items-start"} ${m.minutesAgo === 0 ? "rise" : ""}`}>
      <div className={`flex max-w-[82%] items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
        {!mine && <Avatar member={other} size={28} />}
        <div
          className={`rounded-[20px] px-4 py-2.5 text-[15px] leading-relaxed [overflow-wrap:anywhere] ${
            m.deleted ? "bg-raised italic text-muted" : mine ? "rounded-br-[5px] bg-accent text-white" : "rounded-bl-[5px] bg-raised text-ink"
          }`}
        >
          {m.deleted ? (
            "Message deleted"
          ) : editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                act.messages.editMessage(convId, m.id, draft.trim());
                setEditing(false);
              }}
              className="min-w-56 space-y-2"
            >
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} className="!min-h-0 text-ink" autoFocus aria-label="Edit message" />
              <div className="flex gap-2">
                <Button type="submit" size="sm" variant="light">Save</Button>
                <Button size="sm" variant="ghost" className="!text-white" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <>
              {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
              {m.attachedPostId && <AttachedPost postId={m.attachedPostId} />}
            </>
          )}
        </div>
      </div>
      <span className={`mt-1 flex items-center gap-2 text-[12px] text-muted ${mine ? "" : "pl-9"}`}>
        {sel.timeAgo(m.minutesAgo)}
        {m.edited && !m.deleted && " · Edited"}
        {editable && !editing && (
          <>
            <button type="button" className="inline-flex items-center gap-1 font-semibold hover:text-ink" onClick={() => setEditing(true)}>
              <Pencil size={12} /> Edit
            </button>
            <button type="button" className="inline-flex items-center gap-1 font-semibold hover:text-danger" onClick={() => act.messages.deleteMessage(convId, m.id)}>
              <Trash2 size={12} /> Delete
            </button>
          </>
        )}
      </span>
    </li>
  );
}

function Composer({ onSend, disabled, attachId, placeholder }: { onSend: (body: string) => boolean; disabled?: string; attachId?: string | null; placeholder?: string }) {
  const [body, setBody] = useState("");
  return (
    <form
      className="border-t border-line p-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:p-4 sm:pb-[calc(16px+env(safe-area-inset-bottom))] lg:pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (onSend(body)) setBody("");
      }}
    >
      {disabled ? (
        <p className="rounded-[14px] bg-raised px-4 py-3 text-[14px] text-muted">{disabled}</p>
      ) : (
        <>
          {attachId && (
            <div className="mb-2 rounded-[14px] bg-raised p-2">
              <p className="px-1 text-[12.5px] font-semibold text-muted">Sharing this post</p>
              <AttachedPost postId={attachId} />
            </div>
          )}
          <div className="flex items-end gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Message</span>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={1}
                max={5000}
                hardStop
                placeholder={placeholder ?? "Write a message"}
                enterKeyHint="send"
                className="!min-h-11 max-h-40 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (onSend(body)) setBody("");
                  }
                }}
              />
            </label>
            <button type="submit" aria-label="Send" disabled={!body.trim() && !attachId} className="press grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white disabled:opacity-40">
              <Send size={18} />
            </button>
          </div>
          {body.length > 4500 && <div className="mt-1 text-right"><Counter value={body} max={5000} /></div>}
        </>
      )}
    </form>
  );
}

function Thread({ conv, s, attachId }: { conv: Conversation; s: State; attachId: string | null }) {
  const router = useRouter();
  const other = sel.person(s, conv.memberId);
  const { handle, ui } = useResult();
  const [report, setReport] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const end = useRef<HTMLLIElement>(null);
  const mentoringReq = s.mentorRequests.find(
    (r) => r.status === "accepted" && ((r.mentorId === conv.memberId && r.menteeId === "me") || (r.mentorId === "me" && r.menteeId === conv.memberId)),
  );

  useEffect(() => {
    if (conv.unread) act.messages.markRead(conv.id);
  }, [conv.id, conv.unread]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [conv.messages.length]);

  if (!other) return null;
  const name = sel.displayName(other);
  const support = conv.kind === "support";
  const unavailable = other.unavailable;

  const send = (body: string) => {
    const r = act.messages.send(conv.id, body, attachId ?? undefined);
    const okd = handle(r);
    if (okd && attachId) router.replace(`/messages/${conv.id}`);
    return okd;
  };

  return (
    <Panel className="flex flex-col max-lg:fixed max-lg:inset-0 max-lg:z-[45] max-lg:rounded-none max-lg:border-0 max-lg:pt-[env(safe-area-inset-top)] lg:min-h-[640px]">
      <header className="flex items-center gap-3 border-b border-line p-3 sm:p-4">
        <Link href="/messages" aria-label="Back to messages" className="press grid h-10 w-10 place-items-center rounded-full hover:bg-raised lg:hidden">
          <ArrowLeft size={20} />
        </Link>
        <Avatar member={other} size={40} />
        <div className="min-w-0 flex-1">
          <Name member={other} pronouns={false} link={!support} />
          <p className="flex items-center gap-2 text-[13px] text-muted">
            {conv.kind === "mentoring" && <MentoringLabel />}
            {conv.muted && "Muted"}
            {support && "A real person reads every message"}
          </p>
        </div>
        <Menu
          label="Conversation options"
          trigger={(p) => (
            <button {...p} type="button" aria-label="Conversation options" className="press grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink">
              <MoreHorizontal size={20} />
            </button>
          )}
          items={[
            { label: conv.muted ? "Unmute" : "Mute", onSelect: () => { act.messages.toggleMute(conv.id); toast(conv.muted ? "Unmuted" : "Muted. No notifications from this conversation."); } },
            !support && { label: `View ${name}'s profile`, onSelect: () => router.push(`/u/${other.handle}`) },
            conv.kind === "mentoring" && !!mentoringReq && { label: "End mentoring", onSelect: () => { act.mentors.end(mentoringReq.id); toast("Mentoring ended. They've been told kindly."); } },
            { label: "Delete for me", onSelect: () => { act.messages.deleteForMe(conv.id); router.push("/messages"); } },
            !support && "divider",
            !support && { label: "Report", onSelect: () => setReport(true) },
            !support && { label: `Block ${name}`, danger: true, onSelect: () => setConfirmBlock(true) },
          ]}
        />
      </header>

      {conv.request === "incoming" && (
        <div className="m-3 rounded-[14px] bg-yellow-tint p-4 text-[14px] text-[var(--yellow-700)]">
          <p><strong className="font-semibold">{name} wants to message you.</strong> They won&apos;t know you&apos;ve read this unless you accept.</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => act.messages.acceptRequest(conv.id)}>Accept</Button>
            <Button size="sm" variant="secondary" onClick={() => { act.messages.deleteRequest(conv.id); router.push("/messages"); toast("Request deleted"); }}>
              Delete
            </Button>
          </div>
        </div>
      )}

      <ol className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" style={{ overscrollBehavior: "contain" }} aria-label={`Conversation with ${name}`}>
        {conv.messages.map((m) => (
          <Bubble key={m.id} convId={conv.id} m={m} other={other} />
        ))}
        <li ref={end} aria-hidden className="h-0" />
      </ol>

      <Composer
        onSend={send}
        attachId={attachId}
        disabled={
          unavailable
            ? MSG.cantReceive
            : conv.request === "incoming"
              ? "Accept the request to reply."
              : conv.request === "outgoing"
                ? `You can send more once ${name} accepts your message request.`
                : undefined
        }
      />
      <ReportDialog open={report} onClose={() => setReport(false)} target={conv.id} what="conversation" authorId={other.id} />
      <Dialog open={confirmBlock} onClose={() => setConfirmBlock(false)} title={`Block ${name}?`} description="They won't be able to message you, follow you, see your profile or your posts. They won't be told.">
        <div className="flex gap-2">
          <Button variant="danger" onClick={() => { act.social.block(other.id); setConfirmBlock(false); router.push("/messages"); toast(`${name} is blocked`); }}>Block</Button>
          <Button variant="ghost" onClick={() => setConfirmBlock(false)}>Cancel</Button>
        </div>
      </Dialog>
      {ui}
    </Panel>
  );
}

function NewConversation({ member, attachId }: { member: Member; attachId: string | null }) {
  const router = useRouter();
  const { handle, ui } = useResult();
  const mode = act.messages.canStart(member.id);
  const name = sel.displayName(member);
  return (
    <Panel className="flex flex-col max-lg:fixed max-lg:inset-0 max-lg:z-[45] max-lg:rounded-none max-lg:border-0 max-lg:pt-[env(safe-area-inset-top)] lg:min-h-[640px]">
      <header className="flex items-center gap-3 border-b border-line p-3 sm:p-4">
        <Link href="/messages" aria-label="Back to messages" className="press grid h-10 w-10 place-items-center rounded-full hover:bg-raised lg:hidden">
          <ArrowLeft size={20} />
        </Link>
        <Avatar member={member} size={40} />
        <Name member={member} pronouns={false} />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <Spot kind="envelope" size={140} />
        <p className="mt-3 max-w-sm text-[15px] text-ink-soft">
          {mode === "request"
            ? `${name} only gets messages from people they follow, so your first message goes as a request.`
            : mode === "open"
              ? `Start a conversation with ${name}.`
              : mode === "unavailable"
                ? MSG.cantReceive
                : `${name} isn't taking messages.`}
        </p>
      </div>
      <Composer
        attachId={attachId}
        disabled={mode === "none" ? `${name} isn't taking messages.` : mode === "unavailable" ? MSG.cantReceive : undefined}
        placeholder={mode === "request" ? "Write your message request" : undefined}
        onSend={(body) => {
          const r = act.messages.start(member.id, body, attachId ?? undefined);
          const okd = handle(r);
          if (okd && r.ok) router.replace(`/messages/${r.id}`);
          return okd;
        }}
      />
      {ui}
    </Panel>
  );
}

export function MessagesView({ activeId }: { activeId: string | null }) {
  const s = useStore();
  const params = useSearchParams();
  const to = params.get("to");
  const attach = params.get("attach");
  const conv = activeId ? s.conversations.find((c) => c.id === activeId) : undefined;
  const existingTo = to ? s.conversations.find((c) => c.memberId === to) : undefined;
  const toMember = to && !existingTo ? s.members.find((m) => m.id === to) : undefined;
  const showThread = !!(conv || toMember || existingTo);

  const waiting = s.conversations.filter((c) => (c.unread || c.request === "incoming") && !c.muted).length;

  return (
    <>
      <header className={`mb-6 flex-wrap items-end justify-between gap-4 lg:mb-8 ${showThread ? "sr-only lg:not-sr-only lg:flex" : "flex"}`}>
        <div className="flex items-center gap-4">
          <Spot kind="birds" size={88} className="hidden sm:block" />
          <div>
            <h1 className="serif text-[28px] leading-[1.1] lg:text-[32px]">Messages</h1>
            <p className="mt-2 text-[15px] text-ink-soft">
              {waiting ? `${waiting} ${waiting === 1 ? "conversation needs" : "conversations need"} you.` : "You're all caught up."}
            </p>
          </div>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className={showThread ? "hidden lg:block" : ""}>
          <ConversationList activeId={conv?.id ?? existingTo?.id ?? null} s={s} />
        </div>
        <div className={showThread ? "" : "hidden lg:block"}>
          {conv ? (
            <Thread conv={conv} s={s} attachId={attach} />
          ) : existingTo ? (
            <Thread conv={existingTo} s={s} attachId={attach} />
          ) : toMember ? (
            <NewConversation member={toMember} attachId={attach} />
          ) : activeId ? (
            <EmptyState art="envelope" title="This conversation isn't available." action={<LinkButton href="/messages" variant="secondary">All messages</LinkButton>} />
          ) : s.conversations.length ? (
            <div className="grid min-h-[640px] place-items-center rounded-[20px] border border-line bg-panel">
              <div className="text-center">
                <Spot kind="birds" size={168} />
                <p className="mt-3 text-[15px] text-muted">Choose a conversation to read it here.</p>
              </div>
            </div>
          ) : (
            <EmptyState art="birds" title="No messages yet." body="You can message people from their profile." />
          )}
        </div>
      </div>
    </>
  );
}
