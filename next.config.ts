import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Permite imágenes remotas (CDN, S3, Cloudinary...) registradas desde el panel admin.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
