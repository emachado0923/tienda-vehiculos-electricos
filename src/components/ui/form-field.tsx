import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
};

/** Input con label y mensajes de error de validación (Zod). */
export function FormField({ label, name, errors, hint, className, ...props }: Props) {
  const errorId = errors?.length ? `${name}-error` : undefined;
  return (
    <div className={className}>
      <label htmlFor={name} className="label">{label}</label>
      <input
        id={name}
        name={name}
        aria-invalid={!!errorId}
        aria-describedby={errorId}
        className={cn("input", errorId && "border-rose-400")}
        {...props}
      />
      {hint && !errorId && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {errorId && <p id={errorId} className="mt-1 text-xs text-rose-600">{errors![0]}</p>}
    </div>
  );
}

export function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="mt-1 text-xs text-rose-600">{errors[0]}</p> : null;
}
