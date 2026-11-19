/* The one unsaved-changes guard (forms skill §5). While a form has edits nobody saved it registers a
   handler here; in-page navigation that isn't a link (switching Settings sections) asks through
   `requestLeave`, and the form's guard decides. Links and Back are caught by useUnsavedGuard. */

export type Pending =
  | { kind: "href"; href: string }
  | { kind: "back" }
  | { kind: "action"; run: () => void };

type Handler = (p: Pending) => void;

/* The form currently guarding the page, if it has unsaved edits. */
let active: Handler | null = null;

export function setNavigationGuard(handler: Handler) {
  active = handler;
}

/** Clears the guard, but only if `handler` is still the one registered. */
export function clearNavigationGuard(handler: Handler) {
  if (active === handler) active = null;
}

/** For in-page navigation that isn't a link: asks first when a form has unsaved edits, otherwise
    just runs. */
export function requestLeave(run: () => void) {
  if (active) active({ kind: "action", run });
  else run();
}
