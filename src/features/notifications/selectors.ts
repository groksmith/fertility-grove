/* Derived views the screens read: pure functions of the mock server's state. */

import type { State } from "@/lib/mock-server";

export const unreadNotifications = (s: State) => s.notifications.filter((n) => !n.read).length;
