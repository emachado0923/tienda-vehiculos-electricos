#!/usr/bin/env bash
# Preparación del Droplet (Ubuntu 24.04), una sola vez y como root:
#   scp -r deploy/. root@IP:/opt/emc/ && ssh root@IP bash /opt/emc/setup-server.sh
# Instala Docker, firewall y swap; crea el usuario "deploy", el .env con
# secretos nuevos y las tareas programadas. Se puede repetir sin efectos dobles.
set -euo pipefail

APP_DIR=/opt/emc

# Docker
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi

# Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443
ufw --force enable

# Swap: el servidor no compila la imagen, pero da margen a MySQL y Next.js
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Usuario de despliegue (entra con la misma llave SSH que root)
if ! id deploy >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
fi
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -m 600 -o deploy -g deploy /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys

# SSH solo con llave
cat > /etc/ssh/sshd_config.d/10-emc.conf <<'EOF'
PasswordAuthentication no
PermitRootLogin prohibit-password
EOF
systemctl reload ssh

# Secretos nuevos: no se reutiliza ninguno de Google Cloud
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<EOF
MYSQL_PASSWORD=$(openssl rand -hex 24)
MYSQL_ROOT_PASSWORD=$(openssl rand -hex 24)
AUTH_SECRET=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 32)
APP_URL=https://emc-positive.com

# Correo (vacío = se guarda en storage/emails y no se envía)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM="EMC Positive Energy <no-reply@emc-positive.com>"

# Wompi (vacío = pago simulado)
WOMPI_PUBLIC_KEY=
WOMPI_INTEGRITY_SECRET=
WOMPI_EVENTS_SECRET=
EOF
fi

chmod +x "$APP_DIR"/*.sh
install -d "$APP_DIR/backups"
chown -R deploy:deploy "$APP_DIR"
chmod 600 "$APP_DIR/.env"

# Tareas programadas (hora del servidor: UTC)
cat > /etc/cron.d/emc <<EOF
*/30 * * * * deploy $APP_DIR/expire-orders.sh >/dev/null
0 8 * * * deploy $APP_DIR/backup.sh >/dev/null
EOF

echo "Servidor listo. Revisa $APP_DIR/.env y lanza el despliegue desde GitHub Actions."
