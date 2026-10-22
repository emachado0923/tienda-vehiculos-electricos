import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteProductAction, toggleProductActiveAction } from "@/actions/product.actions";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Productos" };

type PageProps = { searchParams: Promise<{ q?: string; saved?: string }> };

/** Listado de inventario con búsqueda por título o SKU. */
export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { q, saved } = await searchParams;

  const products = await prisma.product.findMany({
    where: q ? { OR: [{ title: { contains: q } }, { sku: { contains: q } }] } : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      category: { select: { name: true } },
      images: { take: 1, orderBy: { position: "asc" } },
    },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Productos</h1>
        <div className="flex gap-2">
          <form>
            <input name="q" defaultValue={q} placeholder="Buscar título o SKU" className="input" />
          </form>
          <Link href="/admin/productos/nuevo" className="btn-primary">+ Nuevo producto</Link>
        </div>
      </div>

      {saved && <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-700">Producto guardado correctamente.</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                      {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="40px" className="object-cover" />}
                    </div>
                    <span className="font-medium">{p.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">{p.category.name}</td>
                <td className="px-4 py-3">{formatPrice(Number(p.price))}</td>
                <td className={`px-4 py-3 font-semibold ${p.stock <= 5 ? "text-rose-600" : ""}`}>{p.stock}</td>
                <td className="px-4 py-3">
                  <form action={toggleProductActiveAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.isActive ? "bg-brand-100 text-brand-700" : "bg-slate-200 text-slate-600"}`}>
                      {p.isActive ? "Activo" : "Inactivo"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/productos/${p.id}/editar`} className="text-brand-700 hover:underline">Editar</Link>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-rose-600 hover:underline">Eliminar</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">No hay productos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
