import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    // Document verification and car photo uploads go through Server Actions.
    serverActions: { bodySizeLimit: "40mb" },
  },
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Car photos uploaded through the app.
    remotePatterns: [new URL("https://carapprent.s3.ap-south-1.amazonaws.com/**")],
    // Some local networks (NAT64/DNS64) resolve S3 to 64:ff9b::/96, which Next treats
    // as a private IP. Allow it only in `next dev`; production keeps the SSRF guard.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
