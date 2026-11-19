/* Derived views the screens read: pure functions of the mock server's state. */

import type { State } from "@/lib/mock-server";
import { total } from "@/lib/rules/credits";

export const creditTotal = (s: State) => total(s.credits);
