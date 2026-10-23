import Image from "next/image";
import Link from "next/link";
import type { ConnectorType } from "@prisma/client";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { LogoMark } from "@/components/brand/logo";
import { CONNECTOR_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import type { ProductCardDTO } from "@/types";

/** Tarjeta de producto del catálogo. */
export function ProductCard({ product }: { product: ProductCardDTO }) {
  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/productos/${product.slug}`} className="relative block aspect-square bg-slate-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <LogoMark className="h-12 w-20 text-slate-300" />
          </div>
        )}
        {discount && (
          <span className="absolute bottom-3 left-3 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute top-3 right-3 rounded-full bg-slate-900/80 px-2 py-0.5 text-xs font-semibold text-white">
            Agotado
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium tracking-wide text-brand-700 uppercase">{product.categoryName}</p>
        <Link href={`/productos/${product.slug}`} className="line-clamp-2 font-semibold text-slate-900 hover:text-brand-700">
          {product.title}
        </Link>

        {/* Chips técnicos: conector y potencia */}
        <div className="flex flex-wrap gap-1.5">
          {product.connectorType && (
            <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
              {CONNECTOR_LABELS[product.connectorType as ConnectorType]}
            </span>
          )}
          {product.powerKw && (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              {product.powerKw} kW
            </span>
          )}
        </div>

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-bold">{formatPrice(product.price)}</span>
          {discount && (
            <span className="text-sm text-slate-400 line-through">{formatPrice(product.compareAtPrice!)}</span>
          )}
        </div>

        <AddToCartButton
          product={{
            productId: product.id,
            slug: product.slug,
            title: product.title,
            sku: product.sku,
            price: product.price,
            imageUrl: product.imageUrl,
            stock: product.stock,
          }}
        />
      </div>
    </article>
  );
}
