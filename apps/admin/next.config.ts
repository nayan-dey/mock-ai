import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui", "@repo/database", "@repo/types"],
  experimental: {
    optimizePackageImports: ["@repo/ui", "lucide-react"],
  },
};

export default nextConfig;
