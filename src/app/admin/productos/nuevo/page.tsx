import type { Metadata } from "next";
import { getCategories } from "@/lib/queries/products";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nuevo producto</h1>
      <ProductForm categories={categories.map(({ id, name, kind }) => ({ id, name, kind }))} />
    </div>
  );
}
