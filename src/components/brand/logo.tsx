import { cn } from "@/lib/utils";

/** Isotipo de Positive Energy: hoja verde con un rayo blanco. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden="true">
      {/* Hoja: punta superior y base redondeada */}
      <path d="M16 1.5C24.5 7 28 14.5 26 21.5 24.5 26.8 20.6 30 16 30.5 11.4 30 7.5 26.8 6 21.5 4 14.5 7.5 7 16 1.5Z" fill="currentColor" />
      {/* Rayo */}
      <path d="M17.6 7.5 11.2 18.2h4.4l-1.4 7.3 6.6-10.9h-4.5l1.3-7.1Z" fill="#fff" />
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

/** Logotipo completo: isotipo + "positive energy". */
export function Logo({ variant = "light", withTagline = false, className }: LogoProps) {
  const dark = variant === "dark";
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={cn("h-9 w-9", dark ? "text-brand-500" : "text-brand-600")} />
      <span className="flex flex-col leading-none">
        <span className="text-lg tracking-tight">
          <span className={cn("font-extrabold", dark ? "text-white" : "text-ink")}>positive</span>{" "}
          <span className={cn("font-medium", dark ? "text-brand-100" : "text-brand-600")}>energy</span>
        </span>
        {withTagline && (
          <span className={cn("mt-1 text-[0.6rem] font-medium tracking-[0.18em] uppercase", dark ? "text-brand-100/70" : "text-slate-500")}>
            Movilidad eléctrica · Energía limpia
          </span>
        )}
      </span>
    </span>
  );
}
