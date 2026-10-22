/** Une clases de Tailwind ignorando valores falsy. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const currencyFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** Formatea un valor monetario en pesos colombianos. */
export function formatPrice(value: number | string) {
  return currencyFormatter.format(Number(value));
}

/** Genera un slug URL-friendly: "Cargador Tipo 2 7kW" -> "cargador-tipo-2-7kw". */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // quita tildes
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(date);
}
