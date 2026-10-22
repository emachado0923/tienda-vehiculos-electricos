import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getSiteConfig } from "@/lib/queries/site-config";

// Datos en vivo (stock, precios, sesión): renderizar siempre en cada petición
export const dynamic = "force-dynamic";

/** Layout de la tienda pública (header + footer). */
export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const config = await getSiteConfig();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader storeName={config.storeName} />
      <main className="flex-1">{children}</main>
      <SiteFooter config={config} />
    </div>
  );
}
