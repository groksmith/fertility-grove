/* Option lists exactly as PRD v2.0 §5, §9, §10, §17 and §19 name them. Admins
   edit these in the real product; the prototype fixes them here. */

import type { PostType, ReportReason, Source, StoryType } from "./types";

export const JOURNEY_STAGES = [
  "Actively trying to conceive",
  "Waiting on tests or a diagnosis",
  "Recently diagnosed",
  "Pursuing treatment",
  "Pregnant after infertility",
  "Taking a break",
  "Moving forward without treatment",
  "I am a partner / spouse",
  "Just looking for information and support",
  "Prefer not to share",
] as const;

export const TREATMENTS = [
  "IUI",
  "IVF",
  "Egg freezing",
  "Embryo freezing or transfer",
  "Medication only",
  "Other",
] as const;

export const DIAGNOSES = [
  "PCOS",
  "Endometriosis",
  "Premature ovarian insufficiency",
  "Thyroid disorder",
  "Male factor infertility",
  "Uterine fibroids or polyps",
  "Diminished ovarian reserve",
  "Recurrent pregnancy loss",
  "Autoimmune disorder",
  "Hormonal imbalance",
  "Tubal factor",
  "Unexplained",
  "Not diagnosed yet",
  "Other",
] as const;

export const PATHS = [
  "Own eggs and sperm",
  "Donor eggs",
  "Donor sperm",
  "Donor embryos",
  "Surrogacy or gestational carrier",
  "Not sure yet",
] as const;

export const GENDERS = [
  "Female",
  "Male",
  "Non-binary",
  "Transgender female",
  "Transgender male",
  "Genderqueer or gender fluid",
  "Agender",
  "Two-spirit",
  "Intersex",
  "Prefer to self-describe",
  "Prefer not to say",
] as const;

export const PRONOUNS = [
  "she/her",
  "he/him",
  "they/them",
  "she/they",
  "he/they",
  "Prefer to self-describe",
  "Prefer not to say",
] as const;

export const AGE_RANGES = [
  "Under 30",
  "30 to 34",
  "35 to 37",
  "38 to 40",
  "41 to 44",
  "45 and over",
] as const;

export const LOOKING_FOR = [
  "People in my exact situation",
  "A mentor who has been through it",
  "Trusted information about my diagnosis",
  "Help preparing for doctor visits",
  "Support as a partner, or for my partner",
  "Hope from success stories",
  "A safe place to vent",
  "Just exploring for now",
] as const;

export const CONNECT_STYLES = [
  "Reading and learning first",
  "Talking in groups",
  "One-to-one conversations",
  "A mix of everything",
] as const;

export const COMMUNITIES = {
  womens: {
    name: "Women's Community",
    blurb:
      "A space for women navigating diagnosis, treatment, and everything around it.",
  },
  partners: {
    name: "Partners & Men's Community",
    blurb:
      "For partners, spouses, and men on the fertility journey. A room where somebody finally asks about you.",
  },
} as const;

export const POST_TYPES: PostType[] = [
  "Question",
  "Seeking input",
  "Support needed",
  "Just venting",
  "Just sharing",
];

export const POST_TYPE_HELP: Record<PostType, string> = {
  Question: "Answers are sorted by votes.",
  "Seeking input": "Comments are sorted by votes.",
  "Support needed": "Replies offer support, not advice. No downvotes.",
  "Just venting": "You're not asking for advice. No downvotes.",
  "Just sharing": "Comments are sorted by newest.",
};

/** Post types that never take a downvote, on the post or any of its comments. */
export const NO_DOWNVOTE: PostType[] = ["Support needed", "Just venting"];

export const SOURCES: Source[] = [
  "Personal experience",
  "Opinion",
  "From my doctor",
  "From research or guidelines",
  "Clinician input",
];

export const TOPIC_TAGS = [
  "IVF",
  "IUI",
  "AMH",
  "Insurance",
  "Two-week wait",
  "Egg retrieval",
  "Embryo transfer",
  "Work and treatment",
  "Relationships",
  "Mental health",
  "Nutrition",
  "Testing",
] as const;

export const STORY_TYPES: StoryType[] = [
  "Success story",
  "Pregnancy update",
  "Advice from the other side",
];

export const WHAT_HELPED = [...JOURNEY_STAGES.slice(0, 7), ...PATHS.slice(0, 5)];

export const APPOINTMENT_TYPES = [
  "First consultation",
  "Follow-up",
  "Test results",
  "Monitoring scan",
  "Egg retrieval",
  "Embryo transfer",
  "Second opinion",
  "Other",
] as const;

export const REPORT_REASONS: ReportReason[] = [
  "Self-harm or crisis concern",
  "Medical misinformation",
  "Harassment or bullying",
  "Hate or discrimination",
  "Sexual content",
  "Pretending to be someone else",
  "Spam or selling",
  "Sharing someone's private information",
  "Pregnancy news outside Success stories",
  "Off topic",
  "Other",
];

/** Crisis resources shown everywhere crisis content can appear. US services. */
export const CRISIS = {
  call: "tel:988",
  text: "sms:988",
  chat: "https://988lifeline.org/chat/",
  line: "Call or text 988, the Suicide & Crisis Lifeline. Free, confidential, 24/7.",
};

/** Sample values: the PRD leaves every credit number blank (§18, §27). */
export const CREDITS = {
  freePerMonth: 20,
  questionCost: 1,
  appointmentListCost: 3,
  lowWarning: 3,
  packsPerDay: 5,
  packs: [
    { id: "sprout", name: "Sprout", credits: 25, price: 4.99 },
    { id: "grove", name: "Grove", credits: 60, price: 9.99 },
    { id: "orchard", name: "Orchard", credits: 150, price: 19.99 },
  ],
};

export const RESERVED_HANDLES = [
  "fertilitygrove",
  "support",
  "admin",
  "moderator",
  "staff",
  "official",
];
