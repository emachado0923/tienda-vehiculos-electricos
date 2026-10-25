# 🔋 E-Positive — E-commerce de movilidad eléctrica y energía renovable

Tienda online para **accesorios de vehículos eléctricos** (cargadores, adaptadores Tipo 1/Tipo 2/CCS2, cables, organizadores) y **energía solar** (paneles, inversores híbridos, controladores MPPT, baterías LiFePO4).

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Estilos | Tailwind CSS v4 |
| Backend | Server Actions + API Routes (Node.js) |
| Base de datos | MySQL 8 + Prisma ORM 6 |
| Autenticación | Auth.js (NextAuth v5) — credenciales, roles `CUSTOMER` / `ADMIN` |
| Validación | Zod 4 (compartida entre formularios y API) |

Repositorio: https://github.com/emachado0923/tienda-vehiculos-electricos

---

## 1. Estructura del proyecto

```
├── prisma/
│   ├── schema.prisma              # Modelos: User, Address, Category, Product, ProductImage, Order, OrderItem, SiteConfig
│   ├── migrations/                # Migraciones SQL versionadas
│   └── seed.ts                    # Admin + categorías + 12 productos de ejemplo + SiteConfig
├── prisma.config.ts               # Configuración de Prisma CLI (schema, seed)
├── src/
│   ├── auth.ts                    # Auth.js: provider de credenciales (Prisma + bcrypt)
│   ├── auth.config.ts             # Config ligera: reglas de acceso por ruta + callbacks JWT
│   ├── proxy.ts                   # Protección de /admin, /cuenta, /checkout (antes middleware.ts)
│   ├── actions/                   # Server Actions ("use server")
│   │   ├── product.actions.ts     #   crear/editar/eliminar/activar productos
│   │   ├── order.actions.ts       #   checkout + cambio de estado de envío
│   │   ├── auth.actions.ts        #   login / registro / logout
│   │   ├── account.actions.ts     #   libreta de direcciones
│   │   └── site-config.actions.ts #   banner, contacto, redes sociales
│   ├── app/
│   │   ├── (store)/               # Tienda pública (route group con header/footer)
│   │   │   ├── page.tsx           #   Home con hero administrable + destacados
│   │   │   ├── productos/         #   Catálogo con filtros + detalle [slug]
│   │   │   ├── carrito/           #   Carrito (localStorage)
│   │   │   ├── checkout/          #   Checkout + pago simulado + página de éxito
│   │   │   ├── cuenta/            #   Panel cliente: pedidos, detalle, direcciones
│   │   │   ├── login/ registro/
│   │   ├── admin/                 # Dashboard (solo ADMIN)
│   │   │   ├── productos/         #   Inventario: listado, nuevo, [id]/editar
│   │   │   ├── pedidos/           #   Pedidos + actualización de estado/guía
│   │   │   └── configuracion/     #   SiteConfig
│   │   └── api/
│   │       ├── auth/[...nextauth]/ # Endpoints de Auth.js
│   │       └── products/          # GET (listar con filtros) / POST (crear, admin)
│   ├── components/
│   │   ├── admin/product-form.tsx # Formulario crear/editar producto
│   │   ├── cart/                  # CartProvider, botón carrito, "agregar al carrito"
│   │   ├── layout/                # Header y footer
│   │   ├── order/                 # Detalle de pedido (cliente y admin)
│   │   ├── product/               # Tarjeta, filtros, ordenamiento
│   │   └── ui/                    # FormField, paginación, badges
│   ├── lib/
│   │   ├── prisma.ts              # Singleton de PrismaClient
│   │   ├── auth-guards.ts         # requireUser / requireAdmin
│   │   ├── queries/               # Lecturas (catálogo, filtros, SiteConfig)
│   │   ├── services/              # Lógica de negocio compartida (productos)
│   │   ├── payments/              # Pasarela simulada (mock)
│   │   ├── validations/           # Esquemas Zod
│   │   ├── constants.ts           # Etiquetas de enums en español
│   │   └── utils.ts               # formatPrice (COP), slugify, cn
│   └── types/                     # DTOs y extensión de tipos de Auth.js
└── .env.example
```

## 2. Esquema de base de datos

Ver [`prisma/schema.prisma`](prisma/schema.prisma). Decisiones clave:

- **Filtros técnicos como columnas indexadas** (`connectorType`, `powerKw`, `panelType`, `inverterType`) para filtrar rápido en MySQL; el resto de especificaciones va en `specs` (JSON clave/valor).
- **`Category.kind`** separa la línea principal (`EV_ACCESSORY`) de la secundaria (`RENEWABLE_ENERGY`); soporta subcategorías con `parentId`.
- **`OrderItem` guarda una copia** del título, SKU y precio, y `Order.shippingAddress` una copia de la dirección: el histórico no cambia si luego se edita el producto o la dirección.
- **Dinero en `Decimal(12,2)`**, nunca `float`.
- **`SiteConfig`** es un registro único (`id = 1`).

## 3. Paso a paso de configuración

### Requisitos
- Node.js ≥ 20 · npm
- MySQL 8 (local, Docker o remoto: Railway, PlanetScale, AWS RDS…)

### 3.1 Clonar / inicializar y vincular con GitHub

Si partes de esta carpeta:

```bash
git init -b main
git remote add origin https://github.com/emachado0923/tienda-vehiculos-electricos.git
git add .
git commit -m "feat: estructura inicial del e-commerce"
git push -u origin main
```

Si el repositorio ya tiene contenido:

```bash
git clone https://github.com/emachado0923/tienda-vehiculos-electricos.git
cd tienda-vehiculos-electricos
```

### 3.2 Instalar dependencias

```bash
npm install
```

> **Red corporativa con proxy/SSL:** si `prisma generate` falla con
> `self-signed certificate in certificate chain`, haz que Node use los certificados de Windows:
> ```bash
> # Git Bash
> export NODE_OPTIONS=--use-system-ca
> # PowerShell
> $env:NODE_OPTIONS="--use-system-ca"
> npm install
> ```
> `npm run dev` ya incluye `--use-system-ca` (vía `cross-env`), para que el
> optimizador de imágenes de Next.js pueda descargar imágenes remotas detrás del proxy.

### 3.3 Base de datos MySQL

**Opción A — Docker (recomendado para desarrollo):**

```bash
docker run --name tienda-ev-mysql -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=tienda_ev -p 3306:3306 -d mysql:8.4
```

**Opción B — MySQL instalado localmente:**

```sql
CREATE DATABASE tienda_ev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Opción C — Remota:** usa la cadena de conexión de tu proveedor (agrega `?sslaccept=strict` si lo requiere).

### 3.4 Variables de entorno

```bash
cp .env.example .env
npx auth secret      # genera AUTH_SECRET y lo escribe en .env.local
```

Edita `DATABASE_URL` en `.env`:

```
DATABASE_URL="mysql://USUARIO:CONTRASEÑA@HOST:3306/tienda_ev"
```

### 3.5 Migraciones y datos iniciales

```bash
npm run db:migrate     # prisma migrate dev  → crea las tablas
npm run db:seed        # admin + categorías + productos de ejemplo
```

En producción usa `npm run db:deploy` (aplica migraciones sin generar nuevas).

### 3.6 Ejecutar

```bash
npm run dev            # http://localhost:3000
```

- Tienda: http://localhost:3000
- Admin: http://localhost:3000/admin → `tu-email@dominio.com` / `Admin123!` (definidos en `.env`, **cámbialos**)
- Explorar la BD: `npm run db:studio`

## 4. API REST

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/products` | Público | Lista paginada. Filtros: `q`, `category`, `kind`, `connector` (CSV), `power` (`min-max`), `panel`, `inverter`, `minPrice`, `maxPrice`, `inStock=1`, `sort`, `page`, `pageSize` |
| POST | `/api/products` | ADMIN | Crea un producto (JSON validado con `productSchema`) |
| POST | `/api/uploads` | ADMIN | Sube imágenes (`multipart/form-data`, campo `files`, máx. 10 × 5 MB) → `{ urls }` |
| GET | `/uploads/…` | Público | Sirve las imágenes subidas |

```bash
curl "http://localhost:3000/api/products?connector=TYPE2,CCS2&power=7.4-22&sort=price_asc"
```

## 5. Pagos

`src/lib/payments/mock-gateway.ts` simula la pasarela (los montos terminados en `13` se rechazan, para probar el flujo de error). Para producción, reemplázalo por:

- **Tarjetas / Stripe:** Stripe Checkout o PaymentIntents + webhook.
- **PSE (Colombia):** Wompi, ePayco o PayU (redirección al banco + webhook).
- **PayPal:** Orders API v2.

El estado definitivo del pago debe confirmarse por **webhook**, no por la respuesta síncrona.

## 6. Imágenes de productos

- **Desde el admin:** arrastra imágenes al formulario del producto (JPG, PNG, WebP, GIF, AVIF; máx. 5 MB).
  Se validan por su contenido real y se guardan en `storage/uploads/` (fuera de git), servidas en `/uploads/…`.
- **Por URL:** debe ser la dirección de la **imagen** (`…/foto.jpg`), no la página del producto; el admin lo verifica al guardar.
- **Producción en serverless (Vercel):** el disco es efímero; reemplaza `saveUpload` en `src/lib/storage.ts`
  por Cloudinary / S3 / UploadThing.
- Las imágenes del catálogo de ejemplo son fotos reales de Wikimedia Commons en `public/products/` (atribución en `public/products/CREDITOS.md`); reemplázalas desde el admin con fotos propias.

## 7. Correos transaccionales

| Evento | Correo |
|---|---|
| Registro | Bienvenida |
| Compra | Confirmación del pedido (o aviso de pago pendiente) |
| Cambio de estado (admin) | En preparación · Enviado (con transportadora y guía) · Entregado · Cancelado · Reembolsado |
| Cambio de contraseña | Aviso de seguridad |

Sin `SMTP_HOST` en `.env`, **no se envía nada**: cada correo se guarda como HTML en `storage/emails/`
para abrirlo en el navegador. Para enviar de verdad, configura `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS` y `MAIL_FROM` (Gmail con contraseña de aplicación, Brevo, Resend, Amazon SES…).
Los correos se envían con `after()` de Next.js, sin hacer esperar al cliente.

## 8. Administración de usuarios y seguridad

- **/cuenta/seguridad:** cualquier usuario cambia su contraseña (8+ caracteres con letras y números).
- **/admin/usuarios:** crear clientes o administradores, otorgar/quitar el rol de admin y asignar contraseñas.
  No puedes quitarte el rol a ti mismo ni dejar la tienda sin administradores.
- El rol de admin se verifica contra la base de datos en cada acción: quitarlo surte efecto de inmediato.
- **/admin/categorias:** crear, editar y eliminar categorías y subcategorías (2 niveles). Una categoría con
  productos no se puede eliminar; filtrar por una categoría principal incluye sus subcategorías.

## 9. Despliegue en Google Cloud Run

Archivos: `Dockerfile` (Next.js `standalone`), `docker-entrypoint.sh` (aplica migraciones al arrancar
y, opcionalmente, el seed) y `cloudbuild.yaml` (build → Artifact Registry → Cloud Run).

### 9.1 Configuración inicial (una sola vez)

```bash
PROJECT=mi-proyecto            # ID de tu proyecto de GCP
REGION=us-central1
gcloud config set project $PROJECT
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  sqladmin.googleapis.com secretmanager.googleapis.com storage.googleapis.com

# Repositorio de imágenes
gcloud artifacts repositories create epositive --repository-format=docker --location=$REGION

# Base de datos Cloud SQL (MySQL 8)
gcloud sql instances create tienda-mysql --database-version=MYSQL_8_0 --tier=db-f1-micro --region=$REGION
gcloud sql databases create tienda_ev --instance=tienda-mysql --charset=utf8mb4 --collation=utf8mb4_unicode_ci
gcloud sql users create tienda --instance=tienda-mysql --password='CLAVE_SEGURA'

# Secretos (Cloud Run se conecta a Cloud SQL por socket Unix)
printf 'mysql://tienda:CLAVE_SEGURA@localhost/tienda_ev?socket=/cloudsql/%s:%s:tienda-mysql' $PROJECT $REGION \
  | gcloud secrets create DATABASE_URL --data-file=-
openssl rand -base64 32 | tr -d '\n' | gcloud secrets create AUTH_SECRET --data-file=-

# Bucket público para imágenes subidas desde el admin
gcloud storage buckets create gs://epositive-uploads --location=$REGION --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding gs://epositive-uploads --member=allUsers --role=roles/storage.objectViewer

# Permisos de la cuenta de servicio (por defecto Cloud Build y Cloud Run usan la de Compute Engine)
SA="$(gcloud projects describe $PROJECT --format='value(projectNumber)')-compute@developer.gserviceaccount.com"
for ROLE in roles/run.admin roles/iam.serviceAccountUser roles/artifactregistry.writer roles/logging.logWriter \
            roles/secretmanager.secretAccessor roles/cloudsql.client; do
  gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA" --role=$ROLE
done
gcloud storage buckets add-iam-policy-binding gs://epositive-uploads --member="serviceAccount:$SA" --role=roles/storage.objectAdmin
```

### 9.2 Desplegar

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_CLOUDSQL_INSTANCE=$PROJECT:$REGION:tienda-mysql,_GCS_BUCKET=epositive-uploads
```

También puedes crear un **trigger** de Cloud Build conectado a GitHub (rama `main`) con esas mismas
sustituciones para desplegar en cada `git push`.

**Primer despliegue — crear el administrador y los datos de ejemplo:**

```bash
gcloud run services update tienda-epositive --region=$REGION \
  --update-env-vars=RUN_SEED=true,SEED_ADMIN_EMAIL=tu@correo.com,SEED_ADMIN_PASSWORD='OtraClaveSegura1'
# Cuando el servicio arranque, quita las variables del seed:
gcloud run services update tienda-epositive --region=$REGION --remove-env-vars=RUN_SEED,SEED_ADMIN_EMAIL,SEED_ADMIN_PASSWORD
```

**Variables opcionales** (`gcloud run services update … --update-env-vars=…`): `APP_URL`
(sustitución `_APP_URL`), `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `MAIL_FROM` y `SMTP_PASS`
(mejor como secreto con `--update-secrets=SMTP_PASS=SMTP_PASS:latest`).

### 9.3 Probar la imagen localmente

```bash
docker build -t epositive .
# Detrás de un proxy corporativo con inspección TLS, pasa sus certificados (no quedan en la imagen):
#   node -e "require('fs').writeFileSync('ca.pem', require('tls').getCACertificates('system').join('\n'))"
#   docker build --secret id=extra_ca,src=ca.pem -t epositive .
docker run -p 8080:8080 \
  -e DATABASE_URL="mysql://root:password@host.docker.internal:3306/tienda_ev" \
  -e AUTH_SECRET="un-secreto-largo" -e AUTH_TRUST_HOST=true epositive
```

## 10. Próximos pasos sugeridos

- Pasarela de pago real con webhooks (Wompi / Stripe).
- Recuperación de contraseña por correo ("¿Olvidaste tu contraseña?").
- Cálculo de envío por ciudad e IVA.
- Tests automatizados (Vitest + Playwright) en CI.
