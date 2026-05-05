import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "drive.google.com" },
    ],
  },
  serverExternalPackages: ["pdf-parse", "mammoth", "fluent-ffmpeg"],
};

export default nextConfig;
