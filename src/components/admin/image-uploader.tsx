"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Nombre del campo oculto que se envía con el formulario (una URL por línea). */
  name: string;
  defaultValue?: string[];
  error?: string;
  max?: number;
};

/**
 * Gestor de imágenes del producto:
 *  - Arrastrar y soltar o seleccionar archivos → se suben a /api/uploads
 *  - Agregar por URL (https://… de la imagen, no de la página)
 *  - Reordenar, marcar principal (la primera) y quitar
 * El resultado viaja en un <input type="hidden"> para la Server Action.
 */
export function ImageUploader({ name, defaultValue = [], error, max = 10 }: Props) {
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).slice(0, max - urls.length);
    if (list.length === 0) {
      setMessage(`Máximo ${max} imágenes por producto.`);
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const body = new FormData();
      list.forEach((f) => body.append("files", f));
      const res = await fetch("/api/uploads", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir");
      setUrls((prev) => [...prev, ...data.urls]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function addUrl() {
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith("https://") && !url.startsWith("/")) {
      setMessage("La URL debe empezar por https://");
      return;
    }
    setUrls((prev) => [...prev, url].slice(0, max));
    setUrlInput("");
    setMessage(null);
  }

  const move = (from: number, to: number) =>
    setUrls((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });

  const makeMain = (i: number) => setUrls((prev) => [prev[i], ...prev.filter((_, j) => j !== i)]);
  const remove = (i: number) => setUrls((prev) => prev.filter((_, j) => j !== i));

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={urls.join("\n")} />

      {/* Zona de arrastre */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInput.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-8 text-center transition",
          dragOver ? "border-brand-500 bg-brand-50" : "border-slate-300 hover:border-brand-500 hover:bg-slate-50",
        )}
      >
        <svg className="h-9 w-9 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm font-semibold">
          {uploading ? "Subiendo…" : "Arrastra imágenes aquí o haz clic para seleccionar"}
        </p>
        <p className="text-xs text-slate-500">JPG, PNG, WebP, GIF o AVIF · máx. 5 MB c/u · hasta {max}</p>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          hidden
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {/* Agregar por URL */}
      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // no enviar el formulario del producto
              addUrl();
            }
          }}
          placeholder="…o pega la dirección de una imagen (https://…/foto.jpg)"
          className="input"
        />
        <button type="button" onClick={addUrl} className="btn-secondary whitespace-nowrap">Agregar URL</button>
      </div>

      {(message || error) && <p className="text-sm text-rose-600" role="alert">{message ?? error}</p>}

      {/* Galería */}
      {urls.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {urls.map((url, i) => (
            <li key={`${url}-${i}`} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {/* <img> simple: la vista previa no necesita optimización */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-square w-full object-cover" />
              {i === 0 && (
                <span className="absolute top-2 left-2 rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-ink">Principal</span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-ink/75 p-1.5 text-xs text-white opacity-100 sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                <div className="flex gap-1">
                  <IconButton label="Mover a la izquierda" onClick={() => move(i, i - 1)} disabled={i === 0}>←</IconButton>
                  <IconButton label="Mover a la derecha" onClick={() => move(i, i + 1)} disabled={i === urls.length - 1}>→</IconButton>
                  {i !== 0 && <IconButton label="Usar como principal" onClick={() => makeMain(i)}>★</IconButton>}
                </div>
                <IconButton label="Quitar imagen" onClick={() => remove(i)}>✕</IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconButton({
  label, onClick, disabled, children,
}: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="rounded px-1.5 py-0.5 hover:bg-white/20 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
