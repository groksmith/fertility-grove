/* The member's tree, Seed → Orange Tree (PRD §13), drawn from the brand's own
   watercolour orange tree (the final painting of the fertilitygrove.com growth
   film). Seed is a painted citrus pip in soil; Bush, Tree and Blossom Tree are
   the same canopy before fruit, Blossom Tree in white orange blossom.
   `TreeArt` fits each level to its square; `STAGE_SRC` keeps one shared scale
   and ground so the five read as a growth plate. `TreeGlyph` is the 16px mark
   beside every name, coloured from that art. */

import Image from "next/image";
import type { TreeLevel } from "@/lib/types";

export const TREE_SRC: Record<TreeLevel, string> = {
  Seed: "/brand/art/tree-seed.webp",
  Bush: "/brand/art/tree-bush.webp",
  Tree: "/brand/art/tree-tree.webp",
  "Blossom Tree": "/brand/art/tree-blossom.webp",
  "Orange Tree": "/brand/art/tree-orange.webp",
};

/** The same five at one scale, standing on one ground line. */
export const STAGE_SRC: Record<TreeLevel, string> = {
  Seed: "/brand/art/stage-seed.webp",
  Bush: "/brand/art/stage-bush.webp",
  Tree: "/brand/art/stage-tree.webp",
  "Blossom Tree": "/brand/art/stage-blossom.webp",
  "Orange Tree": "/brand/art/stage-orange.webp",
};

export function TreeArt({
  level,
  size = 120,
  animate = false,
  title,
}: {
  level: TreeLevel;
  size?: number | string;
  animate?: boolean;
  title?: string;
}) {
  const cls = animate ? "grow-part" : "";
  if (typeof size === "string") {
    return (
      <span className="relative block aspect-square w-full" style={{ maxWidth: size === "100%" ? undefined : size }}>
        <Image src={TREE_SRC[level]} alt={title ?? ""} aria-hidden={title ? undefined : true} fill sizes="240px" className={`object-contain ${cls}`} />
      </span>
    );
  }
  return (
    <Image
      src={TREE_SRC[level]}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      width={size}
      height={size}
      className={`shrink-0 object-contain ${cls}`}
    />
  );
}

const G = {
  canopy: "#3c4a2a",
  leaf: "var(--brand-leaf)",
  trunk: "#5a4634",
  fruit: "var(--brand-orange)",
  blossom: "#ffffff",
  blossomEdge: "#b9b9ad",
  blossomEye: "#f4d65c",
};

/** The small tree beside a name. Bold silhouettes so it reads at 14–20px. */
export function TreeGlyph({ level, size = 16 }: { level: TreeLevel; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className="shrink-0">
      {level === "Seed" && (
        <g>
          <path d="M8 14.5 L8 8.5" stroke={G.trunk} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 9.5 Q3 9 3.2 4.6 Q7.4 5.4 8 9.5Z" fill={G.leaf} />
          <path d="M8 8.6 Q12.8 8.4 12.8 3.6 Q8.6 4.2 8 8.6Z" fill={G.canopy} />
        </g>
      )}
      {level === "Bush" && (
        <g>
          <path d="M8 15 L8 5" stroke={G.trunk} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M8 11 Q3 11 2.6 7 Q7 7.6 8 11Z" fill={G.leaf} />
          <path d="M8 9 Q13 9 13.4 5 Q9 5.6 8 9Z" fill={G.canopy} />
          <path d="M8 6.5 Q5.4 4 8 1 Q10.6 4 8 6.5Z" fill={G.leaf} />
        </g>
      )}
      {level !== "Seed" && level !== "Bush" && (
        <g>
          <rect x="7.1" y="8.5" width="1.8" height="6.5" rx="0.8" fill={G.trunk} />
          <circle cx="8" cy="6.4" r="5.6" fill={G.canopy} />
          <circle cx="6.2" cy="5.2" r="2.6" fill={G.leaf} opacity="0.85" />
          {level === "Blossom Tree" && (
            <g stroke={G.blossomEdge} strokeWidth="0.5">
              <circle cx="10.4" cy="4.6" r="1.8" fill={G.blossom} />
              <circle cx="5.2" cy="8" r="1.6" fill={G.blossom} />
              <circle cx="10.4" cy="4.6" r="0.6" fill={G.blossomEye} stroke="none" />
              <circle cx="5.2" cy="8" r="0.55" fill={G.blossomEye} stroke="none" />
            </g>
          )}
          {level === "Orange Tree" && (
            <g>
              <circle cx="10.5" cy="5" r="1.9" fill={G.fruit} />
              <circle cx="5.4" cy="8.2" r="1.7" fill={G.fruit} />
              <circle cx="9.4" cy="9.2" r="1.4" fill={G.fruit} />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
