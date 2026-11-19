/* The partner endpoints. There is no backend yet: each method reads or writes the mock server and
   returns what the API returns (or will). A body that becomes a request is marked TODO(api). */

import { fail, get, notify, ok, type Result, set, uid } from "@/lib/mock-server";
import { detectCrisis } from "@/lib/rules/crisis";
import { checks, MSG, normalizeEmail } from "@/lib/rules/validation";

/* ---------------------------------------------------------------- Partner */

export const partnerService = {
  invite(email: string, note: string): Result {
    const s = get();
    if (s.partner.linked) return fail(MSG.alreadyPartnered);
    const e = checks.email(email);
    if (e) return fail(e);
    if (normalizeEmail(email) === s.me.email) return fail(MSG.selfInvite);
    const crisis = detectCrisis(note);
    set((x) => ({
      ...x,
      partner: {
        ...x.partner,
        invite: {
          email: normalizeEmail(email),
          note: note.trim() || undefined,
          status: "pending",
          resends: 0,
          daysAgo: 0,
        },
      },
    }));
    return ok({ crisis });
  },
  resend(): Result {
    const inv = get().partner.invite;
    if (!inv) return fail("There's no invite to resend.");
    if (inv.resends >= 3) return fail(MSG.resendLimit);
    set((s) => ({
      ...s,
      partner: { ...s.partner, invite: { ...inv, resends: inv.resends + 1, daysAgo: 0 } },
    }));
    return ok();
  },
  cancel() {
    set((s) => ({
      ...s,
      partner: {
        ...s.partner,
        invite: s.partner.invite && { ...s.partner.invite, status: "cancelled" },
      },
    }));
  },
  /** Demo: the invited partner accepts. Links accounts and opens the family space. */
  demoAccept() {
    set((s) =>
      notify(
        {
          ...s,
          partner: {
            linked: true,
            firstName: "Alex",
            showsBadge: true,
            invite: s.partner.invite && { ...s.partner.invite, status: "accepted" },
          },
          family: {
            items: [
              {
                id: uid("fi"),
                kind: "note",
                refId: "fn-1",
                title: "Questions for Thursday's consult",
                owner: "partner",
                access: "edit",
                daysAgo: 0,
              },
            ],
            notes: [
              {
                id: "fn-1",
                title: "Questions for Thursday's consult",
                body: "Ask about recovery time after excision.\nCan I be in the room for the retrieval?\nWhat does the clinic's after-hours line cover?",
                versions: [
                  {
                    id: uid("v"),
                    title: "Questions for Thursday's consult",
                    body: "Ask about recovery time after excision.",
                    by: "partner",
                    minutesAgo: 120,
                  },
                ],
              },
            ],
            activity: [
              {
                id: uid("a"),
                text: "Alex started a family note: Questions for Thursday's consult",
                minutesAgo: 0,
              },
              { id: uid("a"), text: "You and Alex linked your accounts", minutesAgo: 0 },
            ],
          },
        },
        {
          kind: "partner",
          text: "Alex accepted your invite. Your family space is ready.",
          href: "/family",
        },
      ),
    );
  },
  unlink() {
    set((s) => ({
      ...s,
      partner: { linked: false, firstName: "", showsBadge: false },
      family: {
        items: s.family.items.filter((i) => i.owner === "me" && i.kind !== "note").map((i) => i),
        notes: s.family.notes.map((n) => ({ ...n, past: true })),
        activity: [
          {
            id: uid("a"),
            text: "You unlinked from your partner. Sharing has ended.",
            minutesAgo: 0,
          },
          ...s.family.activity,
        ],
      },
    }));
  },
};
