import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

type PageProps = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: PageProps) {
  const { callbackUrl } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">Ingresar</h1>
        <p className="mt-1 mb-6 text-sm text-slate-500">Accede a tu cuenta para comprar y ver tus pedidos.</p>
        <LoginForm callbackUrl={callbackUrl} />
        <p className="mt-6 text-center text-sm text-slate-600">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-semibold text-brand-700 hover:underline">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
