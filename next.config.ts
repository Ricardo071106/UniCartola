import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["cheerio"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "www.ndu.net.br" },
      { protocol: "http", hostname: "www.ndu.net.br" },
    ],
  },
};

export default nextConfig;
