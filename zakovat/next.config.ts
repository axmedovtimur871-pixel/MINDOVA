import type { NextConfig } from "next";
import path from "node:path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl) : null;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // This app lives in a sub-folder of a larger repository – pin the root.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: supabaseHost.protocol.replace(":", "") as "http" | "https", hostname: supabaseHost.hostname, port: supabaseHost.port, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  // Fonts and the built-in template are read from disk when PDFs are generated.
  outputFileTracingIncludes: {
    "/api/**/*": ["./public/fonts/**/*", "./public/builtin/**/*"],
  },
  webpack(config, { isServer }) {
    // Next 15.5 drops a client component from the RSC client manifest when webpack
    // concatenates it with some ESM dependencies (seen with the bulk generator →
    // "Could not find the module … in the React Client Manifest"). Turning off
    // module concatenation for the browser bundle avoids it at a tiny size cost.
    if (!isServer) config.optimization.concatenateModules = false;
    return config;
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
