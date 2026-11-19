import { set } from "@/lib/mock-server";

/* ----------------------------------------------------------------- Groups */

export const groupService = {
  toggleJoin(id: string) {
    set((s) => {
      const joined = s.joined.includes(id);
      return {
        ...s,
        joined: joined ? s.joined.filter((g) => g !== id) : [...s.joined, id],
        muted: joined ? s.muted.filter((g) => g !== id) : s.muted,
        groups: s.groups.map((g) =>
          g.id === id ? { ...g, members: g.members + (joined ? -1 : 1) } : g,
        ),
      };
    });
  },
  toggleMute(id: string) {
    set((s) => ({
      ...s,
      muted: s.muted.includes(id) ? s.muted.filter((g) => g !== id) : [...s.muted, id],
    }));
  },
  notForMe(id: string) {
    set((s) => ({ ...s, notForMe: [...s.notForMe, id] }));
  },
};
