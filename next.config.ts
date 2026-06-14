import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // basePath untuk GitHub Pages: /repository-name
  // Biarkan kosong dulu, user bisa sesuaikan
  basePath: '/vocal-remover',
  assetPrefix: '/vocal-remover/',
};

export default nextConfig;
