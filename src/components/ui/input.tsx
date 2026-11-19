"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { fieldProps, inputBase, useField } from "./field";

/** React 19: `ref` is a prop (no forwardRef). */
export function Input({
  className = "",
  ref,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> }) {
  const { border, ...a } = fieldProps(useField());
  // Emails are never spell-checked or auto-capitalised.
  const email = rest.type === "email" ? { spellCheck: false, autoCapitalize: "none" } : {};
  return (
    <input
      ref={ref}
      className={`${inputBase} h-11 ${border} ${className}`}
      {...a}
      {...email}
      {...rest}
    />
  );
}

export function PasswordInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> },
) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute inset-y-0 right-1 my-auto grid h-9 w-10 place-items-center rounded-full text-muted hover:text-ink"
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
