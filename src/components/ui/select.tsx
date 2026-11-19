"use client";

import { fieldProps, inputBase, useField } from "./field";

const CHEVRON =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235c625f' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export function Select({
  className = "",
  style,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { ref?: React.Ref<HTMLSelectElement> }) {
  const { border, ...a } = fieldProps(useField());
  return (
    <select
      className={`${inputBase} h-11 appearance-none pr-10 ${border} ${className}`}
      style={{
        backgroundImage: CHEVRON,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        ...style,
      }}
      {...a}
      {...rest}
    />
  );
}
