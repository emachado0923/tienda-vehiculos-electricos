import Link from "next/link";
import { requireUser } from "@/lib/auth-guards";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Hola, {user.name ?? user.email}</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 md:flex-col">
          <Link href="/cuenta" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-200">Mis pedidos</Link>
          <Link href="/cuenta/direcciones" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-200">Direcciones</Link>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
