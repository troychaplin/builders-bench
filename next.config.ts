import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents and partialPrefetching are deliberately off: with them on,
  // every page request timed out in Spacefast's Next.js runtime (API routes and
  // images were fine). Re-test a Spacefast deploy before turning them back on.
  images: {
    // Set thumbnails from the built-in dataset and Rebrickable live search.
    remotePatterns: [new URL('https://cdn.rebrickable.com/media/**')],
  },
};

export default nextConfig;
