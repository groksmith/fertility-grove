// The mock server: the stand-in for the backend until it exists. Feature services read and write it
// (TODO(api) marks each call that becomes a request); screens read it through `useStore`, the
// stand-in for TanStack Query's cache.
export {
  ARTICLE_SLUGS,
  EMPTY_ME,
  get,
  type Me,
  persona,
  replace,
  type State,
  set,
  useHydrated,
  useStore,
} from "./db";
export {
  confirmed,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  fail,
  newInviteCode,
  notify,
  ok,
  type Result,
  sunlight,
  uid,
} from "./helpers";
