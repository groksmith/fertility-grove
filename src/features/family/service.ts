import { set, uid } from "@/lib/mock-server";
import { MSG } from "@/lib/rules/validation";
import type { FamilyItem } from "@/types/domain";

/* ----------------------------------------------------------------- Family */

export const familyService = {
  share(item: Omit<FamilyItem, "id" | "owner" | "daysAgo">) {
    set((s) => ({
      ...s,
      family: {
        ...s.family,
        items: [
          { ...item, id: uid("fi"), owner: "me", daysAgo: 0 },
          ...s.family.items.filter((i) => i.refId !== item.refId),
        ],
        activity: [
          {
            id: uid("a"),
            text: `You shared ${item.title} (${item.access === "edit" ? "can edit" : "view only"})`,
            minutesAgo: 0,
          },
          ...s.family.activity,
        ],
      },
    }));
  },
  setAccess(id: string, access: "view" | "edit") {
    set((s) => ({
      ...s,
      family: {
        ...s.family,
        items: s.family.items.map((i) => (i.id === id && i.owner === "me" ? { ...i, access } : i)),
        activity: [
          {
            id: uid("a"),
            text: `You changed access to ${access === "edit" ? "can edit" : "view only"}`,
            minutesAgo: 0,
          },
          ...s.family.activity,
        ],
      },
    }));
  },
  stopSharing(id: string) {
    set((s) => {
      const item = s.family.items.find((i) => i.id === id);
      if (item?.owner !== "me") return s;
      return {
        ...s,
        family: {
          ...s.family,
          items: s.family.items.filter((i) => i.id !== id),
          activity: [
            { id: uid("a"), text: `You stopped sharing ${item.title}`, minutesAgo: 0 },
            ...s.family.activity,
          ],
        },
      };
    });
  },
  createNote(title: string, body: string) {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = MSG.noteTitle;
    if (!body.trim()) errs.body = MSG.noteBody;
    if (Object.keys(errs).length) return { ok: false as const, errs };
    const id = uid("fn");
    set((s) => ({
      ...s,
      family: {
        items: [
          {
            id: uid("fi"),
            kind: "note",
            refId: id,
            title: title.trim(),
            owner: "me",
            access: "edit",
            daysAgo: 0,
          },
          ...s.family.items,
        ],
        notes: [{ id, title: title.trim(), body: body.trim(), versions: [] }, ...s.family.notes],
        activity: [
          { id: uid("a"), text: `You started a family note: ${title.trim()}`, minutesAgo: 0 },
          ...s.family.activity,
        ],
      },
    }));
    return { ok: true as const, id, errs: {} };
  },
  editNote(id: string, title: string, body: string) {
    set((s) => ({
      ...s,
      family: {
        ...s.family,
        notes: s.family.notes.map((n) =>
          n.id === id
            ? {
                ...n,
                title,
                body,
                versions: [
                  { id: uid("v"), title: n.title, body: n.body, by: "me", minutesAgo: 0 },
                  ...n.versions,
                ],
              }
            : n,
        ),
        activity: [
          { id: uid("a"), text: `You edited ${title}`, minutesAgo: 0 },
          ...s.family.activity,
        ],
      },
    }));
  },
  restore(noteId: string, versionId: string) {
    set((s) => ({
      ...s,
      family: {
        ...s.family,
        notes: s.family.notes.map((n) => {
          if (n.id !== noteId) return n;
          const v = n.versions.find((x) => x.id === versionId);
          if (!v) return n;
          return {
            ...n,
            title: v.title,
            body: v.body,
            versions: [
              { id: uid("v"), title: n.title, body: n.body, by: "me", minutesAgo: 0 },
              ...n.versions,
            ],
          };
        }),
        activity: [
          { id: uid("a"), text: "You restored an earlier version of a note", minutesAgo: 0 },
          ...s.family.activity,
        ],
      },
    }));
  },
};
