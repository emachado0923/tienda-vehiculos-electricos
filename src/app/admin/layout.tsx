import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guards";
import { logoutAction } from "@/actions/auth.actions";
import { LogoMark } from "@/components/brand/logo";

// Datos en vivo (stock, precios, sesión): renderizar siempre en cada petición
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin E-Positive" } };

const NAV = [
  { href: "/admin", label: "Resumen", icon: "📊" },
  { href: "/admin/productos", label: "Productos", icon: "📦" },
  { href: "/admin/pedidos", label: "Pedidos", icon: "🧾" },
  { href: "/admin/configuracion", label: "Configuración", icon: "⚙️" },
];

/** Layout del dashboard. Doble protección: proxy.ts + requireAdmin aquí. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-night-900 text-slate-300 md:flex">
        <Link href="/admin" className="flex h-16 items-center gap-2 px-5 text-white">
          <LogoMark className="text-white" />
          <span className="font-bold">Admin</span>
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-night-800 hover:text-white">
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-night-800 p-4 text-xs">
          <p className="truncate">{admin.email}</p>
          <div className="mt-2 flex gap-3">
            <Link href="/" className="hover:text-white">Ver tienda</Link>
            <form action={logoutAction}><button className="hover:text-white">Salir</button></form>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        {/* Navegación compacta para móvil */}
        <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white p-3 md:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-3 py-1.5 text-sm whitespace-nowrap hover:bg-slate-100">
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto max-w-6xl p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
