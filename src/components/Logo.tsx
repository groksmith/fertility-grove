/* The Fertility Grove logo exactly as on fertilitygrove.com: the orange with
   its leaf beside "fertility GROVE". The files come from the live site; never
   redraw, recolour or replace them. The "fg" tile is the app icon only. */

import Image from "next/image";

const RATIO = 1295 / 473;

export function Logo({ height = 40, className = "", priority = false }: { height?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/logo.png"
      alt="Fertility Grove"
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      className={`select-none ${className}`}
    />
  );
}

/** The orange on its own: compact headers, avatars for the team, favicons. */
export function LogoOrange({ size = 28, className = "" }: { size?: number; className?: string }) {
  return <Image src="/brand/orange.png" alt="" aria-hidden width={size} height={Math.round(size * (322 / 297))} className={className} />;
}

/** The "fg" app icon tile from the live site. */
export function AppIcon({ size = 44 }: { size?: number }) {
  return <Image src="/brand/app-icon.png" alt="Fertility Grove app icon" width={size} height={size} className="rounded-[22%]" />;
}
