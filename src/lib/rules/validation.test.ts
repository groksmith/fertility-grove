import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { RESERVED_HANDLES } from "@/config/options";
import { checks, collect, MSG, normalizeEmail, TAKEN_HANDLES } from "@/lib/rules/validation";

describe("checks.email", () => {
  it.each(["ben@groksmith.co", "a.b+tag@example.org", "  maya@grove.com  "])("accepts %s", (v) => {
    expect(checks.email(v)).toBeUndefined();
  });

  it.each(["", "ben", "ben@", "@groksmith.co", "ben@groksmith", "ben@groksmith.c", "be n@x.com"])(
    "rejects %j with the PRD message",
    (v) => {
      expect(checks.email(v)).toBe("Enter a valid email address.");
    },
  );
});

describe("checks.password", () => {
  it("requires at least 8 characters", () => {
    expect(checks.password("abc1234")).toBe(MSG.passwordShort);
    expect(checks.password("abcd1234")).toBeUndefined();
  });

  it("allows up to 64 characters and rejects 65", () => {
    expect(checks.password("x".repeat(64))).toBeUndefined();
    expect(checks.password("x".repeat(65))).toBe(MSG.passwordLong);
  });

  it("rejects leaked passwords regardless of case", () => {
    expect(checks.password("password123")).toBe(MSG.passwordLeaked);
    expect(checks.password("PassWord123")).toBe(MSG.passwordLeaked);
    expect(checks.password("12345678")).toBe(MSG.passwordLeaked);
  });

  it("uses the PRD wording", () => {
    expect(MSG.passwordShort).toBe("Use at least 8 characters.");
    expect(MSG.passwordLong).toBe("Use 64 characters or fewer.");
  });
});

describe("checks.zip", () => {
  it.each(["94110", "94110-1234", " 10001 "])("accepts %j", (v) => {
    expect(checks.zip(v)).toBeUndefined();
  });

  it.each(["", "9411", "941100", "94110-12", "abcde", "94110 1234"])("rejects %j", (v) => {
    expect(checks.zip(v)).toBe(MSG.zip);
  });
});

describe("checks.handle", () => {
  it("allows ordinary names that merely contain the letters d-i-e", () => {
    // Regression: "die" was matched anywhere, refusing diego, soldier_mom and audience.
    for (const h of ["diego", "soldier_mom", "audience", "dietrich", "goodie_bag"]) {
      expect(checks.handle(h)).toBeUndefined();
    }
  });

  it("refuses crisis words as their own part of a handle, or run together", () => {
    for (const h of ["die", "want_to_die", "die2", "i_die_inside", "wanttodie", "suicidal_mom"]) {
      expect(checks.handle(h)).toBe(MSG.handleUnavailable);
    }
  });

  it("accepts a well-formed, free handle", () => {
    expect(checks.handle("hopeful_ben")).toBeUndefined();
    expect(checks.handle("  grove_2026  ")).toBeUndefined();
  });

  it("enforces 3 to 30 characters", () => {
    expect(checks.handle("ab")).toBe(MSG.handleFormat);
    expect(checks.handle("abc")).toBeUndefined();
    expect(checks.handle(`a${"b".repeat(29)}`)).toBeUndefined();
    expect(checks.handle(`a${"b".repeat(30)}`)).toBe(MSG.handleFormat);
  });

  it.each(["1grove", "_grove", "Grove", "grove-tree", "grove tree", "grové"])(
    "rejects the format of %j",
    (v) => {
      expect(checks.handle(v)).toBe(MSG.handleFormat);
    },
  );

  it.each(RESERVED_HANDLES)("refuses the reserved handle %s", (h) => {
    expect(checks.handle(h)).toBe(MSG.handleUnavailable);
  });

  it("refuses handles containing crisis words", () => {
    expect(checks.handle("suicide_watch")).toBe(MSG.handleUnavailable);
    expect(checks.handle("wannakillmyself")).toBe(MSG.handleUnavailable);
    expect(checks.handle("selfharm_club")).toBe(MSG.handleUnavailable);
  });

  it("reports seed handles and extra taken handles as taken", () => {
    for (const h of TAKEN_HANDLES) expect(checks.handle(h)).toBe(MSG.handleTaken);
    expect(checks.handle("new_member", ["new_member"])).toBe(MSG.handleTaken);
    expect(checks.handle("new_member", ["someone_else"])).toBeUndefined();
  });
});

describe("checks.link", () => {
  it("treats an empty link as optional", () => {
    expect(checks.link("")).toBeUndefined();
    expect(checks.link("   ")).toBeUndefined();
  });

  it("accepts full https addresses", () => {
    expect(checks.link("https://www.asrm.org/guidelines")).toBeUndefined();
    expect(checks.link("  https://pubmed.ncbi.nlm.nih.gov/123  ")).toBeUndefined();
  });

  it.each(["http://example.com", "www.example.com", "example", "ftp://example.com", "https://"])(
    "rejects %j",
    (v) => {
      expect(checks.link(v)).toBe("Enter a full web address, starting with https://");
    },
  );

  it("rejects links longer than 2000 characters", () => {
    const base = "https://example.com/";
    expect(checks.link(base + "a".repeat(2000 - base.length))).toBeUndefined();
    expect(checks.link(base + "a".repeat(2001 - base.length))).toBe(MSG.badLink);
  });
});

describe("validators on arbitrary input", () => {
  it("never throw and only ever return undefined or a string", () => {
    fc.assert(
      fc.property(fc.fullUnicodeString(), (s) => {
        for (const result of [
          checks.email(s),
          checks.password(s),
          checks.zip(s),
          checks.handle(s),
          checks.link(s),
        ]) {
          expect(result === undefined || typeof result === "string").toBe(true);
        }
      }),
    );
  });

  it("an accepted handle always matches the documented format", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        if (checks.handle(s) === undefined) {
          expect(s.trim()).toMatch(/^[a-z][a-z0-9_]{2,29}$/);
        }
      }),
    );
  });
});

describe("normalizeEmail", () => {
  it("treats differently-cased emails as one account", () => {
    expect(normalizeEmail("  Ben@GrokSmith.co ")).toBe("ben@groksmith.co");
    expect(normalizeEmail("Ben@groksmith.co")).toBe(normalizeEmail("ben@groksmith.co"));
  });

  it("is idempotent", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(normalizeEmail(normalizeEmail(s))).toBe(normalizeEmail(s));
      }),
    );
  });
});

describe("collect", () => {
  it("drops passing fields so the key count is the error count", () => {
    const errs = collect({ email: MSG.email, password: undefined, zip: MSG.zip });
    expect(errs).toEqual({ email: MSG.email, zip: MSG.zip });
    expect(Object.keys(errs)).toHaveLength(2);
  });

  it("returns an empty object when everything passes", () => {
    expect(collect({ email: undefined, password: undefined })).toEqual({});
  });
});

describe("MSG templates", () => {
  it("fills in the email and date", () => {
    expect(MSG.unconfirmed("ben@groksmith.co")).toBe(
      "Confirm your email to do this. We sent a link to ben@groksmith.co.",
    );
    expect(MSG.handleCooldown("December 15")).toBe(
      "You can change your handle again on December 15.",
    );
  });

  it("states the PRD rate limits in the messages", () => {
    expect(MSG.postLimit).toContain("10 posts an hour");
    expect(MSG.commentLimit).toContain("50 comments an hour");
    expect(MSG.reportLimit).toContain("20 reports an hour");
    expect(MSG.packLimit).toContain("5 credit packs");
    expect(MSG.reportCrisisThanks).toContain("988");
  });
});
