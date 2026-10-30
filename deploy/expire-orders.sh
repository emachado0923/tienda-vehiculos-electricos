#!/usr/bin/env bash
# Cancela los pedidos sin pagar y devuelve su stock (cron cada 30 min).
set -euo pipefail

SECRET=$(grep '^CRON_SECRET=' /opt/emc/.env | cut -d= -f2-)
curl -fsS -X POST -H "Authorization: Bearer $SECRET" http://127.0.0.1:8081/api/cron/expire-orders
