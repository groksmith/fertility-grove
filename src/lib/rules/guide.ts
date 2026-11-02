/* A deterministic stand-in for the Grove Guide AI, PRD v2.0 §17. It answers
   only from the six reviewed articles, cites them, and follows the guardrail
   table: crisis first, then emergency, dosing, diagnosis, off-topic, emotional
   support, then a library answer or an honest "no reviewed answer yet". */

import { ARTICLES } from "../data/articles";
import { APPOINTMENT_TYPES, CREDITS } from "../options";
import type { AppointmentQuestion, GuideReplyKind, GuideTurn } from "../types";
import { detectCrisis } from "./crisis";

const has = (q: string, words: string[]) => words.some((w) => q.includes(w));

const KEYWORDS: Record<string, string[]> = {
  endometriosis: ["endo", "endometrio", "excision", "laparoscop"],
  pcos: ["pcos", "polycystic", "letrozole", "clomid", "ovulat"],
  "diminished-ovarian-reserve": ["amh", "ovarian reserve", "dor", "antral", "donor egg", "low reserve", "retrieval"],
  "male-factor": ["semen", "sperm", "motility", "morphology", "icsi", "urolog", "male factor"],
  "recurrent-pregnancy-loss": ["loss", "miscarr", "rpl", "recurrent"],
  "unexplained-infertility": ["unexplained", "iui", "normal tests", "no cause", "workup", "ivf"],
};

const FERTILITY_WORDS = [
  "fertil", "ivf", "iui", "egg", "sperm", "embryo", "transfer", "cycle", "ovul", "pregnan",
  "amh", "clinic", "doctor", "test", "period", "hormone", "uterus", "conceive", "treatment",
  "consult", "diagnos", "endo", "pcos", "loss", "partner",
];

function classify(q: string): GuideReplyKind {
  if (detectCrisis(q) !== "none") return "crisis";
  if (has(q, ["heavy bleeding", "severe pain", "can't breathe", "fainted", "emergency", "ohss"])) return "emergency";
  if (has(q, ["dose", "dosage", "how much should i take", "mg", "skip my injection", "stop taking", "double up"])) return "dosing";
  if (has(q, ["do i have", "diagnose me", "what's wrong with me", "is it my", "am i infertile"])) return "diagnosis";
  if (has(q, ["sad", "scared", "alone", "overwhelmed", "hopeless", "exhausted", "can't cope", "crying"])) return "emotional";
  if (!has(q, FERTILITY_WORDS)) return "off-topic";
  return "answer";
}

export function askGuide(question: string, profileDiagnoses: string[]): GuideTurn {
  const q = question.toLowerCase();
  const kind = classify(q);
  const id = `gt-${Date.now()}`;
  const base = { id, question, citations: [], groups: [] as string[] };

  switch (kind) {
    case "crisis":
      // Crisis replies are free and stop the normal answer.
      return {
        ...base,
        kind,
        cost: 0,
        answer: [
          "I'm really glad you told me. You don't have to carry this by yourself.",
          "If you're thinking about ending your life or hurting yourself, please reach out now. The people at 988 are there for exactly this, any time of day.",
        ],
      };
    case "emergency":
      return {
        ...base,
        kind,
        cost: CREDITS.questionCost,
        answer: [
          "This could need care right away. Please call your clinic's after-hours line now, or call 911 or go to the nearest emergency room if it feels severe or is getting worse.",
          "I can't assess symptoms, and this isn't something to wait on.",
        ],
      };
    case "dosing":
      return {
        ...base,
        kind,
        cost: CREDITS.questionCost,
        answer: [
          "I can't advise on medication doses or changing how you take a medication. Your clinic can, and they'd want to hear from you. Most clinics have a nurse line for exactly these questions.",
          "If it helps, I can make a list of questions to bring to them.",
        ],
      };
    case "diagnosis":
      return {
        ...base,
        kind,
        cost: CREDITS.questionCost,
        answer: [
          "I can't diagnose, but I can help you get the most from your appointment. You could ask: which tests would rule different causes in or out, what each result would change about the plan, and how long until you'd know more.",
        ],
        groups: ["g-waiting"],
      };
    case "emotional":
      return {
        ...base,
        kind,
        cost: CREDITS.questionCost,
        answer: [
          "That sounds really heavy, and it makes sense that you feel this way. So many people here have felt the same at this point in the journey.",
          "You might find it helps to talk with people who get it. There's a group for where you are, and mentors who have been through it too.",
        ],
        groups: ["g-break"],
      };
    case "off-topic":
      return {
        ...base,
        kind,
        cost: CREDITS.questionCost,
        answer: [
          "I can only help with fertility topics, from the Fertility Grove library. Try asking about a diagnosis, a treatment step or an upcoming appointment.",
        ],
      };
  }

  // Library answer: the best-matching article, falling back to the profile's.
  let best = ARTICLES.find((a) => has(q, KEYWORDS[a.slug] ?? []));
  if (!best && profileDiagnoses.length) {
    best = ARTICLES.find((a) => a.diagnoses.some((d) => profileDiagnoses.includes(d)) && has(q, ["what", "how", "why", "should"]));
  }
  if (!best) {
    return {
      ...base,
      kind: "no-coverage",
      cost: CREDITS.questionCost,
      answer: [
        "I don't have a reviewed answer for that yet. Your doctor is the best person to ask, and members in a group may have been through the same thing.",
        "I've passed the question on anonymously so the team knows people are asking.",
      ],
      groups: ["g-waiting"],
    };
  }
  const paras = best.sections.slice(0, 3).flatMap((s) => s.body).slice(0, 3);
  return {
    ...base,
    kind: "answer",
    cost: CREDITS.questionCost,
    answer: [
      `Here's what the reviewed library says about ${best.title.toLowerCase()}.`,
      ...paras,
      "Your own doctor can tell you how this applies to you.",
    ],
    citations: [{ slug: best.slug, title: best.title }],
    groups: best.relatedGroups.slice(0, 2),
  };
}

/* Appointment questions: 8–12 questions grouped by topic. Uses general
   knowledge, never a diagnosis or a dose. */
const BANK: Record<string, string[]> = {
  "Understanding my results": [
    "What did my results show, and what are the normal ranges?",
    "Which result matters most for what we do next?",
    "Is there anything you'd like to repeat or check again?",
  ],
  "The plan": [
    "What do you recommend next, and why?",
    "What are the other options, and how do they compare for someone like me?",
    "How many cycles would we try before changing the plan?",
  ],
  "Timing and logistics": [
    "How many appointments should I expect, and how early in the day?",
    "When will I hear about results, and who will call me?",
    "Who do I contact with questions between visits?",
  ],
  "Cost and coverage": [
    "Which parts are usually covered by insurance, and which aren't?",
    "Can I get a written estimate before we start?",
  ],
  "Looking after myself": [
    "Is there anything I should change or avoid during this time?",
    "What support do you offer for the emotional side of treatment?",
  ],
};

export function appointmentQuestions(type: string, onMind?: string): AppointmentQuestion[] {
  const topics =
    type === "Test results"
      ? ["Understanding my results", "The plan", "Timing and logistics", "Looking after myself"]
      : type === "First consultation" || type === "Second opinion"
        ? ["The plan", "Understanding my results", "Cost and coverage", "Timing and logistics"]
        : ["The plan", "Timing and logistics", "Looking after myself", "Cost and coverage"];
  const out: AppointmentQuestion[] = [];
  let i = 0;
  if (onMind?.trim()) {
    out.push({ id: `aq-${i++}`, topic: "What's on my mind", text: `I've been wondering about this: ${onMind.trim().slice(0, 220)}. What would you suggest?` });
  }
  for (const t of topics) {
    for (const text of BANK[t]) {
      if (out.length >= 12) break;
      out.push({ id: `aq-${i++}`, topic: t, text });
    }
  }
  return out.slice(0, Math.max(8, Math.min(12, out.length)));
}

export const APPOINTMENT_TYPE_LIST = APPOINTMENT_TYPES;
