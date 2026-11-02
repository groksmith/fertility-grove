import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // 90 for the painted backdrops, which soften visibly at the default 75.
  images: { qualities: [75, 90] },
};

export default nextConfig;
