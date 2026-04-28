import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Force all routes to be dynamic — protects against prerender attempts hitting Supabase at build.
  experimental: {
    // Avoid pre-bundling that might pull Supabase clients into the static build.
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
