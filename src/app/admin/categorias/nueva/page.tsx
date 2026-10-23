import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "Nueva categoría" };

export default async function NewCategoryPage() {
  const parents = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, kind: true },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nueva categoría</h1>
      <CategoryForm parents={parents} />
    </div>
  );
}
