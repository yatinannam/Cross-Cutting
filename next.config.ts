import type { NextConfig } from "next";

const clerkSources = [
  "https://*.clerk.com",
  "https://*.clerk.accounts.dev",
  "https://*.bootstrap.clerk.com",
  "https://*.clerkstatic.com",
];

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clerkSources.join(" ")} https://cdn.jsdelivr.net https://unpkg.com`,
              `script-src-elem 'self' 'unsafe-inline' ${clerkSources.join(" ")} https://cdn.jsdelivr.net https://unpkg.com`,
              "style-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev https://*.clerkstatic.com",
              `connect-src 'self' ${clerkSources.join(" ")} https://*.supabase.co wss://*.supabase.co`,
              "img-src 'self' data: https:",
              "font-src 'self' data: https://*.clerkstatic.com https://fonts.googleapis.com https://fonts.gstatic.com",
              "media-src 'self'",
              "frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev",
            ].join("; "),
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
