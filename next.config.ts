import type { NextConfig } from "next";

/** Basic hardening for every page except the booking widgets, which proxy.ts frames for allowed origins only. */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // /registracija takes a photo with the camera; nothing else needs a sensor.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: false,
  // LAN/Tailscale hosts used to open the dev server from other devices, plus
  // 127.0.0.1 for browser automation tools that can't resolve "localhost".
  allowedDevOrigins: ["100.66.120.126", "127.210.108.239", "127.0.0.1"],
  // Sauna photos are compressed in the browser first; this is headroom for large originals.
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
    // ~100 files import icons from the package root; this keeps only the icons actually used.
    optimizePackageImports: ["@phosphor-icons/react"],
  },
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
  async headers() {
    return [{ source: "/((?!embed).*)", headers: SECURITY_HEADERS }];
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
