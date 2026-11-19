import { set } from "@/lib/mock-server";

export const notificationService = {
  markAllRead() {
    set((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  },
};
