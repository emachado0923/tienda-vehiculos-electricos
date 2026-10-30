# Pendientes de la migración a DigitalOcean

Estado al 2026-10-30: la tienda sigue en Google Cloud. Solo está preparado el código de esta rama; nada se ha ejecutado en un servidor real. Los pasos detallados están en `MIGRACION.md`.

## Para retomar en otro equipo

```bash
git clone https://github.com/emachado0923/tienda-vehiculos-electricos.git
cd tienda-vehiculos-electricos
git switch migracion-digitalocean
```

Necesitas Docker, `doctl` y `gcloud` (con `gcloud auth login` y `gcloud auth application-default login`).
Abre Claude Code en esa carpeta y pídele que continúe con este archivo.

## Tareas

- [ ] Crear la cuenta de DigitalOcean a nombre propio.
- [ ] Generar un token de API e iniciar sesión con `doctl auth init`.
- [ ] Crear el Droplet: Ubuntu 24.04, Basic 2 GB, NYC3, con llave SSH y copias de seguridad.
- [ ] Ejecutar `setup-server.sh` en el Droplet.
- [ ] Cargar en GitHub los secretos `DO_HOST`, `DO_SSH_KEY` y `DO_KNOWN_HOSTS`.
- [ ] Fusionar esta rama en `main` (también despliega en Cloud Run mientras exista el trigger).
- [ ] Exportar solo `tienda_emc` e importarla en el Droplet.
- [ ] Probar la tienda por túnel SSH: catálogo, admin, subida de imagen y pedido.
- [ ] Bajar el TTL en Squarespace un día antes del cambio.
- [ ] Cambiar el DNS sin tocar los MX ni los TXT de Google Workspace.
- [ ] Configurar Wompi y SMTP en `/opt/emc/.env`: hoy los pagos son simulados y los correos no se envían.
- [ ] Tras unos días estable, retirar lo de Google Cloud (paso 7 de `MIGRACION.md`).

## Datos que no están en el código

- Google Cloud: proyecto `sapiencia-sis-dev`, servicio `tienda-emc-positive`, región `us-central1`, trigger `emc-accesories` (push a `main`).
- Base actual: `tienda_emc` en `sapiencia-sis-prod:us-central1:prueba-convocatoria`, instancia compartida con bases de Sapiencia: exportar solo esa.
- Cambios de dominio en Google Cloud: cuenta `admin@emc-positive.com`.
- DNS en Squarespace: hoy A/AAAA de Google y CNAME `www` → `ghs.googlehosted.com`.
