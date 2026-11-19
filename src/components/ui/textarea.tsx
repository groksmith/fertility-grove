"use client";

import { fieldProps, inputBase, useField } from "./field";

export function Textarea({
  className = "",
  max,
  hardStop,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  max?: number;
  hardStop?: boolean;
  ref?: React.Ref<HTMLTextAreaElement>;
}) {
  const { border, ...a } = fieldProps(useField());
  return (
    <textarea
      className={`${inputBase} min-h-28 resize-y py-3 leading-relaxed ${border} ${className}`}
      maxLength={hardStop ? max : undefined}
      {...a}
      {...rest}
    />
  );
}
