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

```bash
curl "http://localhost:3000/api/products?connector=TYPE2,CCS2&power=7.4-22&sort=price_asc"
```

## 5. Pagos

`src/lib/payments/mock-gateway.ts` simula la pasarela (los montos terminados en `13` se rechazan, para probar el flujo de error). Para producción, reemplázalo por:

- **Tarjetas / Stripe:** Stripe Checkout o PaymentIntents + webhook.
- **PSE (Colombia):** Wompi, ePayco o PayU (redirección al banco + webhook).
- **PayPal:** Orders API v2.

El estado definitivo del pago debe confirmarse por **webhook**, no por la respuesta síncrona.

## 6. Próximos pasos sugeridos

- Subida de imágenes a S3 / Cloudinary / UploadThing (hoy se registran por URL `https://…` o ruta local `/…` en `public/`).
  Las imágenes del catálogo de ejemplo son ilustraciones SVG propias en `public/products/`,
  generadas con `node scripts/generate-product-images.mjs`.
- Webhooks de pago reales y correos transaccionales (Resend).
- Cálculo de envío por ciudad e IVA.
- Tests (Vitest + Playwright).
