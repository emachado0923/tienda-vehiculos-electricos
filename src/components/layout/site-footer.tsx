import Link from "next/link";
import type { SiteConfig } from "@prisma/client";
import { Logo } from "@/components/brand/logo";

/** Íconos de marca (viewBox 24x24, relleno con currentColor). */
const SOCIAL_ICONS: Record<string, string> = {
  Facebook:
    "M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.600-1.500h1.500V4.400c-.3 0-1.200-.1-2.200-.1-2.200 0-3.700 1.300-3.700 3.800v2.400H8v3h2.700V21h2.800z",
  Instagram:
    "M7.500 3h9A4.500 4.500 0 0 1 21 7.500v9a4.500 4.500 0 0 1-4.500 4.500h-9A4.500 4.500 0 0 1 3 16.500v-9A4.500 4.500 0 0 1 7.500 3zm0 1.800A2.700 2.700 0 0 0 4.800 7.500v9a2.700 2.700 0 0 0 2.700 2.700h9a2.700 2.700 0 0 0 2.700-2.700v-9a2.700 2.700 0 0 0-2.700-2.700h-9zM12 7.500a4.500 4.500 0 1 1 0 9 4.500 4.500 0 0 1 0-9zm0 1.800a2.700 2.700 0 1 0 0 5.400 2.700 2.700 0 0 0 0-5.400zm4.700-3a1.050 1.050 0 1 1 0 2.100 1.050 1.050 0 0 1 0-2.100z",
  YouTube:
    "M21.600 7.200a2.500 2.500 0 0 0-1.800-1.800C18.200 5 12 5 12 5s-6.200 0-7.800.4A2.500 2.500 0 0 0 2.400 7.200C2 8.800 2 12 2 12s0 3.200.4 4.800a2.500 2.500 0 0 0 1.800 1.800C5.800 19 12 19 12 19s6.200 0 7.800-.4a2.500 2.500 0 0 0 1.800-1.800c.4-1.600.4-4.800.4-4.800s0-3.200-.4-4.800zM10 15V9l5.200 3L10 15z",
};

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
    <footer className="mt-16 bg-night-900 text-slate-300">
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
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-white"
                  >
                    {SOCIAL_ICONS[s.label] && (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                        <path d={SOCIAL_ICONS[s.label]} />
                      </svg>
                    )}
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <p className="border-t border-night-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {config.storeName}. Todos los derechos reservados.
      </p>
    </footer>
  );
}
