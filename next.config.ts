import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export", // enables static export
  images: {
    unoptimized: true,
  },
  assetPrefix: "./",
};

export default nextConfig;
