import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@unicartola/db"],
  serverExternalPackages: ["postgres", "cheerio", "@unicartola/scraper"],
};

export default nextConfig;
