Actúa como un Desarrollador Full-Stack Senior y Arquitecto de Software experto en Next.js (App Router), React, Node.js, Tailwind CSS y MySQL.

Quiero diseñar y desarrollar una plataforma e-commerce estilo Shopify especializada en el nicho de movilidad eléctrica y energías renovables. El código del proyecto se alojará en el siguiente repositorio de GitHub:
`https://github.com/emachado0923/tienda-vehiculos-electricos.git`

### 1. Enfoque Comercial y Catálogo
- **Mercado Principal:** Accesorios para Vehículos Eléctricos (EVs) (cargadores portátiles y de pared, adaptadores Tipo 1/Tipo 2/CCS2, cables de carga, organizadores, montajes, etc.).
- **Categoría Secundaria:** Soluciones de Energía Renovable (paneles solares, inversores híbridos, controladores MPPT, baterías de litio/LiFePO4).

### 2. Stack Tecnológico Mandatorio
- **Front-end / Framework:** Next.js (con React y TypeScript) usando App Router.
- **Estilos:** Tailwind CSS.
- **Back-end:** Node.js (vía Next.js Server Actions / API Routes).
- **Base de Datos:** MySQL (usando Prisma ORM o Drizzle ORM para modelado y migraciones).
- **Autenticación:** NextAuth.js (Auth.js) con soporte para login de clientes y administradores.
- **Control de Versiones:** Git / GitHub (`emachado0923/tienda-vehiculos-electricos`).

### 3. Módulos y Requerimientos Funcionales
- **Storefront (Tienda Pública):**
  - Catálogo interactivo con filtros avanzados (por tipo de conector EV, potencia kW, tipo de panel/inversor).
  - Carrito de compras y flujo de checkout intuitivo.
  - Registro/Login de usuarios y panel de cliente (historial de pedidos, direcciones de envío).
  - Integración o mockup para pasarela de pagos (tarjetas de crédito, PSE/Stripe/PayPal).

- **Admin Dashboard (Panel de Administración):**
  - Gestión completa de inventario (CRUD de productos: imágenes, títulos, descripciones, precio, stock, SKU, categoría y especificaciones técnicas).
  - Gestión de pedidos y actualización de estados de envío.
  - Configuración del sitio (banner principal, enlaces a redes sociales, datos de contacto).

### 4. Lo que necesito que me entregues:
1. **Estructura del Proyecto:** Árbol de archivos y carpetas optimizado para Next.js App Router.
2. **Esquema de Base de Datos MySQL:** Modelo de tablas en Prisma (o Drizzle) para `User`, `Product`, `Category`, `Order`, `OrderItem` y `SiteConfig`.
3. **Paso a Paso de Configuración:** Comandos para inicializar el repositorio local, vincularlo al remoto en GitHub (`git remote add origin ...`), configurar la base de datos MySQL local o remota y ejecutar las migraciones.
4. **Código Base Funcional:**
   - Componente/Página de catálogo de productos con Tailwind CSS.
   - Server Action o API Route para listar y crear productos.
   - Formulario de creación/edición de productos para el dashboard.

Por favor, entrega respuestas bien estructuradas, con código limpio y comentado.