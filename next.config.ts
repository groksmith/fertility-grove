import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // 90 for the painted backdrops, which soften visibly at the default 75.
  images: { qualities: [75, 90] },
  // Home was renamed Feed, and the profile now lives on the Dashboard. Old
  // links and bookmarks still land; query strings (?edit=1) pass through.
  async redirects() {
    return [
      { source: "/home", destination: "/feed", permanent: false },
      { source: "/profile", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;
