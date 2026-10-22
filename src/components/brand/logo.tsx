import { cn } from "@/lib/utils";

/**
 * Isotipo de E-Positive: batería con una celda ámbar marcada con "E" y el
 * signo "+" del polo positivo. El contorno usa `currentColor` para adaptarse
 * a fondos claros u oscuros; la celda conserva siempre el ámbar de marca.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 28" className={cn("h-7 w-12", className)} aria-hidden="true">
      {/* Cuerpo y borne de la batería */}
      <rect x="1.5" y="1.5" width="40" height="25" rx="5" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="43" y="9" width="4" height="10" rx="1.5" fill="currentColor" />
      {/* Celda cargada con la "E" */}
      <rect x="6" y="6" width="18" height="16" rx="2" fill="#f5a524" />
      <path d="M11 8.3h8v2.4h-5.2v2.1h4.6v2.3h-4.6v2.4h5.2v2.4H11z" fill="#151b26" />
      {/* Polo positivo */}
      <path d="M31.6 9h2.8v3.6H38v2.8h-3.6V19h-2.8v-3.6H28v-2.8h3.6z" fill="currentColor" />
    </svg>
  );
}

type LogoProps = {
  /** "light" para fondos claros, "dark" para fondos oscuros. */
  variant?: "light" | "dark";
  /** Muestra el eslogan bajo el nombre. */
  withTagline?: boolean;
  className?: string;
};

/** Logotipo completo: batería + "E-POSITIVE". */
export function Logo({ variant = "light", withTagline = false, className }: LogoProps) {
  const dark = variant === "dark";
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={dark ? "text-white" : "text-ink"} />
      <span className="flex flex-col leading-none">
        <span className={cn("text-lg font-extrabold tracking-[0.12em] uppercase", dark ? "text-white" : "text-ink")}>
          E-Positive
        </span>
        {withTagline && (
          <span className="mt-1 text-[0.6rem] font-semibold tracking-[0.16em] uppercase">
            <span className={dark ? "text-brand-400" : "text-brand-700"}>Carga · Accesorios</span>
            <span className={dark ? "text-slate-400" : "text-slate-500"}> · Energía limpia</span>
          </span>
        )}
      </span>
    </span>
  );
}
