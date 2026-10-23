import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteCategoryAction } from "@/actions/category.actions";
import { CATEGORY_KIND_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Categorías" };

type PageProps = { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> };

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const { saved, deleted, error } = await searchParams;

  const categories = await prisma.category.findMany({
    orderBy: [{ kind: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true, children: true } } },
  });

  // Árbol: principales seguidas de sus subcategorías
  const roots = categories.filter((c) => !c.parentId);
  const ordered = roots.flatMap((root) => [root, ...categories.filter((c) => c.parentId === root.id)]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Link href="/admin/categorias/nueva" className="btn-primary">+ Nueva categoría</Link>
      </div>

      {saved && <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">Categoría guardada.</p>}
      {deleted && <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">Categoría eliminada.</p>}
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Línea</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ordered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">
                  {c.parentId && <span className="mr-2 text-slate-300">└</span>}
                  {c.name}
                  {c._count.children > 0 && <span className="ml-2 text-xs text-slate-400">({c._count.children} sub)</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3">{CATEGORY_KIND_LABELS[c.kind]}</td>
                <td className="px-4 py-3">
                  <Link href={`/productos?category=${c.slug}`} className="text-brand-700 hover:underline" target="_blank">
                    {c._count.products}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/categorias/${c.id}/editar`} className="text-brand-700 hover:underline">Editar</Link>
                    {c._count.products === 0 ? (
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="text-rose-600 hover:underline">Eliminar</button>
                      </form>
                    ) : (
                      <span className="cursor-help text-slate-300" title="Tiene productos: muévelos antes de eliminarla">Eliminar</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {ordered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hay categorías.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
