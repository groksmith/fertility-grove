/* Domain types for the PRD v2.0 prototype. Names follow the PRD's own words
   (Sunlight, tree level, success story, family space) so screens and data read
   the same way the spec does. */

export type TreeLevel = "Seed" | "Bush" | "Tree" | "Blossom Tree" | "Orange Tree";

export type CommunityId = "womens" | "partners";

export type Hue = "green" | "coral" | "yellow" | "blue" | "pink" | "purple";

export type AccountStatus =
  | "unconfirmed"
  | "active"
  | "suspended"
  | "deletion-pending";

export type MessagePolicy = "anyone" | "following" | "no-one";

export type Badge = "mentor" | "founding-mentor" | "clinician" | "team" | "partner";

/** Someone other than the signed-in member. */
export interface Member {
  id: string;
  handle: string;
  firstName: string;
  lastInitial: string;
  showRealName: boolean;
  pronouns?: string;
  avatarHue: Hue;
  /** A grove avatar (index into AVATARS); unset shows one chosen from the id. */
  avatar?: number;
  sunlight: number;
  level: TreeLevel;
  badges: Badge[];
  community: CommunityId;
  aboutMe?: string;
  myStory?: string;
  /** Only shown when the member opted in. */
  shareJourney: boolean;
  diagnoses: string[];
  stages: string[];
  paths: string[];
  followers: number;
  messagePolicy: MessagePolicy;
  suggestMe: boolean;
  /** Only for clinicians. */
  credentials?: string;
  mentor?: MentorProfile;
  /** Members this member follows, used to decide DM vs message request. */
  follows: string[];
  joinedDaysAgo: number;
  unavailable?: "suspended" | "deleting";
}

export interface MentorProfile {
  bio: string;
  helpsWith: string[];
  capacity: number;
  activeMentees: number;
  waiting: number;
  paused: boolean;
}

export type GroupType = "Diagnosis" | "Stage" | "Topic";

export interface Group {
  id: string;
  name: string;
  description: string;
  whoFor: string;
  type: GroupType;
  tags: string[];
  readAccess: "any" | "members-only";
  rules?: string;
  status: "active" | "archived" | "draft";
  community: CommunityId | "both";
  members: number;
  postsThisWeek: number;
}

export type PostType =
  | "Question"
  | "Seeking input"
  | "Support needed"
  | "Just venting"
  | "Just sharing";

export type StoryType =
  | "Success story"
  | "Pregnancy update"
  | "Advice from the other side";

export type Source =
  | "Personal experience"
  | "Opinion"
  | "From my doctor"
  | "From research or guidelines"
  | "Clinician input";

export type Vote = 1 | -1 | 0;

export type ContentStatus = "published" | "held" | "removed" | "deleted";

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  /** One level deep: replies to a reply attach to the same top comment. */
  parentId?: string;
  mention?: string;
  body: string;
  source?: Source;
  minutesAgo: number;
  up: number;
  down: number;
  myVote: Vote;
  edited?: boolean;
  status: ContentStatus;
}

export interface Post {
  id: string;
  groupId: string;
  authorId: string;
  type: PostType;
  title: string;
  body: string;
  source: Source;
  sourceLink?: string;
  tags: string[];
  allowSharing: boolean;
  minutesAgo: number;
  up: number;
  down: number;
  myVote: Vote;
  saved: boolean;
  edited?: boolean;
  status: ContentStatus;
}

export interface Story {
  id: string;
  authorId: string;
  type: StoryType;
  title: string;
  body: string;
  diagnoses: string[];
  whatHelped: string[];
  source: Source;
  minutesAgo: number;
  up: number;
  myVote: Vote;
  comments: number;
  saved: boolean;
}

export interface Article {
  slug: string;
  title: string;
  summary: string;
  diagnosis: string;
  diagnoses: string[];
  stages: string[];
  topics: string[];
  reviewedBy: string;
  lastReviewed: string;
  nextReview: string;
  readMinutes: number;
  sections: { heading: string; body: string[] }[];
  sources: { label: string; url: string }[];
  relatedGroups: string[];
  hue: Hue;
}

export type ConversationKind = "dm" | "mentoring" | "support";

export interface Message {
  id: string;
  from: "me" | "them";
  body: string;
  minutesAgo: number;
  edited?: boolean;
  deleted?: boolean;
  attachedPostId?: string;
}

export interface Conversation {
  id: string;
  memberId: string;
  kind: ConversationKind;
  /** A first message waiting on the recipient. `incoming`: someone asked me. */
  request?: "incoming" | "outgoing";
  muted: boolean;
  unread: boolean;
  messages: Message[];
  crisisFlagged?: boolean;
}

export type MentorRequestStatus =
  | "waiting"
  | "accepted"
  | "declined"
  | "expired"
  | "ended";

export interface MentorRequest {
  id: string;
  mentorId: string;
  /** "me" when I asked; otherwise the member who asked me. */
  menteeId: string;
  message: string;
  helpWith: string[];
  status: MentorRequestStatus;
  note?: string;
  daysAgo: number;
  feedbackGiven?: boolean;
}

export type NotificationKind =
  | "reply"
  | "message"
  | "message-request"
  | "mentor"
  | "follow"
  | "level"
  | "match"
  | "partner"
  | "family"
  | "safety"
  | "credits";

export interface Notification {
  id: string;
  kind: NotificationKind;
  text: string;
  href: string;
  minutesAgo: number;
  read: boolean;
  actorId?: string;
}

export interface SunlightEvent {
  id: string;
  label: string;
  amount: number;
  daysAgo: number;
}

export interface GuideCitation {
  slug: string;
  title: string;
}

export type GuideReplyKind =
  | "answer"
  | "no-coverage"
  | "diagnosis"
  | "dosing"
  | "emergency"
  | "crisis"
  | "emotional"
  | "off-topic";

export interface GuideTurn {
  id: string;
  question: string;
  kind: GuideReplyKind;
  answer: string[];
  citations: GuideCitation[];
  groups: string[];
  cost: number;
  rating?: "helpful" | "not-helpful";
  ratingReason?: string;
}

export interface GuideChat {
  id: string;
  title: string;
  turns: GuideTurn[];
  daysAgo: number;
}

export interface AppointmentQuestion {
  id: string;
  topic: string;
  text: string;
}

export interface AppointmentList {
  id: string;
  type: string;
  date?: string;
  onMind?: string;
  questions: AppointmentQuestion[];
  sharedWithPartner?: "view" | "edit";
  daysAgo: number;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
}

export interface Purchase {
  id: string;
  packId: string;
  credits: number;
  price: number;
  status: "paid" | "failed";
  daysAgo: number;
}

export type InviteStatus = "pending" | "accepted" | "expired" | "cancelled";

export interface PartnerInvite {
  email: string;
  note?: string;
  status: InviteStatus;
  resends: number;
  daysAgo: number;
}

export type FamilyItemKind =
  | "appointment-list"
  | "journey-summary"
  | "article"
  | "guide-answer"
  | "note";

export interface FamilyItem {
  id: string;
  kind: FamilyItemKind;
  refId: string;
  title: string;
  owner: "me" | "partner";
  access: "view" | "edit";
  note?: string;
  daysAgo: number;
}

export interface NoteVersion {
  id: string;
  body: string;
  title: string;
  by: "me" | "partner";
  minutesAgo: number;
}

export interface FamilyNote {
  id: string;
  title: string;
  body: string;
  versions: NoteVersion[];
  past?: boolean;
}

export interface FamilyActivity {
  id: string;
  text: string;
  minutesAgo: number;
}

export type ReportReason =
  | "Self-harm or crisis concern"
  | "Medical misinformation"
  | "Harassment or bullying"
  | "Hate or discrimination"
  | "Sexual content"
  | "Pretending to be someone else"
  | "Spam or selling"
  | "Sharing someone's private information"
  | "Pregnancy news outside Success stories"
  | "Off topic"
  | "Other";

export interface Report {
  id: string;
  target: string;
  reason: ReportReason;
  details?: string;
  minutesAgo: number;
}
