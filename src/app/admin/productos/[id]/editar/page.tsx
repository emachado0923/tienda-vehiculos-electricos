import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCategories } from "@/lib/queries/products";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Editar producto" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } } },
    }),
    getCategories(),
  ]);
  if (!product) notFound();

  // Serializamos Decimal/Json a tipos planos para el Client Component
  const initial: ProductFormValues = {
    id: product.id,
    title: product.title,
    sku: product.sku,
    slug: product.slug,
    shortDescription: product.shortDescription ?? "",
    description: product.description,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    stock: product.stock,
    categoryId: product.categoryId,
    brand: product.brand ?? "",
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    connectorType: product.connectorType,
    powerKw: product.powerKw ? Number(product.powerKw) : null,
    panelType: product.panelType,
    inverterType: product.inverterType,
    images: product.images.map((i) => i.url),
    specs: (product.specs ?? {}) as Record<string, string>,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar: {product.title}</h1>
      <ProductForm initial={initial} categories={categories.map(({ id, name, kind }) => ({ id, name, kind }))} />
    </div>
  );
}
