import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, getProducts, parseProductFilters } from "@/lib/queries/products";
import { ProductCard } from "@/components/product/product-card";
import { CatalogFilters } from "@/components/product/catalog-filters";
import { SortSelect } from "@/components/product/sort-select";
import { Pagination } from "@/components/ui/pagination";

export const metadata: Metadata = { title: "Catálogo" };

type PageProps = {
  // Next.js 15+: searchParams es una Promise
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Catálogo de productos (Server Component).
 * Lee los filtros de la URL, consulta MySQL vía Prisma y renderiza en el
 * servidor. Los filtros (Client Component) solo modifican la URL.
 */
export default async function CatalogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseProductFilters(params);

  const [{ items, total, page, pageCount }, categories] = await Promise.all([
    getProducts(filters),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {filters.q ? `Resultados para “${filters.q}”` : "Catálogo"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} {total === 1 ? "producto" : "productos"}
          </p>
        </div>
        <Suspense>
          <SortSelect />
        </Suspense>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* useSearchParams en Client Components requiere un límite de Suspense */}
        <Suspense>
          <CatalogFilters categories={categories} />
        </Suspense>

        <section>
          {items.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 p-16 text-center">
              <span className="text-5xl">🔍</span>
              <p className="font-semibold">No encontramos productos con esos filtros.</p>
              <p className="text-sm text-slate-500">Prueba quitando algún filtro o cambiando la búsqueda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          <Pagination page={page} pageCount={pageCount} basePath="/productos" searchParams={params} />
        </section>
      </div>
    </div>
  );
}
