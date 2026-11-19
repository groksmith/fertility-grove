import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { detectCrisis, HELD_MESSAGE } from "@/lib/rules/crisis";

describe("detectCrisis", () => {
  it.each([
    "I want to die",
    "Some days I think about how to kill myself",
    "I just want to end my life",
    "Thinking about ending it all",
    "There's no reason to live anymore",
    "I keep wanting to hurt myself",
    "I've been struggling with self harm again",
    "self-harm urges are back",
    "I've had thoughts of suicide",
    "feeling suicidal today",
    "They'd be better off without me",
  ])("flags %j as a signal", (text) => {
    expect(detectCrisis(text)).toBe("signal");
  });

  it("ignores case", () => {
    expect(detectCrisis("I WANT TO DIE")).toBe("signal");
    expect(detectCrisis("Suicidal")).toBe("signal");
    expect(detectCrisis("Kill Myself TONIGHT")).toBe("high");
  });

  it("finds phrases amid surrounding whitespace and punctuation", () => {
    expect(detectCrisis("   want to die   ")).toBe("signal");
    expect(detectCrisis("\n\tsuicidal\n")).toBe("signal");
  });

  it("finds phrases split by extra spaces or line breaks, and run-together spellings", () => {
    // Regression: spacing inside a phrase was not normalised.
    expect(detectCrisis("I  want  to  die")).toBe("signal");
    expect(detectCrisis("I could kill\nmyself")).toBe("signal");
    expect(detectCrisis("thinking about selfharm")).toBe("signal");
    expect(detectCrisis("I want to\tdie, pills tonight")).toBe("high");
    expect(detectCrisis("honestly...i want to die.")).toBe("signal");
  });

  it.each([
    "I have a plan tonight to end my life",
    "I've saved up pills, I want to die",
    "This is goodbye forever, I'm going to kill myself",
    "suicidal and my plan is ready",
  ])("flags %j as high confidence", (text) => {
    expect(detectCrisis(text)).toBe("high");
  });

  it("needs a crisis phrase before plan words count", () => {
    expect(detectCrisis("Trigger shot tonight, then retrieval Friday")).toBe("none");
    expect(detectCrisis("My plan is to start IVF in March")).toBe("none");
    expect(detectCrisis("Which pills did your clinic prescribe?")).toBe("none");
  });

  it.each([
    "",
    "Day 5 transfer went well, fingers crossed!",
    "My AMH came back low and I'm scared",
    "This two week wait is killing me",
    "I'm dying to know my beta result",
    "Does letrozole make anyone else feel tired?",
  ])("does not flag ordinary text %j", (text) => {
    expect(detectCrisis(text)).toBe("none");
  });

  it("always returns one of the three levels and never throws", () => {
    fc.assert(
      fc.property(fc.fullUnicodeString(), (s) => {
        expect(["none", "signal", "high"]).toContain(detectCrisis(s));
      }),
    );
  });

  it("is never fooled by appending ordinary text to a crisis phrase", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (before, after) => {
        expect(detectCrisis(`${before} want to die ${after}`)).not.toBe("none");
      }),
    );
  });
});

describe("HELD_MESSAGE", () => {
  it("tells the member the post is held and points to 988", () => {
    expect(HELD_MESSAGE).toContain("held your post");
    expect(HELD_MESSAGE).toContain("988");
  });
});
