/* Field rules and their messages, word for word from PRD v2.0. Each check
   returns the message to show, or undefined when the value passes. */

import { RESERVED_HANDLES } from "../options";

export const MSG = {
  email: "Enter a valid email address.",
  passwordShort: "Use at least 8 characters.",
  passwordLong: "Use 64 characters or fewer.",
  passwordLeaked:
    "This password has appeared in a data leak elsewhere. Choose a different one.",
  age: "You need to be 18 or older to join Fertility Grove.",
  terms: "Please agree to the Terms and Privacy Policy to continue.",
  wrongCredentials: "That email or password isn't right.",
  lockout: "Too many attempts. Try again in 15 minutes, or reset your password.",
  resetSent: "If there is an account for that email, we have sent a reset link.",
  passwordsDiffer: "Passwords don't match.",
  linkExpired: "This link has expired. Request a new one.",
  inviteOnly:
    "Fertility Grove is invite-only during the beta. Ask a member for an invite link.",
  paused:
    "We've paused new sign-ups for a short time so our team can welcome everyone properly. Leave your email and we'll let you know when we reopen.",
  googleDown: "Google sign-in isn't available right now. Try email instead.",

  selectOne: "Select at least one option.",
  consent: "To continue, agree to how we use your health answers.",
  otherDiagnosis: "Tell us the diagnosis, or pick another option.",
  gender: "Choose a gender identity.",
  genderSelf: "Tell us how you'd like to describe your gender identity.",
  pronounsSelf: "Tell us your pronouns.",
  zip: "Enter a valid ZIP code.",
  lookingFor: "Pick at least one thing you're looking for.",
  community: "Choose one community to continue.",
  names: "First and last name are required.",
  handleFormat:
    "Handles are 3 to 30 characters. Lowercase letters, numbers and underscores, starting with a letter.",
  handleTaken: "That handle is taken. Try another one.",
  handleUnavailable: "That handle isn't available. Try another one.",

  selfInvite: "You can't invite your own email.",
  alreadyPartnered:
    "You already have a linked partner. Unlink first to invite someone else.",
  inviteExpired: "This invite has expired. Ask your partner to send a new one.",
  resendLimit: "You can resend this invite once a day, up to 3 times.",
  noteTitle: "Add a title to your note.",
  noteBody: "Write something in your note.",

  postTitle: "Add a title.",
  postBody: "Write something before posting.",
  postTypeSource: "Pick a post type and a source.",
  researchLink: "Add a link to the research or guideline.",
  badLink: "Enter a full web address, starting with https://",
  postLimit: "You've reached the limit of 10 posts an hour. Try again a little later.",
  commentLimit:
    "You've reached the limit of 50 comments an hour. Try again a little later.",
  commentEmpty: "Write something before replying.",
  storyMissing: "Add a story type, title, story and source before publishing.",

  mentorOpenRequest:
    "You already have an open mentor request. Wait for a reply before asking someone else.",
  mentorTwo: "You already have two mentors. End one connection before asking someone new.",
  mentorDecline:
    "Thank you for reaching out. I can't take on someone new right now, and I hope you find the right mentor soon.",
  mentorBio: "Tell members a little about what you went through.",
  mentorHelps: "Pick at least one thing you can help with.",
  mentorGuidelines: "Please agree to the mentor guidelines to start mentoring.",
  mentorMessage: "Add a short message so the mentor knows how you'd like help.",

  conversationLimit: "You've reached today's limit for new conversations. Try again tomorrow.",
  cantReceive: "This member can't receive messages right now.",

  reportDetails: "Tell us a little about what's wrong.",
  reportLimit: "You've reached the limit of 20 reports an hour. Try again a little later.",
  reportThanks: "Thanks for letting us know. Our team reviews reports within 48 hours.",
  reportCrisisThanks:
    "Thanks for letting us know. We review these first, within 24 hours. If someone is in danger right now, call or text 988.",

  packLimit: "You've reached today's limit of 5 credit packs. Try again tomorrow.",
  paymentsDown: "Payments aren't available right now. Please try again later.",
  guideDown: "The Grove Guide isn't available right now.",

  unconfirmed: (email: string) => `Confirm your email to do this. We sent a link to ${email}.`,
  handleCooldown: (date: string) => `You can change your handle again on ${date}.`,
} as const;

/** A mock of the leaked-password list the real product checks against. */
const LEAKED = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "iloveyou",
  "letmein1",
  "baby2024",
  "sunshine1",
]);

/** Handles already in use by seed members, plus a few classics. */
export const TAKEN_HANDLES = new Set(["hopeful_annie", "maya", "tired_but_trying"]);

const CRISIS_WORDS = ["suicide", "killmyself", "selfharm", "die"];

export const checks = {
  email(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? undefined : MSG.email;
  },
  password(v: string) {
    if (v.length < 8) return MSG.passwordShort;
    if (v.length > 64) return MSG.passwordLong;
    if (LEAKED.has(v.toLowerCase())) return MSG.passwordLeaked;
    return undefined;
  },
  zip(v: string) {
    return /^\d{5}(-\d{4})?$/.test(v.trim()) ? undefined : MSG.zip;
  },
  handle(v: string, extraTaken: string[] = []) {
    const h = v.trim();
    if (h.length < 3 || h.length > 30 || !/^[a-z][a-z0-9_]*$/.test(h)) {
      return MSG.handleFormat;
    }
    if (RESERVED_HANDLES.includes(h) || CRISIS_WORDS.some((w) => h.includes(w))) {
      return MSG.handleUnavailable;
    }
    if (TAKEN_HANDLES.has(h) || extraTaken.includes(h)) return MSG.handleTaken;
    return undefined;
  },
  link(v: string) {
    if (!v.trim()) return undefined;
    try {
      const u = new URL(v.trim());
      return u.protocol === "https:" && v.length <= 2000 ? undefined : MSG.badLink;
    } catch {
      return MSG.badLink;
    }
  },
};

/** Lower-cases so Ben@groksmith.co and ben@groksmith.co are one account. */
export const normalizeEmail = (v: string) => v.trim().toLowerCase();

/** Error map helper: drops passing fields so `Object.keys(errs).length` works. */
export function collect<T extends Record<string, string | undefined>>(errs: T) {
  return Object.fromEntries(
    Object.entries(errs).filter(([, v]) => v !== undefined),
  ) as Partial<Record<keyof T, string>>;
}
