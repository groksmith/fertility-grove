export type PostType =
  | "Question"
  | "Seeking Input"
  | "Support Needed"
  | "Just Venting"
  | "Just Sharing";

export const POST_TYPES: PostType[] = [
  "Question",
  "Seeking Input",
  "Support Needed",
  "Just Venting",
  "Just Sharing",
];

export type JourneyStage =
  | "Recently diagnosed"
  | "Actively trying to conceive"
  | "Pursuing treatment"
  | "I am a partner / spouse"
  | "Just looking for information and support"
  | "Prefer not to share";

export const JOURNEY_STAGES: JourneyStage[] = [
  "Recently diagnosed",
  "Actively trying to conceive",
  "Pursuing treatment",
  "I am a partner / spouse",
  "Just looking for information and support",
  "Prefer not to share",
];

export const DIAGNOSES = [
  "PCOS",
  "Endometriosis",
  "Premature Ovarian Insufficiency",
  "Thyroid Disorder",
  "Male Factor Infertility",
  "Uterine Fibroids or Polyps",
  "Diminished Ovarian Reserve",
  "Recurrent Pregnancy Loss",
  "Autoimmune Disorder",
  "Hormonal Imbalance",
  "Unexplained",
] as const;

export const GENDER_IDENTITIES = [
  "Female",
  "Male",
  "Non-binary",
  "Transgender female",
  "Transgender male",
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

export type ProviderCategory =
  | "IVF"
  | "IUI"
  | "Talk Therapy"
  | "Home Support"
  | "Medication"
  | "Acupuncture"
  | "Nutrition"
  | "Psychiatry"
  | "Red Light Therapy"
  | "Massage Therapy"
  | "Supplements"
  | "Reiki";

export interface Author {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  anonymous?: boolean;
}

export interface Comment {
  id: string;
  author: Author;
  body: string;
  createdAt: string;
}

export interface Post {
  id: string;
  community: string;
  groupId?: string;
  title: string;
  body: string;
  author: Author;
  createdAt: string;
  type: PostType;
  tags: string[];
  likes: number;
  liked?: boolean;
  saved?: boolean;
  comments: Comment[];
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  postsToday: number;
  avgPostsDaily: number;
  createdOn: string;
  color: string;
  joined?: boolean;
  stages?: string[];
}

export interface ProviderReview {
  author: string;
  body: string;
}

export interface Provider {
  id: string;
  name: string;
  categories: ProviderCategory[];
  distance: number;
  city: string;
  state: string;
  usedBy: number;
  reviewCount: number;
  reviews: ProviderReview[];
  delivery: "In-Person" | "Virtual" | "Both";
  diagnoses: string[];
  logoBg: string;
  logoInk: string;
  website?: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  provider: string;
  wanted: number;
  fulfilled: number;
}

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  owner: string;
  ownerHandle: string;
  city: string;
  state: string;
  goal: number;
  raised: number;
  cover: string;
  story: string;
  supporters: {
    name: string;
    amount: number;
    message?: string;
    when: string;
  }[];
  endsOn: string;
  beneficiaries: string[];
  status: "Draft" | "Live" | "Closed";
  wishlist: WishlistItem[];
}

export const ARTICLE_SECTIONS = [
  "Diagnoses & Conditions",
  "Treatments & Medical Procedures",
  "Lifestyle and Holistic Approaches",
  "Emotional and Mental Wellbeing",
  "Frequently Asked Questions (FAQs)",
  "Glossary & Resources",
] as const;

export type ArticleSection = (typeof ARTICLE_SECTIONS)[number];

export interface Article {
  id: string;
  slug: string;
  section: ArticleSection;
  title: string;
  summary: string;
  body: string[];
  reviewedBy: string;
  reviewedOn: string;
  careCategory?: ProviderCategory;
  related: string[];
}

export interface Message {
  id: string;
  from: "me" | "them";
  body: string;
  at: string;
  day: string;
}

export interface Conversation {
  id: string;
  person: Author;
  status: "online" | "away" | "offline";
  preview: string;
  time: string;
  unread?: boolean;
  messages: Message[];
}

export interface Todo {
  id: string;
  title: string;
  done: boolean;
}

