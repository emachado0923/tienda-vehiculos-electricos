/**
 * Datos iniciales: admin, categorías, productos de ejemplo y SiteConfig.
 * Ejecutar con: npm run db:seed   (idempotente: usa upsert)
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const img = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80&auto=format&fit=crop`;

async function main() {
  // ---------- Administrador ----------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@tienda-ev.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Administrador",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
  });

  // ---------- Categorías ----------
  const categories = [
    { slug: "cargadores", name: "Cargadores portátiles y de pared", kind: "EV_ACCESSORY" },
    { slug: "adaptadores", name: "Adaptadores", kind: "EV_ACCESSORY" },
    { slug: "cables-de-carga", name: "Cables de carga", kind: "EV_ACCESSORY" },
    { slug: "organizadores-y-montajes", name: "Organizadores y montajes", kind: "EV_ACCESSORY" },
    { slug: "paneles-solares", name: "Paneles solares", kind: "RENEWABLE_ENERGY" },
    { slug: "inversores", name: "Inversores", kind: "RENEWABLE_ENERGY" },
    { slug: "controladores-mppt", name: "Controladores MPPT", kind: "RENEWABLE_ENERGY" },
    { slug: "baterias", name: "Baterías de litio / LiFePO4", kind: "RENEWABLE_ENERGY" },
  ] as const;

  const cat: Record<string, string> = {};
  for (const c of categories) {
    const row = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
    cat[c.slug] = row.id;
  }

  // ---------- Productos ----------
  // La imagen de cada producto es /products/<slug>.jpg (fotos reales, créditos en public/products/CREDITOS.md)
  type SeedProduct = Omit<Prisma.ProductCreateInput, "category" | "images"> & {
    slug: string;
    categorySlug: string;
  };

  const products: SeedProduct[] = [
    {
      sku: "EVC-WB-T2-7K", slug: "wallbox-tipo-2-7-4kw", title: "Wallbox Tipo 2 de 7.4 kW con WiFi",
      shortDescription: "Cargador de pared monofásico con app, programación horaria y protección IP65.",
      description: "Cargador de pared para uso residencial.\n\n• Monofásico 32 A\n• Control por app y RFID\n• Protección diferencial DC 6 mA integrada",
      price: 2890000, compareAtPrice: 3290000, stock: 15, brand: "VoltCharge", isFeatured: true,
      connectorType: "TYPE2", powerKw: 7.4,
      specs: { Corriente: "32 A", Fases: "Monofásica", "Longitud cable": "5 m", Protección: "IP65" },
      categorySlug: "cargadores",
    },
    {
      sku: "EVC-WB-T2-22K", slug: "wallbox-trifasico-22kw", title: "Wallbox trifásico 22 kW",
      shortDescription: "Carga rápida AC para empresas y conjuntos residenciales.",
      description: "Estación de carga trifásica con balanceo dinámico de carga y protocolo OCPP 1.6J.",
      price: 4950000, stock: 6, brand: "VoltCharge", isFeatured: true,
      connectorType: "TYPE2", powerKw: 22,
      specs: { Corriente: "32 A", Fases: "Trifásica", Protocolo: "OCPP 1.6J" },
      categorySlug: "cargadores",
    },
    {
      sku: "EVC-PORT-T1-3K", slug: "cargador-portatil-tipo-1", title: "Cargador portátil Tipo 1 (J1772) 3.5 kW",
      shortDescription: "Cargador de emergencia con corriente ajustable 8–16 A.",
      description: "Ideal para viajes. Pantalla LCD, corriente ajustable y estuche de transporte.",
      price: 890000, stock: 30, brand: "EVGo", isFeatured: true,
      connectorType: "TYPE1", powerKw: 3.5,
      specs: { Corriente: "8–16 A ajustable", Enchufe: "NEMA 5-15", "Longitud cable": "6 m" },
      categorySlug: "cargadores",
    },
    {
      sku: "ADP-T1-T2", slug: "adaptador-tipo-1-a-tipo-2", title: "Adaptador Tipo 1 a Tipo 2",
      description: "Permite cargar un vehículo con entrada Tipo 2 en estaciones con conector Tipo 1.",
      price: 420000, stock: 40, brand: "PlugMate",
      connectorType: "TYPE2", powerKw: 7.4,
      specs: { "Corriente máx.": "32 A", Material: "PA66 + cobre plateado" },
      categorySlug: "adaptadores",
    },
    {
      sku: "ADP-CCS2-GBT", slug: "adaptador-ccs2-a-gbt", title: "Adaptador DC CCS2 a GB/T",
      description: "Adaptador de carga rápida DC para vehículos con puerto GB/T en cargadores CCS2.",
      price: 2150000, stock: 8, brand: "PlugMate",
      connectorType: "CCS2", powerKw: 60,
      specs: { "Corriente máx.": "200 A", Voltaje: "150–750 V DC" },
      categorySlug: "adaptadores",
    },
    {
      sku: "CBL-T2-T2-5M", slug: "cable-tipo-2-a-tipo-2-5m", title: "Cable de carga Tipo 2 a Tipo 2 · 5 m",
      description: "Cable trifásico para estaciones públicas sin manguera.",
      price: 650000, stock: 25, brand: "VoltCharge", isFeatured: true,
      connectorType: "TYPE2", powerKw: 22,
      specs: { Longitud: "5 m", Corriente: "32 A", Fases: "Trifásica" },
      categorySlug: "cables-de-carga",
    },
    {
      sku: "ORG-HOLSTER", slug: "soporte-pared-conector", title: "Soporte de pared para conector y cable",
      description: "Organizador metálico con recubrimiento en polvo para conector Tipo 1/Tipo 2.",
      price: 120000, stock: 60, brand: "EVGo",
      specs: { Material: "Acero galvanizado", Compatibilidad: "Tipo 1 / Tipo 2" },
      categorySlug: "organizadores-y-montajes",
    },
    {
      sku: "SOL-MONO-550", slug: "panel-solar-monocristalino-550w", title: "Panel solar monocristalino 550 W",
      shortDescription: "Módulo half-cell de alta eficiencia (21.3 %).",
      description: "Panel PERC half-cut con 25 años de garantía de producción.",
      price: 780000, stock: 120, brand: "SunPeak", isFeatured: true,
      panelType: "MONOCRYSTALLINE", powerKw: 0.55,
      specs: { Eficiencia: "21.3 %", Celdas: "144 half-cut", Dimensiones: "2279 × 1134 × 35 mm" },
      categorySlug: "paneles-solares",
    },
    {
      sku: "SOL-BIF-600", slug: "panel-solar-bifacial-600w", title: "Panel solar bifacial 600 W",
      description: "Panel bifacial de doble vidrio, ganancia trasera hasta 25 %.",
      price: 960000, stock: 60, brand: "SunPeak",
      panelType: "BIFACIAL", powerKw: 0.6,
      specs: { Eficiencia: "22.1 %", Vidrio: "Doble 2 mm" },
      categorySlug: "paneles-solares",
    },
    {
      sku: "INV-HYB-5K", slug: "inversor-hibrido-5kw", title: "Inversor híbrido 5 kW 48 V",
      shortDescription: "Inversor/cargador con MPPT integrado y monitoreo WiFi.",
      description: "Funciona on-grid y off-grid, compatible con baterías de litio y plomo-ácido.",
      price: 4200000, stock: 10, brand: "GridFlex", isFeatured: true,
      inverterType: "HYBRID", powerKw: 5,
      specs: { "Voltaje batería": "48 V", "MPPT": "2 × 18 A", Onda: "Senoidal pura" },
      categorySlug: "inversores",
    },
    {
      sku: "MPPT-60A", slug: "controlador-mppt-60a", title: "Controlador de carga MPPT 60 A",
      description: "Controlador 12/24/48 V autodetectable con pantalla LCD y Bluetooth.",
      price: 980000, stock: 20, brand: "GridFlex",
      specs: { Corriente: "60 A", "Voltaje FV máx.": "150 V", Comunicación: "Bluetooth / RS485" },
      categorySlug: "controladores-mppt",
    },
    {
      sku: "BAT-LFP-48-100", slug: "bateria-lifepo4-48v-100ah", title: "Batería LiFePO4 48 V 100 Ah (5.12 kWh)",
      shortDescription: "Batería rack con BMS y más de 6000 ciclos.",
      description: "Batería de fosfato de hierro y litio para almacenamiento residencial.",
      price: 6900000, compareAtPrice: 7500000, stock: 7, brand: "LithiumCore", isFeatured: true,
      powerKw: 5.12,
      specs: { Química: "LiFePO4", Capacidad: "100 Ah / 5.12 kWh", Ciclos: "> 6000 @ 80 % DoD" },
      categorySlug: "baterias",
    },
  ];

  for (const { categorySlug, ...p } of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        ...p,
        category: { connect: { id: cat[categorySlug] } },
        images: { create: [{ url: `/products/${p.slug}.jpg`, alt: p.title, position: 0 }] },
      },
    });
  }

  // ---------- Configuración del sitio ----------
  await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      storeName: "EMC Positive Energy",
      heroTitle: "Carga tu futuro eléctrico",
      heroSubtitle: "Cargadores, adaptadores y soluciones solares con envío a toda Colombia.",
      heroImageUrl: img("photo-1593941707874-ef25b8b4a92b"),
      contactEmail: "ventas@emc-positive.com",
      contactPhone: "+57 601 000 0000",
      whatsapp: "+57 300 000 0000",
      address: "Bogotá, Colombia",
      instagramUrl: "https://instagram.com/",
      facebookUrl: "https://facebook.com/",
      youtubeUrl: "https://youtube.com/",
      flatShippingFee: 25000,
      freeShippingThreshold: 1500000,
    },
  });

  console.log(`✔ Seed completado. Admin: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
