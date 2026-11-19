import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  EMPTY_ME,
  fail,
  get,
  newInviteCode,
  ok,
  persona,
  type Result,
  replace,
  set,
} from "@/lib/mock-server";
import { checks, MSG, normalizeEmail } from "@/lib/rules/validation";

/* ------------------------------------------------------------------ Auth */

export const authService = {
  signUp(input: {
    email: string;
    password?: string;
    adult: boolean;
    terms: boolean;
    google?: boolean;
  }) {
    const s = get();
    if (!s.hasInvite) return fail(MSG.inviteOnly);
    if (s.signupsPaused) return fail(MSG.paused);
    const errs: Record<string, string> = {};
    if (!input.google) {
      const e = checks.email(input.email);
      if (e) errs.email = e;
      const p = checks.password(input.password ?? "");
      if (p) errs.password = p;
    }
    if (!input.adult) errs.adult = MSG.age;
    if (!input.terms) errs.terms = MSG.terms;
    if (Object.keys(errs).length) return { ok: false as const, error: "", errs };
    const email = input.google ? "annie.google@grove.test" : normalizeEmail(input.email);
    // A duplicate email shows the same "check your email" screen and creates nothing.
    if (email === DEMO_EMAIL) return { ok: true as const, duplicate: true };
    const invitedBy = s.invitedBy;
    replace({
      ...persona(invitedBy ? "partner" : "new"),
      signedIn: true,
      step: 1,
      invitedBy,
      password: input.password,
      me: {
        ...EMPTY_ME,
        email,
        status: input.google ? "active" : "unconfirmed",
        inviteCode: newInviteCode(),
      },
    });
    return { ok: true as const, duplicate: false };
  },

  signIn(email: string, password: string, keep: boolean): Result {
    const s = get();
    if (s.lockedOut) return fail(MSG.lockout);
    const known =
      (normalizeEmail(email) === DEMO_EMAIL && password === DEMO_PASSWORD) ||
      (normalizeEmail(email) === s.me.email && password === s.password);
    if (!known) {
      const attempts = s.failedAttempts + 1;
      set((x) => ({ ...x, failedAttempts: attempts, lockedOut: attempts >= 5 }));
      return fail(attempts >= 5 ? MSG.lockout : MSG.wrongCredentials);
    }
    if (normalizeEmail(email) === DEMO_EMAIL && s.me.email !== DEMO_EMAIL) {
      replace({ ...persona("member"), keepSignedIn: keep });
    } else {
      set((x) => ({ ...x, signedIn: true, failedAttempts: 0, keepSignedIn: keep }));
    }
    return ok();
  },

  /** Prototype Google sign-in: lands in the demo member's grove. */
  signInWithGoogle(keep: boolean): Result {
    const s = get();
    if (s.me.email !== DEMO_EMAIL) replace({ ...persona("member"), keepSignedIn: keep });
    else set((x) => ({ ...x, signedIn: true, failedAttempts: 0, keepSignedIn: keep }));
    return ok();
  },

  signOut() {
    set((s) => ({ ...s, signedIn: false }));
  },

  confirmEmail(): Result {
    if (get().linkExpired) return fail(MSG.linkExpired);
    set((s) => ({
      ...s,
      me: { ...s.me, status: s.me.status === "unconfirmed" ? "active" : s.me.status },
    }));
    return ok();
  },

  resendLink() {
    set((s) => ({ ...s, linkExpired: false }));
  },

  resetPassword(pw: string, confirm: string) {
    const errs: Record<string, string> = {};
    const p = checks.password(pw);
    if (p) errs.password = p;
    if (pw !== confirm) errs.confirm = MSG.passwordsDiffer;
    if (get().linkExpired) return { ok: false as const, error: MSG.linkExpired, errs };
    if (Object.keys(errs).length) return { ok: false as const, error: "", errs };
    set((s) => ({ ...s, password: pw, failedAttempts: 0, lockedOut: false }));
    return { ok: true as const };
  },

  arriveWithInvite(kind: "beta" | "partner") {
    set((s) => ({
      ...s,
      hasInvite: true,
      invitedBy: kind === "partner" ? "Annie" : s.invitedBy,
    }));
  },
  /** POST /api/v1/auth/logout, allowed during onboarding. TODO(api): exists. */
  logout() {
    authService.signOut();
  },

  /** POST /api/v1/auth/sign-up-waitlist. TODO(api): exists; nothing is kept here. */
  joinWaitlist(email: string): { ok: true } | { ok: false; error: string } {
    const error = checks.email(email);
    return error ? { ok: false, error } : { ok: true };
  },
};
