# syntax=docker/dockerfile:1
# =============================================================
#  Imagen de producción de E-Positive (Next.js standalone)
#  Pensada para Google Cloud Run (escucha en $PORT, por defecto 8080)
# =============================================================

FROM node:24-bookworm-slim AS base
# openssl: requerido por los motores de Prisma · ca-certificates: TLS saliente
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- 1. Dependencias (capa cacheable) ----------
FROM base AS deps
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# npm ci ejecuta "postinstall: prisma generate" (por eso se copia prisma/ antes).
# Secreto OPCIONAL "extra_ca": certificados raíz extra para builds locales detrás
# de un proxy corporativo con inspección TLS. No queda guardado en la imagen.
# En Cloud Build no se usa. Ejemplo local:
#   docker build --secret id=extra_ca,src=corp-ca.pem -t epositive .
RUN --mount=type=secret,id=extra_ca,required=false \
    if [ -f /run/secrets/extra_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; fi \
 && npm ci

# ---------- 2. Build ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build \
 # Seed compilado a JS para poder ejecutarlo sin tsx en la imagen final
 && npx esbuild prisma/seed.ts --bundle --platform=node --format=cjs \
      --outfile=dist/seed.js --external:@prisma/client --external:bcryptjs

# ---------- 3. Prisma CLI aislado (solo para "migrate deploy" al arrancar) ----------
FROM base AS migrator
ARG PRISMA_VERSION=6.19.3
WORKDIR /migrator
RUN --mount=type=secret,id=extra_ca,required=false \
    if [ -f /run/secrets/extra_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; fi \
 && npm init -y >/dev/null \
 && npm install --no-audit --no-fund prisma@${PRISMA_VERSION}

# ---------- 4. Runtime ----------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=8080 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs \
 && mkdir -p storage && chown nextjs:nodejs storage

# Servidor standalone + estáticos
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma CLI en carpeta propia (no se mezcla con el node_modules del servidor)
COPY --from=migrator /migrator/node_modules ./prisma-cli/node_modules
# Cliente Prisma generado + bcryptjs (usados por el seed), migraciones y seed
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist/seed.js ./dist/seed.js
COPY docker-entrypoint.sh ./

USER nextjs
EXPOSE 8080
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
