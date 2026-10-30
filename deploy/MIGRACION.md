# Migración de Google Cloud a DigitalOcean

Google Cloud sigue atendiendo la tienda hasta el paso 6, así que volver atrás es solo restaurar el DNS.

## 1. Crear el servidor

Droplet Ubuntu 24.04, Basic 2 GB, región NYC3, con llave SSH y copias de seguridad activadas.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/emc_deploy -C emc-deploy   # sube la .pub al crear el Droplet
scp -i ~/.ssh/emc_deploy -r deploy/. root@IP:/opt/emc/
ssh -i ~/.ssh/emc_deploy root@IP bash /opt/emc/setup-server.sh
```

## 2. Configurar GitHub Actions

Secretos del repositorio: `DO_HOST` (IP), `DO_SSH_KEY` (contenido de `~/.ssh/emc_deploy`) y
`DO_KNOWN_HOSTS` (salida de `ssh-keyscan IP`). Fusiona esta rama en `main`: despliega en el
Droplet y también en Cloud Run mientras el trigger `emc-accesories` exista.

## 3. Migrar la base de datos

Exporta **solo** `tienda_emc`: la instancia `prueba-convocatoria` tiene otras bases que no deben salir de ahí.
La copia contiene datos de clientes: no la subas a git y bórrala al terminar.

```bash
# Terminal 1: proxy hacia Cloud SQL
docker run --rm -p 127.0.0.1:3307:3307 -v "$HOME/.config/gcloud:/config:ro" \
  -e GOOGLE_APPLICATION_CREDENTIALS=/config/application_default_credentials.json \
  gcr.io/cloud-sql-connectors/cloud-sql-proxy:2 --address 0.0.0.0 --port 3307 \
  sapiencia-sis-prod:us-central1:prueba-convocatoria

# Terminal 2: exportar (usuario y clave del secreto DATABASE_URL)
docker run --rm -i --network host mysql:8.0 mysqldump -h 127.0.0.1 -P 3307 -u USUARIO -p \
  --single-transaction --no-tablespaces --set-gtid-purged=OFF --routines=false tienda_emc > tienda_emc.sql

# Importar en el Droplet (incluye _prisma_migrations: no se repiten migraciones)
ssh deploy@IP 'cd /opt/emc && docker compose exec -T db sh -c "exec mysql -u\"\$MYSQL_USER\" -p\"\$MYSQL_PASSWORD\" \"\$MYSQL_DATABASE\""' < tienda_emc.sql
```

No hay imágenes que copiar: el bucket `emc-positive-uploads-sis-dev` está vacío. Comprueba que ningún
producto apunte a `storage.googleapis.com`.

## 4. Probar antes de cambiar el DNS

```bash
ssh -L 8081:127.0.0.1:8081 deploy@IP   # y abre http://localhost:8081
```

Revisa catálogo, inicio de sesión de admin, subida de una imagen y un pedido de prueba.

## 5. Bajar el TTL

Un día antes, en Squarespace, baja el TTL de los registros A/AAAA y `www`. **No toques los MX ni los TXT de Google Workspace.**

## 6. Cambiar el DNS

1. Deja de aceptar cambios en la tienda antigua y repite la exportación del paso 3 si hubo pedidos o clientes nuevos.
2. `emc-positive.com`: reemplaza los A de Google por un solo A hacia la IP del Droplet y elimina los AAAA.
3. `www`: reemplaza el CNAME por un A hacia la misma IP.
4. Caddy emite los certificados solo. Verifica `https://emc-positive.com` y `https://www.emc-positive.com`.

## 7. Retirar Google Cloud (solo tras unos días estable)

Desactiva el trigger `emc-accesories`, elimina el servicio de Cloud Run, los domain mappings
(cuenta `admin@emc-positive.com`), el bucket, los secretos `DATABASE_URL` y `AUTH_SECRET`, la base
`tienda_emc` y su usuario en Cloud SQL. Después borra `cloudbuild.yaml` y el SDK de Google Cloud Storage.
