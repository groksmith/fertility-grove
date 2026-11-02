/* The six launch articles, one per diagnosis (PRD v2.0 §16). The text is a
   plain-language sample written for the prototype; the reviewer is fictional
   and labelled as a sample. Real articles are clinician-reviewed before launch. */

import type { Article } from "../types";

const REVIEWER = "Dr. Lena Ortiz, MD, Reproductive Endocrinology (sample reviewer)";

export const DISCLAIMER =
  "This article shares general, reviewed information. It isn't medical advice and can't replace a conversation with your own doctor, who knows your history.";

export const ARTICLES: Article[] = [
  {
    slug: "endometriosis",
    title: "Endometriosis and fertility",
    summary:
      "What endometriosis is, how it can affect getting pregnant, and the treatment paths people usually talk through with their doctor.",
    diagnosis: "Endometriosis",
    diagnoses: ["Endometriosis"],
    stages: ["Recently diagnosed", "Pursuing treatment"],
    topics: ["Surgery", "IVF"],
    reviewedBy: REVIEWER,
    lastReviewed: "September 12, 2026",
    nextReview: "September 12, 2027",
    readMinutes: 6,
    hue: "coral",
    sections: [
      {
        heading: "What it is",
        body: [
          "Endometriosis is a condition where tissue similar to the lining of the uterus grows outside the uterus, often on the ovaries, fallopian tubes or the lining of the pelvis.",
          "It can cause painful periods, pain during sex and long-term pelvic pain, though some people have few symptoms. It is common: it affects roughly one in ten women of reproductive age.",
        ],
      },
      {
        heading: "How it can affect fertility",
        body: [
          "Endometriosis can cause inflammation and scar tissue, may block or change the shape of the tubes, and can form cysts on the ovaries called endometriomas. Many people with endometriosis still conceive, sometimes with help.",
        ],
      },
      {
        heading: "Common treatment paths",
        body: [
          "Options depend on your age, symptoms, the stage of endometriosis and how long you've been trying. They can include surgery to remove endometriosis, IUI with medication, or going straight to IVF.",
          "There's no single right order. Doctors weigh what surgery could change against the time it takes to recover.",
        ],
      },
      {
        heading: "Questions to bring to your doctor",
        body: [
          "What stage do you think my endometriosis is, and how did you decide?",
          "Would surgery change my chances with IVF, or my pain, or both?",
          "How long would I wait after surgery before starting treatment?",
        ],
      },
    ],
    sources: [
      { label: "ACOG: Endometriosis", url: "https://www.acog.org/womens-health/faqs/endometriosis" },
      { label: "NICHD: About endometriosis", url: "https://www.nichd.nih.gov/health/topics/endometri" },
    ],
    relatedGroups: ["g-endo", "g-ivf"],
  },
  {
    slug: "pcos",
    title: "PCOS and getting pregnant",
    summary:
      "How polycystic ovary syndrome affects ovulation, and the first-line steps doctors usually suggest.",
    diagnosis: "PCOS",
    diagnoses: ["PCOS", "Hormonal imbalance"],
    stages: ["Recently diagnosed", "Actively trying to conceive", "Pursuing treatment"],
    topics: ["Ovulation", "Medication"],
    reviewedBy: REVIEWER,
    lastReviewed: "August 28, 2026",
    nextReview: "August 28, 2027",
    readMinutes: 5,
    hue: "yellow",
    sections: [
      {
        heading: "What it is",
        body: [
          "Polycystic ovary syndrome (PCOS) is a common hormonal condition. It's usually diagnosed when someone has at least two of: irregular or missing ovulation, signs of higher androgen levels, and many small follicles on an ultrasound.",
        ],
      },
      {
        heading: "How it can affect fertility",
        body: [
          "The main fertility effect is irregular ovulation, which makes it harder to know when, or whether, an egg is released each cycle.",
        ],
      },
      {
        heading: "Common treatment paths",
        body: [
          "Medication to help ovulation, often letrozole, is a common first step, sometimes combined with timed intercourse or IUI. Lifestyle changes can help ovulation for some people and shouldn't delay treatment. If these don't work, injectable medications or IVF may be next.",
        ],
      },
      {
        heading: "Questions to bring to your doctor",
        body: [
          "How will we confirm whether I ovulated this cycle?",
          "How many medication cycles would you try before changing the plan?",
          "Should my insulin or thyroid levels be checked?",
        ],
      },
    ],
    sources: [
      { label: "ACOG: Polycystic ovary syndrome", url: "https://www.acog.org/womens-health/faqs/polycystic-ovary-syndrome-pcos" },
      { label: "International PCOS guideline (Monash University)", url: "https://www.monash.edu/medicine/mchri/pcos/guideline" },
    ],
    relatedGroups: ["g-pcos", "g-iui"],
  },
  {
    slug: "diminished-ovarian-reserve",
    title: "Diminished ovarian reserve",
    summary:
      "What a low AMH or antral follicle count means, what it doesn't mean, and the decisions people often face next.",
    diagnosis: "Diminished ovarian reserve",
    diagnoses: ["Diminished ovarian reserve", "Premature ovarian insufficiency"],
    stages: ["Recently diagnosed", "Pursuing treatment"],
    topics: ["AMH", "IVF", "Donor eggs"],
    reviewedBy: REVIEWER,
    lastReviewed: "October 2, 2026",
    nextReview: "October 2, 2027",
    readMinutes: 6,
    hue: "blue",
    sections: [
      {
        heading: "What it is",
        body: [
          "Ovarian reserve describes how many eggs the ovaries likely have left. Doctors estimate it with a blood test for anti-Müllerian hormone (AMH) and an ultrasound count of small follicles (antral follicle count).",
        ],
      },
      {
        heading: "What the numbers do and don't say",
        body: [
          "A low result usually predicts fewer eggs in an IVF cycle. It doesn't measure egg quality and doesn't, on its own, tell you whether you can conceive naturally.",
        ],
      },
      {
        heading: "Common treatment paths",
        body: [
          "Depending on age and goals, options include trying sooner rather than later, IVF (sometimes several retrievals to bank embryos), and using donor eggs. A second opinion can be helpful before big decisions.",
        ],
      },
      {
        heading: "Questions to bring to your doctor",
        body: [
          "What were my AMH and antral follicle count, and what do they suggest together?",
          "What protocol would you suggest, and why?",
          "How many retrievals would you expect me to need for my goals?",
        ],
      },
    ],
    sources: [
      { label: "ASRM ReproductiveFacts", url: "https://www.reproductivefacts.org" },
      { label: "MedlinePlus: Infertility", url: "https://medlineplus.gov/infertility.html" },
    ],
    relatedGroups: ["g-dor", "g-donor"],
  },
  {
    slug: "male-factor",
    title: "Male factor infertility",
    summary:
      "What a semen analysis measures, common causes of male factor infertility, and what usually happens next.",
    diagnosis: "Male factor infertility",
    diagnoses: ["Male factor infertility"],
    stages: ["Waiting on tests or a diagnosis", "Recently diagnosed", "Pursuing treatment"],
    topics: ["Testing", "ICSI"],
    reviewedBy: REVIEWER,
    lastReviewed: "September 30, 2026",
    nextReview: "September 30, 2027",
    readMinutes: 5,
    hue: "green",
    sections: [
      {
        heading: "What it is",
        body: [
          "Male factor infertility means a cause on the sperm side contributes to difficulty conceiving. It is involved in about a third to a half of couples who have trouble getting pregnant.",
        ],
      },
      {
        heading: "What the semen analysis measures",
        body: [
          "A semen analysis looks at volume, sperm count, how well sperm move (motility) and their shape (morphology). Results can vary between samples, so an abnormal result is usually repeated.",
        ],
      },
      {
        heading: "Common treatment paths",
        body: [
          "A urologist may look for treatable causes such as a varicocele or hormone imbalance. Depending on results, couples may try IUI, or IVF with ICSI, where a single sperm is injected into each egg.",
        ],
      },
      {
        heading: "Questions to bring to your doctor",
        body: [
          "Should I see a urologist who specialises in male fertility?",
          "Is it worth repeating the analysis, or testing hormones or DNA fragmentation?",
          "Are there changes that could help in the next three months?",
        ],
      },
    ],
    sources: [
      { label: "Urology Care Foundation: Male infertility", url: "https://www.urologyhealth.org/urology-a-z/m/male-infertility" },
      { label: "WHO: Infertility fact sheet", url: "https://www.who.int/news-room/fact-sheets/detail/infertility" },
    ],
    relatedGroups: ["g-mf", "g-partners"],
  },
  {
    slug: "recurrent-pregnancy-loss",
    title: "Recurrent pregnancy loss",
    summary:
      "What testing after repeated losses usually includes, and why many people go on to have a successful pregnancy.",
    diagnosis: "Recurrent pregnancy loss",
    diagnoses: ["Recurrent pregnancy loss"],
    stages: ["Recently diagnosed", "Taking a break"],
    topics: ["Testing", "Grief"],
    reviewedBy: REVIEWER,
    lastReviewed: "September 5, 2026",
    nextReview: "September 5, 2027",
    readMinutes: 6,
    hue: "pink",
    sections: [
      {
        heading: "What it is",
        body: [
          "Recurrent pregnancy loss usually means two or more pregnancy losses. Each loss is painful, and repeated loss carries its own grief.",
        ],
      },
      {
        heading: "What testing can include",
        body: [
          "An evaluation may look at the shape of the uterus, hormone and thyroid levels, blood-clotting conditions such as antiphospholipid syndrome, and chromosomes of both partners.",
          "In about half of cases no cause is found. That can feel frustrating, but many people in that group go on to have a successful pregnancy.",
        ],
      },
      {
        heading: "Support matters",
        body: [
          "Early, frequent check-ins in a future pregnancy can help some people feel more supported. Counselling and peer support are part of care, not an extra.",
        ],
      },
      {
        heading: "Questions to bring to your doctor",
        body: [
          "Which tests do you recommend for us, and why?",
          "If nothing is found, what would you suggest for a next pregnancy?",
          "What support is available for the grief we're carrying?",
        ],
      },
    ],
    sources: [
      { label: "ACOG: Repeated miscarriages", url: "https://www.acog.org/womens-health/faqs/repeated-miscarriages" },
      { label: "ASRM ReproductiveFacts", url: "https://www.reproductivefacts.org" },
    ],
    relatedGroups: ["g-rpl", "g-break"],
  },
  {
    slug: "unexplained-infertility",
    title: "Unexplained infertility",
    summary:
      "What it means when every test is normal, and the usual steps from timed cycles to IVF.",
    diagnosis: "Unexplained",
    diagnoses: ["Unexplained", "Not diagnosed yet"],
    stages: ["Pursuing treatment", "Actively trying to conceive"],
    topics: ["IUI", "IVF"],
    reviewedBy: REVIEWER,
    lastReviewed: "October 9, 2026",
    nextReview: "October 9, 2027",
    readMinutes: 5,
    hue: "purple",
    sections: [
      {
        heading: "What it is",
        body: [
          "Unexplained infertility is the diagnosis when standard testing of ovulation, tubes, the uterus and sperm comes back normal, but pregnancy hasn't happened. It's common, and it doesn't mean nothing can be done.",
        ],
      },
      {
        heading: "Common treatment paths",
        body: [
          "Many doctors suggest a few cycles of medication with IUI before moving to IVF; others move to IVF sooner depending on age and how long you've been trying. IVF can also reveal information testing can't, such as how eggs fertilize.",
        ],
      },
      {
        heading: "Looking after yourself",
        body: [
          "Not having a reason can be one of the hardest parts. Many people find it helps to set a plan with checkpoints, so each cycle has a clear next step.",
        ],
      },
      {
        heading: "Questions to bring to your doctor",
        body: [
          "How many IUI cycles would you try before suggesting IVF?",
          "Is there any testing we haven't done that would change the plan?",
          "How does my age change the timeline you'd recommend?",
        ],
      },
    ],
    sources: [
      { label: "MedlinePlus: Infertility", url: "https://medlineplus.gov/infertility.html" },
      { label: "ASRM ReproductiveFacts", url: "https://www.reproductivefacts.org" },
    ],
    relatedGroups: ["g-unexplained", "g-iui"],
  },
];

export const articleBySlug = (slug: string) => ARTICLES.find((a) => a.slug === slug);

/** Each article's painted cover: an open book with its topic beside it, on its tint. */
export const articleCover = (slug: string) => `/brand/learn/${slug}.webp`;
