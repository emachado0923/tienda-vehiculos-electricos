import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/queries/products";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { LogoMark } from "@/components/brand/logo";
import { CONNECTOR_LABELS, INVERTER_LABELS, PANEL_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return product
    ? { title: product.title, description: product.shortDescription ?? undefined }
    : { title: "Producto no encontrado" };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const price = Number(product.price);
  const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const specs = (product.specs ?? {}) as Record<string, string>;

  // Atributos técnicos indexados + especificaciones libres
  const technical: [string, string][] = [
    ["SKU", product.sku],
    ...(product.brand ? [["Marca", product.brand] as [string, string]] : []),
    ...(product.connectorType ? [["Conector", CONNECTOR_LABELS[product.connectorType]] as [string, string]] : []),
    ...(product.powerKw ? [["Potencia", `${Number(product.powerKw)} kW`] as [string, string]] : []),
    ...(product.panelType ? [["Tipo de panel", PANEL_LABELS[product.panelType]] as [string, string]] : []),
    ...(product.inverterType ? [["Tipo de inversor", INVERTER_LABELS[product.inverterType]] as [string, string]] : []),
    ...Object.entries(specs),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/productos" className="hover:text-brand-700">Catálogo</Link>
        {" / "}
        <Link href={`/productos?category=${product.category.slug}`} className="hover:text-brand-700">
          {product.category.name}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Galería */}
        <div className="space-y-3">
          <div className="card relative aspect-square overflow-hidden">
            {product.images[0] ? (
              <Image src={product.images[0].url} alt={product.images[0].alt ?? product.title} fill priority sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <LogoMark className="h-16 w-28 text-slate-300" />
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.slice(1).map((img) => (
                <div key={img.id} className="card relative aspect-square overflow-hidden">
                  <Image src={img.url} alt={img.alt ?? ""} fill sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{product.title}</h1>
          {product.shortDescription && <p className="mt-3 text-slate-600">{product.shortDescription}</p>}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold">{formatPrice(price)}</span>
            {compareAt && compareAt > price && (
              <span className="text-lg text-slate-400 line-through">{formatPrice(compareAt)}</span>
            )}
          </div>
          <p className={`mt-2 text-sm font-medium ${product.stock > 0 ? "text-brand-700" : "text-rose-600"}`}>
            {product.stock > 0 ? `${product.stock} unidades disponibles` : "Sin stock"}
          </p>

          <AddToCartButton
            withQuantity
            className="mt-6 max-w-md"
            product={{
              productId: product.id,
              slug: product.slug,
              title: product.title,
              sku: product.sku,
              price,
              imageUrl: product.images[0]?.url ?? null,
              stock: product.stock,
            }}
          />

          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">Especificaciones técnicas</h2>
            <dl className="card divide-y divide-slate-100">
              {technical.map(([k, v]) => (
                <div key={k} className="grid grid-cols-2 gap-4 px-4 py-2.5 text-sm">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">Descripción</h2>
            <div className="whitespace-pre-line text-slate-700">{product.description}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
