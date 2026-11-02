"use client";

/* Unsaved changes. While a form has edits nobody saved, leaving asks first:
   a link anywhere in the app (sidebar, tab bar, menu, in-page links) or the
   browser's Back button opens a dialog to save and leave, leave without
   saving, or keep editing. Closing or reloading the tab gets the browser's own
   prompt, the only one browsers allow there. */

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Dialog } from "@/components/ui";

type Pending = { kind: "href"; href: string } | { kind: "back" } | { kind: "action"; run: () => void };

/* The form currently guarding the page, if it has unsaved edits. */
let active: ((p: Pending) => void) | null = null;

/** For in-page navigation that isn't a link (switching Settings sections):
    asks first when a form has unsaved edits, otherwise just runs. */
export function requestLeave(run: () => void) {
  if (active) active({ kind: "action", run });
  else run();
}

/**
 * `dirty`: the form has unsaved edits. `onSave`: save them; return false if
 * the form can't save yet (it shows its own errors and the member stays).
 * Render the returned `ui` anywhere in the form, and navigate with `leaveTo`
 * after a successful submit.
 */
export function useUnsavedGuard({ dirty, onSave }: { dirty: boolean; onSave?: () => boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const live = useRef({ dirty, leaving: false });
  useEffect(() => {
    live.current.dirty = dirty;
  }, [dirty]);
  const guardPushed = useRef(false);
  const ignorePop = useRef(false);
  const afterPop = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!dirty) return;
    active = setPending;
    return () => {
      if (active === setPending) active = null;
    };
  }, [dirty]);

  // Closing or reloading the tab.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (live.current.leaving) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Any same-site link: catch the click before Next navigates.
  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      if (live.current.leaving || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      // Jumping within the page (a #section) isn't leaving.
      if (url.pathname === location.pathname && url.search === location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setPending({ kind: "href", href: url.pathname + url.search + url.hash });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty]);

  // The Back button: keep one extra entry on top while dirty, so Back lands
  // on this same page and we can ask. Next's own history state is copied so
  // the router treats that entry as this page.
  useEffect(() => {
    if (dirty && !guardPushed.current) {
      history.pushState(history.state, "", location.href);
      guardPushed.current = true;
    }
    if (!dirty && guardPushed.current && !live.current.leaving) {
      // Saved in place: quietly drop the extra entry.
      guardPushed.current = false;
      ignorePop.current = true;
      history.back();
    }
  }, [dirty]);

  useEffect(() => {
    const onPop = () => {
      if (ignorePop.current) {
        ignorePop.current = false;
        const run = afterPop.current;
        afterPop.current = null;
        run?.();
        return;
      }
      if (!guardPushed.current || live.current.leaving) return;
      // Back was pressed: put the guard back and ask.
      history.pushState(history.state, "", location.href);
      setPending({ kind: "back" });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /** Navigate away on purpose (after leaving, or after a form submits). The
      guard entry is replaced by the next page, so Back skips this copy. */
  const leaveTo = (href: string) => {
    live.current.leaving = true;
    if (guardPushed.current) {
      guardPushed.current = false;
      router.replace(href);
    } else router.push(href);
  };

  const leave = (p: Pending) => {
    live.current.leaving = true;
    setPending(null);
    if (p.kind === "href") leaveTo(p.href);
    else if (p.kind === "action") {
      // Staying on this page (another section): the form's edits are dropped.
      live.current.leaving = false;
      if (active === setPending) active = null;
      if (guardPushed.current) {
        // Drop the guard entry first; run once the browser has stepped back.
        guardPushed.current = false;
        ignorePop.current = true;
        afterPop.current = p.run;
        history.back();
      } else p.run();
    } else {
      guardPushed.current = false;
      history.go(-2);
    }
  };

  const ui = (
    <Dialog
      open={!!pending}
      onClose={() => setPending(null)}
      title="You have unsaved changes"
      description="If you leave now, what you've changed on this page won't be kept."
    >
      <div className="flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
        {onSave && (
          <Button
            onClick={() => {
              const p = pending;
              if (!p) return;
              if (onSave()) leave(p);
              else setPending(null);
            }}
          >
            Save and leave
          </Button>
        )}
        <Button variant="secondary" onClick={() => pending && leave(pending)}>
          Leave without saving
        </Button>
        <Button variant="ghost" onClick={() => setPending(null)}>
          Keep editing
        </Button>
      </div>
    </Dialog>
  );

  return { ui, leaveTo };
}
