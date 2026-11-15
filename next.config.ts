import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `next build` writes plain HTML/CSS/JS to `out/`, which
  // Spacefast hosts as a static site (no server runtime). Everything runs in
  // the browser, including Set Explorer search over the built-in catalog.
  output: "export",
  images: {
    // No image optimizer in a static export; set thumbnails load directly
    // from Rebrickable's CDN.
    unoptimized: true,
  },
};

export default nextConfig;
