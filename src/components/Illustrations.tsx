"use client";

/* Artwork exported verbatim from the Figma file into /public/illustrations.
   Rendered as <img> so the SVG payload stays out of the JS bundle. */

export function FigmaArt({
  name,
  className = "",
  alt = "",
}: {
  name: string;
  className?: string;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/illustrations/${name}.svg`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={className}
    />
  );
}

/* Confetti field for the final onboarding step — the Figma frame fills the
   whole left panel diagonally rather than sitting in a centred block. */
export function ConfettiField() {
  const colors = ["#42C074", "#F48265", "#85C5F9", "#FFD339", "#A874DB", "#F97AB3"];
  return (
    <svg
      viewBox="0 0 600 900"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden
    >
      {Array.from({ length: 120 }, (_, i) => {
        const seed = (i * 7919) % 9973;
        const x = (seed % 560) + 20;
        const y = ((seed * 13) % 860) + 20;
        if (x + y > 980) return null;
        const c = colors[i % colors.length];
        const rot = seed % 90;
        if (i % 3 === 0)
          return <circle key={i} cx={x} cy={y} r={5} fill={c} />;
        if (i % 3 === 1)
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="13"
              height="8"
              rx="2"
              fill={c}
              transform={`rotate(${rot} ${x} ${y})`}
            />
          );
        return (
          <path
            key={i}
            d={`M${x} ${y}q7 -9 14 0t14 0`}
            fill="none"
            stroke={c}
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}
