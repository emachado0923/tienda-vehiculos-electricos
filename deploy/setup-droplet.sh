#!/usr/bin/env bash
# =============================================================
#  Setup inicial del Droplet de DigitalOcean
#
#  Ejecutar como root en el Droplet una sola vez:
#    curl -fsSL https://raw.githubusercontent.com/emachado0923/tienda-vehiculos-electricos/main/deploy/setup-droplet.sh | bash
#
#  O copiar y ejecutar manualmente:
#    chmod +x setup-droplet.sh && sudo ./setup-droplet.sh
# =============================================================
set -euo pipefail

DOMAIN="${DOMAIN:-TU_DOMINIO.COM}"
APP_DIR="/opt/tienda-emc"
REPO="https://github.com/emachado0923/tienda-vehiculos-electricos.git"

echo "════════════════════════════════════════"
echo " Setup EMC Positive Energy — Droplet"
echo "════════════════════════════════════════"

# ── 1. Actualizar sistema ─────────────────────────────────────────────────
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Instalar Docker (si no está) ──────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "▶ Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  # Agregar usuario ubuntu al grupo docker
  usermod -aG docker ubuntu 2>/dev/null || true
fi
docker --version

# ── 3. Instalar git (si no está) ─────────────────────────────────────────
if ! command -v git &>/dev/null; then
  apt-get install -y -qq git
fi

# ── 4. Crear directorio de la app ─────────────────────────────────────────
mkdir -p "$APP_DIR/nginx"
cd "$APP_DIR"

# Clonar solo los archivos de configuración necesarios (sin historial completo)
if [ ! -f "$APP_DIR/docker-compose.yml" ]; then
  echo "▶ Descargando docker-compose.yml y nginx.conf..."
  git clone --depth=1 "$REPO" /tmp/repo-clone
  cp /tmp/repo-clone/docker-compose.yml "$APP_DIR/"
  cp /tmp/repo-clone/nginx/nginx.conf   "$APP_DIR/nginx/"
  rm -rf /tmp/repo-clone
fi

# ── 5. Crear archivo .env desde plantilla ────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<'ENVEOF'
# ====================================================
#  Variables de entorno — EMC Positive Energy
#  Editar TODOS los valores marcados con <CAMBIAR>
# ====================================================

# ── App ──────────────────────────────────────────
NODE_ENV=production
PORT=8080
APP_URL=https://<CAMBIAR_POR_TU_DOMINIO>

# ── Auth (Next Auth) ──────────────────────────────
# Generar con: openssl rand -base64 32
AUTH_SECRET=<CAMBIAR>

# ── MySQL ─────────────────────────────────────────
DATABASE_URL=mysql://tienda:<CAMBIAR_MYSQL_PASSWORD>@db:3306/tienda
MYSQL_ROOT_PASSWORD=<CAMBIAR_ROOT_PASSWORD>
MYSQL_DATABASE=tienda
MYSQL_USER=tienda
MYSQL_PASSWORD=<CAMBIAR_MYSQL_PASSWORD>

# ── Wompi (dejar vacío si no se usa aún) ──────────
WOMPI_PUBLIC_KEY=
WOMPI_INTEGRITY_SECRET=
WOMPI_EVENTS_SECRET=
CRON_SECRET=

# ── Email SMTP (opcional) ─────────────────────────
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=

# ── Google Cloud Storage (opcional) ───────────────
GCS_BUCKET=
GOOGLE_APPLICATION_CREDENTIALS=

# ── Seed — solo PRIMER despliegue, luego quitar ───
RUN_SEED=true
SEED_ADMIN_EMAIL=admin@<CAMBIAR_TU_DOMINIO>
SEED_ADMIN_PASSWORD=<CAMBIAR_PASSWORD_ADMIN>
ENVEOF

  echo ""
  echo "⚠️  Archivo .env creado en $APP_DIR/.env"
  echo "   EDITA los valores antes de continuar."
  echo ""
fi

# ── 6. Actualizar dominio en nginx.conf ───────────────────────────────────
if [ "$DOMAIN" != "TU_DOMINIO.COM" ]; then
  sed -i "s/TU_DOMINIO\.COM/$DOMAIN/g" "$APP_DIR/nginx/nginx.conf"
  echo "▶ nginx.conf actualizado con dominio: $DOMAIN"
fi

# ── 7. Instrucciones SSL (Certbot) ────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
echo " Pasos siguientes:"
echo ""
echo " 1. Edita $APP_DIR/.env con tus valores reales."
echo ""
echo " 2. Edita $APP_DIR/nginx/nginx.conf y reemplaza"
echo "    TU_DOMINIO.COM por tu dominio."
echo "    Para el PRIMER arranque (sin cert aún), comenta"
echo "    el bloque server 443 y descomenta el proxy directo"
echo "    en el bloque 80 (sigue las instrucciones del archivo)."
echo ""
echo " 3. Levanta los servicios:"
echo "    cd $APP_DIR && docker compose up -d"
echo ""
echo " 4. Obtén el certificado SSL:"
echo "    docker compose run --rm certbot certonly \\"
echo "      --webroot -w /var/www/certbot \\"
echo "      -d $DOMAIN -d www.$DOMAIN \\"
echo "      --email tu@email.com --agree-tos --no-eff-email"
echo ""
echo " 5. Activa HTTPS en nginx.conf (descomenta el bloque 443)"
echo "    y recarga Nginx:"
echo "    docker compose exec nginx nginx -s reload"
echo ""
echo " 6. Después del primer despliegue exitoso, quita"
echo "    RUN_SEED=true del .env para no re-sembrar."
echo "════════════════════════════════════════════════════════"
