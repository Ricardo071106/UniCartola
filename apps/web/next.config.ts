import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@unicartola/db"],
  serverExternalPackages: ["postgres", "cheerio", "@unicartola/scraper"],
  typescript: { ignoreBuildErrors: false },
  productionBrowserSourceMaps: false,
  experimental: {
    webpackMemoryOptimizations: true,
  },
  webpack: (config) => {
    config.parallelism = 1;
    return config;
  },
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
