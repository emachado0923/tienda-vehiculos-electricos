import Link from "next/link";
import type { SiteConfig } from "@prisma/client";
import { Logo } from "@/components/brand/logo";

/** Footer con datos de contacto y redes sociales tomados de SiteConfig. */
export function SiteFooter({ config }: { config: SiteConfig }) {
  const socials = [
    { label: "Facebook", url: config.facebookUrl },
    { label: "Instagram", url: config.instagramUrl },
    { label: "X", url: config.xUrl },
    { label: "YouTube", url: config.youtubeUrl },
    { label: "TikTok", url: config.tiktokUrl },
    { label: "LinkedIn", url: config.linkedinUrl },
  ].filter((s): s is { label: string; url: string } => Boolean(s.url));

  return (
    <footer className="mt-16 bg-forest-900 text-brand-100/80">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo variant="dark" withTagline />
          <p className="mt-4 text-sm">Movilidad eléctrica y energía renovable para tu hogar y tu empresa.</p>
        </div>
        <div>
          <p className="font-semibold text-white">Tienda</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/productos?kind=EV_ACCESSORY" className="hover:text-white">Accesorios EV</Link></li>
            <li><Link href="/productos?kind=RENEWABLE_ENERGY" className="hover:text-white">Energía solar</Link></li>
            <li><Link href="/cuenta" className="hover:text-white">Mi cuenta</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Contacto</p>
          <ul className="mt-3 space-y-2 text-sm">
            {config.contactEmail && <li>✉ {config.contactEmail}</li>}
            {config.contactPhone && <li>☎ {config.contactPhone}</li>}
            {config.whatsapp && <li>WhatsApp: {config.whatsapp}</li>}
            {config.address && <li>{config.address}</li>}
          </ul>
        </div>
        {socials.length > 0 && (
          <div>
            <p className="font-semibold text-white">Síguenos</p>
            <ul className="mt-3 flex flex-wrap gap-3 text-sm">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <p className="border-t border-forest-800 py-4 text-center text-xs text-brand-100/50">
        © {new Date().getFullYear()} {config.storeName}. Todos los derechos reservados.
      </p>
    </footer>
  );
}
