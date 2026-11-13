import type { NextConfig } from "next";

/** Basic hardening for every page except the booking widgets, which proxy.ts frames for allowed origins only. */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // /registracija takes a photo with the camera; nothing else needs a sensor.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

/** Read at runtime by lib/email/coupon-pdf.ts. */
const COUPON_PDF_FILES = ["./app/fonts/Termina-Regular.otf", "./app/fonts/Termina-Bold.otf", "./public/brand/voucher/logo.png", "./public/brand/voucher/star.png", "./public/brand/voucher/banner.jpg"];

const nextConfig: NextConfig = {
  cacheComponents: false,
  // LAN/Tailscale hosts used to open the dev server from other devices, plus
  // 127.0.0.1 for browser automation tools that can't resolve "localhost".
  allowedDevOrigins: ["100.66.120.126", "127.210.108.239", "127.0.0.1"],
  // pdfkit reads its own data files at runtime, so it stays outside the bundle; the coupon PDF's fonts and logo are
  // read from disk, so the routes that send coupon emails must ship them.
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/stripe/webhook": COUPON_PDF_FILES,
    "/api/admin/mobile-action": COUPON_PDF_FILES,
    "/admin/**": COUPON_PDF_FILES,
    "/kuponai/**": COUPON_PDF_FILES,
    "/paskyra": COUPON_PDF_FILES,
  },
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
      // Service page photos uploaded in /admin/puslapiai (public `page-photos` bucket).
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/page-photos/**" },
    ],
  },
  // The standalone calculator page was folded into the celebrations page (/sventes), which has the same calculator.
  async redirects() {
    return [{ source: "/skaiciuokle", destination: "/sventes", permanent: true }];
  },
  async headers() {
    return [
      { source: "/((?!embed).*)", headers: SECURITY_HEADERS },
      // The staff panel is never cached by the browser or a proxy and never indexed.
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
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
