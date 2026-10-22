import type { Metadata } from "next";
import { getSiteConfig } from "@/lib/queries/site-config";
import { SiteConfigForm } from "./site-config-form";

export const metadata: Metadata = { title: "Configuración" };

export default async function SiteConfigPage() {
  const config = await getSiteConfig();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración del sitio</h1>
      <SiteConfigForm
        config={{
          ...config,
          freeShippingThreshold: config.freeShippingThreshold ? Number(config.freeShippingThreshold) : null,
          flatShippingFee: Number(config.flatShippingFee),
          updatedAt: undefined,
        }}
      />
    </div>
  );
}
