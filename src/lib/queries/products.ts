import "server-only";
import { Prisma, ConnectorType, InverterType, PanelType, CategoryKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "@/lib/constants";
import type { ProductCardDTO } from "@/types";

/** Filtros admitidos por el catálogo (vienen de los searchParams de la URL). */
export type ProductFilters = {
  q?: string;
  category?: string; // slug
  kind?: CategoryKind;
  connector?: ConnectorType[];
  power?: string; // rango "min-max" en kW
  panel?: PanelType[];
  inverter?: InverterType[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "title";
  page?: number;
};

type RawParams = Record<string, string | string[] | undefined>;

const toArray = (v: string | string[] | undefined) =>
  v === undefined ? [] : Array.isArray(v) ? v : v.split(",");

/** Mantiene solo valores válidos de un enum. */
function pickEnum<T extends string>(values: string[], allowed: Record<string, T>): T[] {
  const set = new Set(Object.values(allowed));
  return values.filter((v): v is T => set.has(v as T));
}

/** Convierte searchParams (no confiables) en filtros tipados y saneados. */
export function parseProductFilters(params: RawParams): ProductFilters {
  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const num = (k: string) => {
    const n = Number(one(k));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  const kind = one("kind");
  const sort = one("sort");

  return {
    q: one("q")?.trim() || undefined,
    category: one("category") || undefined,
    kind: kind && kind in CategoryKind ? (kind as CategoryKind) : undefined,
    connector: pickEnum(toArray(params.connector), ConnectorType),
    power: one("power") || undefined,
    panel: pickEnum(toArray(params.panel), PanelType),
    inverter: pickEnum(toArray(params.inverter), InverterType),
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    inStock: one("inStock") === "1",
    sort: (["newest", "price_asc", "price_desc", "title"] as const).find((s) => s === sort),
    page: Math.max(1, Math.floor(num("page") ?? 1)),
  };
}

/** Construye el WHERE de Prisma a partir de los filtros. */
function buildWhere(f: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };
  const and: Prisma.ProductWhereInput[] = [];

  if (f.q) {
    and.push({
      OR: [
        { title: { contains: f.q } }, // MySQL: collation *_ci => case-insensitive
        { sku: { contains: f.q } },
        { brand: { contains: f.q } },
      ],
    });
  }
  // Una categoría principal incluye los productos de sus subcategorías
  if (f.category) {
    and.push({ category: { OR: [{ slug: f.category }, { parent: { slug: f.category } }] } });
  }
  if (f.kind) and.push({ category: { kind: f.kind } });
  if (f.connector?.length) and.push({ connectorType: { in: f.connector } });
  if (f.panel?.length) and.push({ panelType: { in: f.panel } });
  if (f.inverter?.length) and.push({ inverterType: { in: f.inverter } });
  if (f.power) {
    const [min, max] = f.power.split("-").map(Number);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      and.push({ powerKw: { gte: min, lte: max } });
    }
  }
  if (f.minPrice || f.maxPrice) {
    and.push({ price: { gte: f.minPrice, lte: f.maxPrice } });
  }
  if (f.inStock) and.push({ stock: { gt: 0 } });

  if (and.length) where.AND = and;
  return where;
}

const ORDER_BY: Record<NonNullable<ProductFilters["sort"]>, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  title: { title: "asc" },
};

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  sku: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  connectorType: true,
  powerKw: true,
  category: { select: { name: true } },
  images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

/** Decimal -> number para poder enviarlo a Client Components / JSON. */
export function toCardDTO(p: CardRow): ProductCardDTO {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    sku: p.sku,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    stock: p.stock,
    imageUrl: p.images[0]?.url ?? null,
    categoryName: p.category.name,
    connectorType: p.connectorType,
    powerKw: p.powerKw ? Number(p.powerKw) : null,
  };
}

/** Lista paginada de productos para el catálogo y la API. */
export async function getProducts(filters: ProductFilters, pageSize = PAGE_SIZE) {
  const where = buildWhere(filters);
  const page = filters.page ?? 1;

  const [rows, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: cardSelect,
      orderBy: ORDER_BY[filters.sort ?? "newest"],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: rows.map(toCardDTO),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getFeaturedProducts(limit = 8) {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    select: cardSelect,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rows.map(toCardDTO);
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
    },
  });
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: [{ kind: "asc" }, { name: "asc" }] });
}
