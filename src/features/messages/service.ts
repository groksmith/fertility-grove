import { confirmed, fail, get, ok, type Result, set, uid } from "@/lib/mock-server";
import { detectCrisis } from "@/lib/rules/crisis";
import { MSG } from "@/lib/rules/validation";

/* -------------------------------------------------------------- Messages */

export const messageService = {
  /** Who can message whom (PRD §14): a follow or "Anyone" opens a thread; any
   *  other first message becomes a request; "No one" has no Message button. */
  canStart(memberId: string): "open" | "request" | "none" | "unavailable" {
    const s = get();
    const m = s.members.find((x) => x.id === memberId);
    if (!m) return "none";
    if (m.unavailable) return "unavailable";
    if (m.messagePolicy === "no-one") return "none";
    if (m.messagePolicy === "anyone" || m.follows.includes("me")) return "open";
    return "request";
  },

  start(memberId: string, body: string, attachedPostId?: string): Result {
    const gate = confirmed();
    if (gate) return gate;
    const s = get();
    const existing = s.conversations.find((c) => c.memberId === memberId);
    if (existing) {
      const r = messageService.send(existing.id, body, attachedPostId);
      return r.ok ? ok({ id: existing.id, crisis: r.crisis }) : r;
    }
    const mode = messageService.canStart(memberId);
    if (mode === "unavailable") return fail(MSG.cantReceive);
    if (mode === "none") return fail("This member isn't taking messages.");
    if (s.me.joinedDaysAgo < 7 && s.counters.newConversations >= 10)
      return fail(MSG.conversationLimit);
    if (!body.trim() && !attachedPostId) return fail("Write a message first.");
    const id = uid("cv");
    const crisis = detectCrisis(body);
    set((x) => ({
      ...x,
      counters: { ...x.counters, newConversations: x.counters.newConversations + 1 },
      conversations: [
        {
          id,
          memberId,
          kind: "dm",
          request: mode === "request" ? "outgoing" : undefined,
          muted: false,
          unread: false,
          crisisFlagged: crisis !== "none",
          messages: [
            { id: uid("m"), from: "me", body: body.trim(), minutesAgo: 0, attachedPostId },
          ],
        },
        ...x.conversations,
      ],
    }));
    return ok({ id, crisis });
  },

  send(id: string, body: string, attachedPostId?: string): Result {
    const gate = confirmed();
    if (gate) return gate;
    const s = get();
    const c = s.conversations.find((x) => x.id === id);
    if (!c) return fail("This conversation isn't available.");
    if (c.request === "outgoing") {
      const m = s.members.find((x) => x.id === c.memberId);
      return fail(
        `You can send more once ${m?.showRealName ? m.firstName : `@${m?.handle}`} accepts your message request.`,
      );
    }
    if (!body.trim() && !attachedPostId) return fail("Write a message first.");
    if (body.length > 5000) return fail("Messages can be up to 5,000 characters.");
    const crisis = detectCrisis(body);
    set((x) => ({
      ...x,
      conversations: [
        {
          ...c,
          request: c.request === "incoming" ? undefined : c.request,
          crisisFlagged: c.crisisFlagged || crisis !== "none",
          messages: [
            ...c.messages,
            { id: uid("m"), from: "me", body: body.trim(), minutesAgo: 0, attachedPostId },
          ],
        },
        ...x.conversations.filter((k) => k.id !== id),
      ],
    }));
    return ok({ id, crisis });
  },

  acceptRequest(id: string) {
    set((s) => ({
      ...s,
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, request: undefined } : c)),
    }));
  },
  /** Deleting a request is silent: the sender is never told. */
  deleteRequest(id: string) {
    set((s) => ({ ...s, conversations: s.conversations.filter((c) => c.id !== id) }));
  },
  toggleMute(id: string) {
    set((s) => ({
      ...s,
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, muted: !c.muted } : c)),
    }));
  },
  deleteForMe(id: string) {
    set((s) => ({ ...s, conversations: s.conversations.filter((c) => c.id !== id) }));
  },
  markRead(id: string) {
    set((s) => ({
      ...s,
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: false } : c)),
    }));
  },
  /** Edit and delete only within 15 minutes of sending. */
  editMessage(convId: string, msgId: string, body: string) {
    set((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId && m.minutesAgo <= 15 ? { ...m, body, edited: true } : m,
              ),
            }
          : c,
      ),
    }));
  },
  deleteMessage(convId: string, msgId: string) {
    set((s) => ({
      ...s,
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === msgId && m.minutesAgo <= 15 ? { ...m, deleted: true, body: "" } : m,
              ),
            }
          : c,
      ),
    }));
  },
};
