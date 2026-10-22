import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <LogoMark className="h-16 w-16 text-brand-600" />
      <h1 className="text-3xl font-bold">Página no encontrada</h1>
      <p className="text-slate-600">Parece que este enlace se quedó sin carga.</p>
      <Link href="/" className="btn-primary">Volver al inicio</Link>
    </div>
  );
}
