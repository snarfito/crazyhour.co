import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pqyunubwmchftefnqgvi.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Local Supabase Storage (supabase start) — dev-only, never resolves outside this machine.
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Next.js's SSRF guard refuses to fetch a remote image whose hostname
    // resolves to a private/loopback IP even when it matches remotePatterns
    // above — 127.0.0.1 always does, so local Supabase Storage needs this
    // explicit opt-in. Harmless: the pattern above is scoped to that exact
    // host/port/path, and 127.0.0.1 never resolves to anything in a real
    // deploy, so this has no effect outside a machine running `supabase start`.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
