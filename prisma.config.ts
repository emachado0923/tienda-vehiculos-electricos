import "dotenv/config"; // Con prisma.config.ts, Prisma ya no carga .env automáticamente
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
});
