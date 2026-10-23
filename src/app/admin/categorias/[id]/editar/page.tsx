import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata: Metadata = { title: "Editar categoría" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const [category, parents] = await Promise.all([
    prisma.category.findUnique({ where: { id } }),
    prisma.category.findMany({
      where: { parentId: null, NOT: { id } }, // no puede ser madre de sí misma
      orderBy: { name: "asc" },
      select: { id: true, name: true, kind: true },
    }),
  ]);
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar: {category.name}</h1>
      <CategoryForm
        parents={parents}
        initial={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          kind: category.kind,
          description: category.description ?? "",
          imageUrl: category.imageUrl ?? "",
          parentId: category.parentId ?? "",
        }}
      />
    </div>
  );
}
