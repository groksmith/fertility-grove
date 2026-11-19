import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { APPOINTMENT_TYPES, CREDITS } from "@/config/options";
import { ARTICLES } from "@/lib/mock-server/seed/articles";
import { APPOINTMENT_TYPE_LIST, appointmentQuestions, askGuide } from "@/lib/rules/guide";

const article = (slug: string) => {
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) throw new Error(`missing article ${slug}`);
  return a;
};

describe("askGuide guardrails", () => {
  it("answers a crisis first, for free, and points to 988", () => {
    const turn = askGuide("I want to die, what dose of letrozole should I take?", []);
    expect(turn.kind).toBe("crisis");
    expect(turn.cost).toBe(0);
    expect(turn.answer.join(" ")).toContain("988");
    expect(turn.citations).toEqual([]);
  });

  it("sends emergencies to the clinic or 911", () => {
    for (const q of ["I have severe pain after my retrieval", "Could this be OHSS?"]) {
      const turn = askGuide(q, []);
      expect(turn.kind).toBe("emergency");
      expect(turn.answer.join(" ")).toContain("911");
      expect(turn.cost).toBe(CREDITS.questionCost);
    }
  });

  it("checks emergencies before dosing", () => {
    expect(askGuide("Heavy bleeding, should I double up my dose?", []).kind).toBe("emergency");
  });

  it.each([
    "What dose of Gonal-F is normal?",
    "How much should I take of my progesterone?",
    "Can I skip my injection tonight?",
    "Is 5 mg of letrozole enough?",
    "Should I stop taking metformin?",
  ])("refuses to advise on doses: %j", (q) => {
    const turn = askGuide(q, ["PCOS"]);
    expect(turn.kind).toBe("dosing");
    expect(turn.answer[0]).toMatch(/can't advise on medication doses/);
    expect(turn.citations).toEqual([]);
  });

  it.each([
    "Do I have endometriosis?",
    "Can you diagnose me from these symptoms?",
    "Am I infertile?",
    "Is it my eggs or his sperm?",
  ])("refuses to diagnose: %j", (q) => {
    const turn = askGuide(q, []);
    expect(turn.kind).toBe("diagnosis");
    expect(turn.answer[0]).toMatch(/^I can't diagnose/);
    expect(turn.citations).toEqual([]);
    expect(turn.groups).toEqual(["g-waiting"]);
  });

  it("offers support and a group for emotional questions", () => {
    const turn = askGuide("I feel so alone and overwhelmed", []);
    expect(turn.kind).toBe("emotional");
    expect(turn.groups).toEqual(["g-break"]);
  });

  it("declines questions that aren't about fertility", () => {
    const turn = askGuide("What's a good pasta recipe?", []);
    expect(turn.kind).toBe("off-topic");
    expect(turn.citations).toEqual([]);
    expect(turn.cost).toBe(CREDITS.questionCost);
  });

  it("keeps the question and builds a turn id", () => {
    const turn = askGuide("What is AMH?", []);
    expect(turn.question).toBe("What is AMH?");
    expect(turn.id).toMatch(/^gt-\d+$/);
  });
});

describe("askGuide text handling", () => {
  it("reads curly apostrophes from phone keyboards like straight ones", () => {
    // Regression: the guardrails only matched straight apostrophes.
    expect(askGuide("I can\u2019t breathe after my transfer", []).kind).toBe("emergency");
    expect(askGuide("What\u2019s wrong with me?", []).kind).toBe("diagnosis");
    expect(askGuide("I can\u2019t cope anymore", []).kind).toBe("emotional");
  });

  it("treats every question the library covers as on-topic", () => {
    // Regression: these were classed off-topic before article matching ran.
    const miscarriage = askGuide("Why do recurrent miscarriages happen?", []);
    expect(miscarriage.kind).toBe("answer");
    expect(miscarriage.citations[0]?.slug).toBe("recurrent-pregnancy-loss");
    const excision = askGuide("Is excision surgery worth it?", []);
    expect(excision.kind).toBe("answer");
    expect(excision.citations[0]?.slug).toBe("endometriosis");
  });

  it("matches keywords at the start of a word, never inside one", () => {
    // Regression: "endo" matched "vendor", and short words matched inside longer ones.
    expect(askGuide("Would a vendor ship my meds?", []).kind).toBe("off-topic");
    expect(askGuide("Can the door at the clinic stay open?", []).citations).toEqual([]);
    expect(askGuide("Is 50mg of letrozole right for me?", []).kind).toBe("dosing");
    expect(askGuide("How do eggs get frozen at the clinic?", []).kind).not.toBe("off-topic");
  });
});

describe("askGuide library answers", () => {
  it.each([
    ["What does a low AMH mean?", "diminished-ovarian-reserve"],
    ["How does letrozole work for PCOS?", "pcos"],
    ["What happens during excision surgery for endo?", "endometriosis"],
    ["What does sperm motility mean?", "male-factor"],
    ["Why does recurrent pregnancy loss happen?", "recurrent-pregnancy-loss"],
    ["When should we move from IUI to IVF?", "unexplained-infertility"],
  ])("answers %j from the %s article and cites it", (q, slug) => {
    const a = article(slug);
    const turn = askGuide(q, []);
    expect(turn.kind).toBe("answer");
    expect(turn.cost).toBe(CREDITS.questionCost);
    expect(turn.citations).toEqual([{ slug: a.slug, title: a.title }]);
    expect(turn.groups).toEqual(a.relatedGroups.slice(0, 2));
  });

  it("quotes the article and sends the member back to their doctor", () => {
    const a = article("pcos");
    const turn = askGuide("Tell me about PCOS", []);
    const paras = a.sections
      .slice(0, 3)
      .flatMap((s) => s.body)
      .slice(0, 3);
    expect(turn.answer).toEqual([
      `Here's what the reviewed library says about ${a.title.toLowerCase()}.`,
      ...paras,
      "Your own doctor can tell you how this applies to you.",
    ]);
  });

  it("falls back to the article for the member's own diagnosis", () => {
    const turn = askGuide("How long does treatment usually take?", ["PCOS"]);
    expect(turn.kind).toBe("answer");
    expect(turn.citations.map((c) => c.slug)).toEqual(["pcos"]);
  });

  it("says honestly when there is no reviewed answer", () => {
    const turn = askGuide("How long does treatment usually take?", []);
    expect(turn.kind).toBe("no-coverage");
    expect(turn.citations).toEqual([]);
    expect(turn.groups).toEqual(["g-waiting"]);
    expect(turn.answer[0]).toMatch(/don't have a reviewed answer/);
  });

  it("only ever cites reviewed library articles, and charges only non-crisis turns", () => {
    const slugs = ARTICLES.map((a) => a.slug);
    fc.assert(
      fc.property(fc.string(), (q) => {
        const turn = askGuide(q, []);
        expect(turn.citations.length).toBeLessThanOrEqual(1);
        for (const c of turn.citations) expect(slugs).toContain(c.slug);
        expect(turn.cost).toBe(turn.kind === "crisis" ? 0 : CREDITS.questionCost);
        expect(turn.answer.length).toBeGreaterThan(0);
      }),
    );
  });
});

describe("appointmentQuestions", () => {
  it("starts test results with understanding the results", () => {
    const qs = appointmentQuestions("Test results");
    expect(qs[0]?.topic).toBe("Understanding my results");
    expect(qs).toHaveLength(11);
  });

  it("starts a first consultation or second opinion with the plan and covers cost", () => {
    for (const type of ["First consultation", "Second opinion"]) {
      const qs = appointmentQuestions(type);
      expect(qs[0]?.topic).toBe("The plan");
      expect(qs.map((q) => q.topic)).toContain("Cost and coverage");
    }
  });

  it("puts what's on the member's mind first, trimmed and capped at 220 characters", () => {
    const qs = appointmentQuestions("Follow-up", "  whether to try another round  ");
    expect(qs[0]).toEqual({
      id: "aq-0",
      topic: "What's on my mind",
      text: "I've been wondering about this: whether to try another round. What would you suggest?",
    });
    const long = appointmentQuestions("Follow-up", "x".repeat(500))[0]?.text;
    expect(long).toContain(`${"x".repeat(220)}.`);
    expect(long).not.toContain("x".repeat(221));
  });

  it("ignores a blank on-mind note", () => {
    expect(appointmentQuestions("Follow-up", "   ")[0]?.topic).not.toBe("What's on my mind");
  });

  it("never gives a dose or a diagnosis", () => {
    for (const type of APPOINTMENT_TYPES) {
      for (const q of appointmentQuestions(type)) {
        expect(q.text.toLowerCase()).not.toMatch(/\bdose|\bmg\b|you have /);
      }
    }
  });

  it("always returns 8 to 12 questions with unique ids", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constantFrom(...APPOINTMENT_TYPES), fc.string()),
        fc.option(fc.string(), { nil: undefined }),
        (type, onMind) => {
          const qs = appointmentQuestions(type, onMind);
          expect(qs.length).toBeGreaterThanOrEqual(8);
          expect(qs.length).toBeLessThanOrEqual(12);
          expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
        },
      ),
    );
  });
});

describe("APPOINTMENT_TYPE_LIST", () => {
  it("re-exports the configured appointment types", () => {
    expect(APPOINTMENT_TYPE_LIST).toBe(APPOINTMENT_TYPES);
  });
});
