import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  // LAN/Tailscale hosts used to open the dev server from other devices.
  allowedDevOrigins: ["100.66.120.126", "127.210.108.239"],
  // Sauna photos are compressed in the browser first; this is headroom for large originals.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  images: {
    // 90 for galleries and photo tiles, 75 (the default) for everything else.
    qualities: [75, 90],
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      // Sauna photos uploaded in /admin/pirtis (public `sauna-photos` bucket).
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/sauna-photos/**" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
