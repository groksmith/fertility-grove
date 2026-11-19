import { describe, expect, it } from "vitest";
import { appointmentListSchema, appointmentQuestionSchema, guideQuestionSchema } from "./schema";

const messages = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.error?.issues.map((i) => i.message) ?? [];

describe("guide schemas", () => {
  it("leaves an empty question to the service", () => {
    expect(guideQuestionSchema.safeParse({ question: "" }).success).toBe(true);
  });

  it("asks for an appointment type, nothing else", () => {
    const r = appointmentListSchema.safeParse({ type: "", date: "", onMind: "" });
    expect(messages(r)).toEqual(["Choose the appointment type."]);
    expect(
      appointmentListSchema.safeParse({ type: "Follow-up", date: "", onMind: "" }).success,
    ).toBe(true);
  });

  it("never flags a blank question (the submit ignores it)", () => {
    expect(appointmentQuestionSchema.safeParse({ text: "   " }).success).toBe(true);
  });
});
