/* Derived views the screens read: pure functions of the mock server's state. */

import type { State } from "@/lib/mock-server";

export const unreadMessages = (s: State) =>
  s.conversations.filter((c) => c.unread && !c.muted && c.request !== "outgoing").length;
