"use client";

import { useState } from "react";

/** Copies text; falls back silently where the clipboard API is unavailable. */
export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    try {
      void navigator.clipboard?.writeText(text);
    } catch {
      /* a failed copy still shows the confirmation in the prototype */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return [copied, copy];
}
