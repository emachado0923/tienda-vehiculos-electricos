import { cn } from "@/lib/utils";

/**
 * Isotipo de EMC Positive Energy: anillo abierto con el signo "+" del polo
 * positivo y un punto de energía en la apertura. El anillo usa `currentColor`
 * para adaptarse a fondos claros u oscuros; el "+" y el punto conservan
 * siempre el naranja de marca.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-9 w-9", className)} aria-hidden="true">
      {/* Anillo abierto (hueco arriba a la derecha) */}
      <path
        d="M42.35 19.08A19 19 0 1 1 27.3 5.29"
        fill="none"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Punto de energía */}
      <circle cx="36.5" cy="11.5" r="3.2" fill="#f4572b" />
      {/* Signo positivo */}
      <rect x="21.4" y="15.5" width="5.2" height="17" rx="1.2" fill="#f4572b" />
      <rect x="15.5" y="21.4" width="17" height="5.2" rx="1.2" fill="#f4572b" />
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

/** Logotipo completo: isotipo + "EMC" + "POSITIVE ENERGY". */
export function Logo({ variant = "light", withTagline = false, className }: LogoProps) {
  const dark = variant === "dark";
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={dark ? "text-white" : "text-ink"} />
      <span className="flex flex-col leading-none">
        <span className={cn("text-2xl font-black tracking-wide", dark ? "text-white" : "text-ink")}>EMC</span>
        <span className={cn("mt-0.5 text-[0.6rem] font-medium tracking-[0.28em] uppercase", dark ? "text-slate-300" : "text-slate-600")}>
          Positive Energy
        </span>
        {withTagline && (
          <span className={cn("mt-1.5 text-[0.65rem]", dark ? "text-slate-400" : "text-slate-500")}>
            Accesorios para vehículos eléctricos
          </span>
        )}
      </span>
    </span>
  );
}
