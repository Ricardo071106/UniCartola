import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["cheerio", "pdf-parse"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "www.ndu.net.br" },
      { protocol: "http", hostname: "www.ndu.net.br" },
      { protocol: "https", hostname: "www.ndu.com.br" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
};

export default nextConfig;
