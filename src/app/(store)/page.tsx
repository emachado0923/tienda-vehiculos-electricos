import Image from "next/image";
import Link from "next/link";
import { getSiteConfig } from "@/lib/queries/site-config";
import { getFeaturedProducts } from "@/lib/queries/products";
import { ProductCard } from "@/components/product/product-card";

const HIGHLIGHTS = [
  { icon: "🔌", title: "Cargadores y wallbox", href: "/productos?kind=EV_ACCESSORY&category=cargadores" },
  { icon: "🔁", title: "Adaptadores Tipo 1 / Tipo 2 / CCS2", href: "/productos?category=adaptadores" },
  { icon: "☀️", title: "Paneles solares", href: "/productos?category=paneles-solares" },
  { icon: "🔋", title: "Baterías LiFePO4", href: "/productos?category=baterias" },
];

export default async function HomePage() {
  const [config, featured] = await Promise.all([getSiteConfig(), getFeaturedProducts()]);

  return (
    <>
      {/* Hero administrable desde /admin/configuracion */}
      <section className="relative overflow-hidden bg-forest-900 text-white">
        {config.heroImageUrl && (
          <Image src={config.heroImageUrl} alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:py-32">
          <p className="mb-3 inline-block rounded-full bg-brand-500/20 px-3 py-1 text-sm font-medium text-brand-100">
            Movilidad eléctrica · Energía renovable
          </p>
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight sm:text-6xl">{config.heroTitle}</h1>
          {config.heroSubtitle && <p className="mt-5 max-w-xl text-lg text-slate-200">{config.heroSubtitle}</p>}
          {config.heroCtaText && (
            <Link href={config.heroCtaUrl ?? "/productos"} className="btn-primary mt-8 px-6 py-3 text-base">
              {config.heroCtaText} →
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-12 lg:grid-cols-4">
        {HIGHLIGHTS.map((h) => (
          <Link key={h.title} href={h.href} className="card flex items-center gap-3 p-5 transition hover:border-brand-500">
            <span className="text-3xl">{h.icon}</span>
            <span className="font-semibold">{h.title}</span>
          </Link>
        ))}
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold">Destacados</h2>
            <Link href="/productos" className="text-sm font-semibold text-brand-700 hover:underline">
              Ver todo el catálogo →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
