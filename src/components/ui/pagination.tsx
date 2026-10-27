import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  pageCount: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
};

/** Paginación basada en enlaces (Server Component, sin JS). */
export function Pagination({ page, pageCount, basePath, searchParams }: Props) {
  if (pageCount <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k !== "page" && typeof v === "string") params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Paginación">
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium",
            p === page ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-200",
          )}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
