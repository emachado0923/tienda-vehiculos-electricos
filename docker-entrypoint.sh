#!/bin/sh
# Arranque del contenedor (Cloud Run / Docker):
#  1. Aplica las migraciones pendientes de Prisma (idempotente).
#  2. Opcional: ejecuta el seed si RUN_SEED=true (crea admin, categorías y
#     productos de ejemplo; también idempotente). Úsalo solo en el primer
#     despliegue y define SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
#  3. Inicia el servidor Next.js.
set -e

if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
  echo "▶ Aplicando migraciones de base de datos…"
  node prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma
fi

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "▶ Ejecutando seed…"
  node dist/seed.js
fi

echo "▶ Iniciando servidor en el puerto ${PORT:-8080}"
exec node server.js
