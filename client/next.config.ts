import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Silence inferred workspace root warning by pointing to the project root
  outputFileTracingRoot: path.join(__dirname, ".."),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
