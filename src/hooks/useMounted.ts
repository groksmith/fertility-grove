import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** True after hydration: portals and client-only UI wait for it. */
export const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
