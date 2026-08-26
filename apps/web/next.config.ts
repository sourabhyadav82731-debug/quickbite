import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  transpilePackages: [
    "@quickbite/types",
    "@quickbite/config",
    "@quickbite/validation",
    "@quickbite/api-client",
  ],
};

export default nextConfig;
