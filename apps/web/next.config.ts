import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@unicartola/db", "@unicartola/scraper"],
  serverExternalPackages: ["postgres", "cheerio"],
};

export default nextConfig;
