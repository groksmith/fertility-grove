"use client";

/** A small segmented control for sort and view switches. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-raised p-1">
      {options.map((o) => (
        // biome-ignore lint/a11y/useSemanticElements: pill buttons inside a role="radiogroup"; native <input type="radio"> would need a visually-hidden-input rewrite to keep the identical pill styling
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={`press h-8 rounded-full px-3 text-[13px] font-semibold ${
            o.id === value ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
