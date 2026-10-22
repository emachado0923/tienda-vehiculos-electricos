import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/actions/auth.actions";
import { CartButton } from "@/components/cart/cart-button";
import { Logo } from "@/components/brand/logo";

type Props = { storeName: string };

/** Header público (Server Component): lee la sesión en el servidor. */
export async function SiteHeader({ storeName }: Props) {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Link href="/" aria-label={`${storeName} — inicio`}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 md:flex">
          <Link href="/productos" className="hover:text-brand-700">Catálogo</Link>
          <Link href="/productos?kind=EV_ACCESSORY" className="hover:text-brand-700">Accesorios EV</Link>
          <Link href="/productos?kind=RENEWABLE_ENERGY" className="hover:text-brand-700">Energía solar</Link>
        </nav>

        {/* Búsqueda: formulario GET nativo, funciona sin JavaScript */}
        <form action="/productos" className="ml-auto hidden max-w-xs flex-1 sm:block">
          <input name="q" type="search" placeholder="Buscar cargador, CCS2, inversor…" className="input" />
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <CartButton />
          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
                  Admin
                </Link>
              )}
              <Link href="/cuenta" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Mi cuenta
              </Link>
              <form action={logoutAction}>
                <button className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">Salir</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn-primary">Ingresar</Link>
          )}
        </div>
      </div>
    </header>
  );
}
