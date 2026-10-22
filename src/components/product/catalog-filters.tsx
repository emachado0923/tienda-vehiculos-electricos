"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  CATEGORY_KIND_LABELS,
  CONNECTOR_LABELS,
  INVERTER_LABELS,
  PANEL_LABELS,
  POWER_RANGES,
} from "@/lib/constants";

type Category = { id: string; name: string; slug: string; kind: string };

/**
 * Panel de filtros avanzados.
 * El estado vive en la URL (searchParams) → URLs compartibles, SEO y el
 * Server Component de la página vuelve a consultar MySQL en cada cambio.
 */
export function CatalogFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const getList = (key: string) => searchParams.get(key)?.split(",").filter(Boolean) ?? [];

  /** Actualiza un parámetro y vuelve a la página 1. */
  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  }

  /** Alterna un valor dentro de un filtro multi-selección (ej. connector=TYPE2,CCS2). */
  function toggleInList(key: string, value: string) {
    const list = getList(key);
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    setParam(key, next.length ? next.join(",") : null);
  }

  const kind = searchParams.get("kind");
  const showEv = !kind || kind === "EV_ACCESSORY";
  const showSolar = !kind || kind === "RENEWABLE_ENERGY";
  const hasFilters = [...searchParams.keys()].some((k) => k !== "sort" && k !== "page");

  return (
    <aside className={`space-y-6 transition-opacity ${isPending ? "opacity-60" : ""}`} aria-busy={isPending}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Filtros</h2>
        {hasFilters && (
          <button
            onClick={() => startTransition(() => router.push(pathname))}
            className="text-sm text-brand-700 hover:underline"
          >
            Limpiar
          </button>
        )}
      </div>

      <FilterGroup title="Línea">
        {Object.entries(CATEGORY_KIND_LABELS).map(([value, label]) => (
          <Radio key={value} name="kind" checked={kind === value} onChange={() => setParam("kind", kind === value ? null : value)}>
            {label}
          </Radio>
        ))}
      </FilterGroup>

      <FilterGroup title="Categoría">
        <select
          className="input"
          value={searchParams.get("category") ?? ""}
          onChange={(e) => setParam("category", e.target.value || null)}
        >
          <option value="">Todas</option>
          {categories
            .filter((c) => !kind || c.kind === kind)
            .map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
        </select>
      </FilterGroup>

      {showEv && (
        <>
          <FilterGroup title="Tipo de conector">
            {Object.entries(CONNECTOR_LABELS).map(([value, label]) => (
              <Checkbox key={value} checked={getList("connector").includes(value)} onChange={() => toggleInList("connector", value)}>
                {label}
              </Checkbox>
            ))}
          </FilterGroup>

          <FilterGroup title="Potencia">
            {POWER_RANGES.map((r) => (
              <Radio
                key={r.value}
                name="power"
                checked={searchParams.get("power") === r.value}
                onChange={() => setParam("power", searchParams.get("power") === r.value ? null : r.value)}
              >
                {r.label}
              </Radio>
            ))}
          </FilterGroup>
        </>
      )}

      {showSolar && (
        <>
          <FilterGroup title="Tipo de panel">
            {Object.entries(PANEL_LABELS).map(([value, label]) => (
              <Checkbox key={value} checked={getList("panel").includes(value)} onChange={() => toggleInList("panel", value)}>
                {label}
              </Checkbox>
            ))}
          </FilterGroup>
          <FilterGroup title="Tipo de inversor">
            {Object.entries(INVERTER_LABELS).map(([value, label]) => (
              <Checkbox key={value} checked={getList("inverter").includes(value)} onChange={() => toggleInList("inverter", value)}>
                {label}
              </Checkbox>
            ))}
          </FilterGroup>
        </>
      )}

      <FilterGroup title="Precio (COP)">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const params = new URLSearchParams(searchParams.toString());
            for (const key of ["minPrice", "maxPrice"]) {
              const v = String(fd.get(key) ?? "");
              if (v) params.set(key, v);
              else params.delete(key);
            }
            params.delete("page");
            startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
          }}
        >
          <input name="minPrice" type="number" min={0} placeholder="Mín" defaultValue={searchParams.get("minPrice") ?? ""} className="input" />
          <input name="maxPrice" type="number" min={0} placeholder="Máx" defaultValue={searchParams.get("maxPrice") ?? ""} className="input" />
          <button className="btn-secondary px-3">→</button>
        </form>
      </FilterGroup>

      <Checkbox checked={searchParams.get("inStock") === "1"} onChange={() => setParam("inStock", searchParams.get("inStock") === "1" ? null : "1")}>
        Solo con stock disponible
      </Checkbox>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2 border-t border-slate-200 pt-4">
      <legend className="mb-2 text-sm font-semibold text-slate-900">{title}</legend>
      {children}
    </fieldset>
  );
}

type ToggleProps = { checked: boolean; onChange: () => void; children: React.ReactNode };

function Checkbox({ checked, onChange, children }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-brand-600" />
      {children}
    </label>
  );
}

function Radio({ checked, onChange, children, name }: ToggleProps & { name: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      {/* onClick permite des-seleccionar un radio ya marcado */}
      <input type="radio" name={name} checked={checked} onChange={() => {}} onClick={onChange} className="h-4 w-4 accent-brand-600" />
      {children}
    </label>
  );
}
