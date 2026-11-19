"use client";

/** Small toggleable chips, e.g. topic tags and filters. */
export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  max,
  label,
  labelOf = (v) => v,
}: {
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  max?: number;
  label: string;
  labelOf?: (v: T) => string;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: role="group" labels these buttons as one control; <fieldset> adds UA border, padding and min-width that would break the inline layout
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        const full = !on && max !== undefined && value.length >= max;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            disabled={full}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`press h-9 rounded-full border px-3.5 text-[14px] font-medium ${
              on
                ? "border-accent bg-accent text-white"
                : "border-line-strong bg-white text-ink-soft hover:border-ink"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {labelOf(o)}
          </button>
        );
      })}
    </div>
  );
}
