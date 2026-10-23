import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera .next/standalone: servidor Node mínimo para la imagen Docker (Cloud Run)
  output: "standalone",
  // Paquetes con binarios/recursos nativos que no deben empaquetarse
  serverExternalPackages: ["@google-cloud/storage"],
  images: {
    // Permite imágenes remotas (CDN, S3, Cloudinary, Google Cloud Storage...) registradas desde el panel admin.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
