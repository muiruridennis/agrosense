import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* other config options here */
  typescript: {
    ignoreBuildErrors: true,
  }, 
 
};

export default nextConfig;