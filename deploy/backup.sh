#!/usr/bin/env bash
# Copia diaria de la base de datos y de storage/ en /opt/emc/backups (14 días).
# Quedan en el mismo servidor: las copias del Droplet protegen si este se pierde.
set -euo pipefail

cd /opt/emc
STAMP=$(date +%F)

docker compose exec -T db sh -c \
  'exec mysqldump --single-transaction --no-tablespaces -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  | gzip > "backups/tienda_emc-$STAMP.sql.gz"
docker compose exec -T app tar czf - -C /app storage > "backups/storage-$STAMP.tar.gz"

find backups -type f -mtime +14 -delete
