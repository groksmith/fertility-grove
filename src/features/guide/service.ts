/* The guide endpoints. There is no backend yet: each method reads or writes the mock server and
   returns what the API returns (or will). A body that becomes a request is marked TODO(api). */

import { CREDITS } from "@/config/options";
import { fail, get, notify, ok, type Result, type State, set, uid } from "@/lib/mock-server";
import { spend } from "@/lib/rules/credits";
import { appointmentQuestions, askGuide } from "@/lib/rules/guide";
import type { GuideChat } from "@/types/domain";

/* ------------------------------------------------------------------ Guide */

export const guideService = {
  ask(chatId: string | null, question: string): Result {
    const s = get();
    const q = question.trim();
    if (!q) return fail("Type a question first.");
    const turn = askGuide(q, s.useProfileAnswers && s.me.healthConsent ? s.me.diagnoses : []);
    // Crisis replies are free and work at a zero balance.
    let credits = s.credits;
    if (turn.cost > 0) {
      const next = spend(s.credits, turn.cost);
      if (!next) return fail("You're out of credits.", "credits");
      credits = { ...s.credits, ...next };
    }
    const id = chatId ?? uid("gc");
    set((x) => {
      const chats = x.guideChats.some((c) => c.id === id)
        ? x.guideChats.map((c) => (c.id === id ? { ...c, turns: [...c.turns, turn] } : c))
        : [{ id, title: q.slice(0, 60), turns: [turn], daysAgo: 0 } as GuideChat, ...x.guideChats];
      let next: State = { ...x, credits, guideChats: chats };
      const total = credits.free + credits.purchased;
      if (turn.cost > 0 && total <= CREDITS.lowWarning) {
        next = notify(next, {
          kind: "credits",
          text: `You have ${total} Grove Guide credits left`,
          href: "/credits",
        });
      }
      return next;
    });
    return ok({ id });
  },
  rate(chatId: string, turnId: string, rating: "helpful" | "not-helpful", reason?: string) {
    set((s) => ({
      ...s,
      guideChats: s.guideChats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              turns: c.turns.map((t) =>
                t.id === turnId ? { ...t, rating, ratingReason: reason } : t,
              ),
            }
          : c,
      ),
    }));
  },
  deleteChat(id: string) {
    set((s) => ({ ...s, guideChats: s.guideChats.filter((c) => c.id !== id) }));
  },
  deleteAll() {
    set((s) => ({ ...s, guideChats: [] }));
  },
  setUseProfile(on: boolean) {
    set((s) => ({ ...s, useProfileAnswers: on }));
  },

  createList(type: string, date: string, onMind: string): Result {
    const s = get();
    if (!type) return fail("Choose the appointment type.");
    const next = spend(s.credits, CREDITS.appointmentListCost);
    if (!next) return fail("You're out of credits.", "credits");
    const id = uid("al");
    set((x) => ({
      ...x,
      credits: { ...x.credits, ...next },
      appointmentLists: [
        {
          id,
          type,
          date: date || undefined,
          onMind: onMind.trim() || undefined,
          questions: appointmentQuestions(type, onMind),
          daysAgo: 0,
        },
        ...x.appointmentLists,
      ],
    }));
    return ok({ id });
  },
  updateList(id: string, questions: State["appointmentLists"][number]["questions"]) {
    set((s) => ({
      ...s,
      appointmentLists: s.appointmentLists.map((l) => (l.id === id ? { ...l, questions } : l)),
    }));
  },
  deleteList(id: string) {
    set((s) => ({ ...s, appointmentLists: s.appointmentLists.filter((l) => l.id !== id) }));
  },
};
