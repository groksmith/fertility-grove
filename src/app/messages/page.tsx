"use client";

import { useEffect, useRef, useState } from "react";
import { Ban, ChevronLeft, Flag, Plus, Search, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Avatar,
  Button,
  EmptyState,
  fieldWidth,
  Modal,
  notWired,
} from "@/components/ui";
import { useStore } from "@/lib/store";

export default function MessagesPage() {
  const { conversations, sendMessage, markRead, profile } = useStore();
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [blocked, setBlocked] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const list = conversations
    .filter((c) => !blocked.includes(c.id))
    .filter(
      (c) =>
        !q ||
        c.person.name.toLowerCase().includes(q.toLowerCase()) ||
        c.messages.some((m) => m.body.toLowerCase().includes(q.toLowerCase())),
    );

  const active = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    if (active?.unread) markRead(active.id);
  }, [active, markRead]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active?.messages.length, activeId]);

  type Msg = (typeof conversations)[number]["messages"][number];
  const days: { day: string; items: Msg[] }[] = [];
  active?.messages.forEach((m) => {
    const last = days[days.length - 1];
    if (last && last.day === m.day) last.items.push(m);
    else days.push({ day: m.day, items: [m] });
  });

  return (
    <AppShell section="messages" wide>
      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        {/* Conversation list — hidden behind the open thread on small screens */}
        <div className={`min-w-0 ${active ? "hidden lg:block" : "block"}`}>
          <h2 className="serif text-[29px]">My Conversations</h2>

          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-line-strong px-3.5 py-2.5">
            <Search size={16} className="text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
              className="w-full bg-transparent text-[14px] placeholder:text-muted focus:outline-none"
            />
          </div>

          <button
            className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-line-strong px-4 py-3 text-[14px] text-muted transition hover:bg-surface disabled:opacity-50 disabled:hover:bg-transparent"
            {...notWired}
          >
            <Plus size={16} /> New message
          </button>

          {list.length === 0 ? (
            <p className="mt-6 text-[14px] leading-relaxed text-muted">
              {q
                ? `Nothing matches “${q}”.`
                : "No conversations. Connect with someone on a post to start one."}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
              {list.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveId(c.id)}
                    aria-current={c.id === activeId ? "true" : undefined}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition"
                    style={{
                      background:
                        c.id === activeId ? "var(--tint-purple)" : "transparent",
                    }}
                  >
                    <Avatar name={c.person.name} size={44} status={c.status} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-semibold">
                          {c.person.anonymous ? c.person.handle : c.person.name}
                        </span>
                        {c.unread && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-purple" />
                        )}
                        <span className="ml-auto shrink-0 text-[12px] text-muted">
                          {c.time}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-[13px] text-muted">
                        {c.preview}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-center text-[13px] text-muted">
            End of conversations
          </p>
        </div>

        {/* Thread */}
        <div className={`min-w-0 ${active ? "block" : "hidden lg:block"}`}>
          {!active ? (
            <EmptyState
              title="No conversation selected."
              body="Pick someone on the left, or start a new message after connecting on a post."
            />
          ) : (
            <div className="flex h-[68vh] min-h-[440px] flex-col rounded-2xl border border-line lg:h-[calc(100vh-176px)]">
              <header className="flex items-center gap-3 border-b border-line px-4 py-4 sm:px-6">
                <button
                  onClick={() => setActiveId("")}
                  aria-label="Back to conversations"
                  className="-ml-1 grid h-9 w-9 place-items-center rounded-lg transition hover:bg-surface lg:hidden"
                >
                  <ChevronLeft size={20} />
                </button>
                <Avatar name={active.person.name} size={40} status={active.status} />
                <div>
                  <p className="text-[15.5px] font-semibold">
                    {active.person.anonymous
                      ? active.person.handle
                      : active.person.name}
                  </p>
                  <p className="text-[12.5px] capitalize text-muted">
                    {active.status}
                  </p>
                </div>
                <div className="relative ml-auto">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-expanded={menuOpen}
                    className="text-[13.5px] text-muted"
                    aria-haspopup="menu"
                  >
                    Options
                  </button>
                  {menuOpen && (
                    <ul className="pop-in absolute right-0 top-7 z-10 w-52 rounded-xl border border-line bg-white py-1 shadow-lg">
                      <li>
                        <button
                          onClick={() => {
                            setBlocked((b) => [...b, active.id]);
                            setMenuOpen(false);
                            setActiveId("");
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13.5px] hover:bg-surface"
                        >
                          <Ban size={15} /> Block this member
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setReported(true);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13.5px] hover:bg-surface"
                        >
                          <Flag size={15} /> Report conversation
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              </header>

              <div
                ref={scroller}
                className="thin-scroll flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6"
              >
                {days.map((d) => (
                  <div key={d.day}>
                    <p className="mb-4 text-center text-[12.5px] text-muted">
                      {d.day}
                    </p>
                    <div className="space-y-4">
                      {d.items.map((m) =>
                        m.from === "me" ? (
                          <div key={m.id} className="flex justify-end gap-3">
                            <div className="max-w-[70%]">
                              <p className="mb-1 text-right text-[12.5px] text-muted">
                                {m.at}{" "}
                                <span className="font-semibold text-ink">
                                  {profile.firstName} {profile.lastName} (You)
                                </span>
                              </p>
                              <p
                                className="rounded-2xl px-4 py-3 text-[14px] leading-relaxed text-white"
                                style={{ background: "var(--fg-purple)" }}
                              >
                                {m.body}
                              </p>
                            </div>
                            <Avatar
                              name={`${profile.firstName} ${profile.lastName}`}
                              size={34}
                            />
                          </div>
                        ) : (
                          <div key={m.id} className="flex gap-3">
                            <Avatar name={active.person.name} size={34} />
                            <div className="max-w-[70%]">
                              <p className="mb-1 text-[12.5px]">
                                <span className="font-semibold">
                                  {active.person.anonymous
                                    ? active.person.handle
                                    : active.person.name}
                                </span>{" "}
                                <span className="text-muted">{m.at}</span>
                              </p>
                              <p className="rounded-2xl bg-surface px-4 py-3 text-[14px] leading-relaxed">
                                {m.body}
                              </p>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <form
                className="flex items-center gap-3 border-t border-line px-5 py-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim()) return;
                  sendMessage(active.id, draft.trim());
                  setDraft("");
                }}
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message…"
                  aria-label="Message"
                  className={`w-full ${fieldWidth} rounded-full bg-surface px-5 py-3 text-[14.5px] placeholder:text-muted focus:outline-none`}
                />
                <Button type="submit" variant="purple" disabled={!draft.trim()}>
                  <Send size={16} /> Send
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
      <Modal
        open={reported}
        onClose={() => setReported(false)}
        width={440}
        labelledBy="reported-title"
      >
        <h3 id="reported-title" className="serif text-[24px]">
          Thanks for telling us.
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          A moderator will review this conversation. You won&rsquo;t be notified
          when they do, and the other member won&rsquo;t know you reported it.
        </p>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setReported(false)}>Close</Button>
        </div>
      </Modal>
    </AppShell>
  );
}
