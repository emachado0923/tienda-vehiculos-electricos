import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Almacenamiento de archivos subidos (imágenes de productos).
 *
 * Driver local: guarda en UPLOAD_DIR (por defecto ./storage/uploads, fuera
 * de /public porque Next.js no sirve en producción archivos agregados a
 * /public después del build) y se sirven por la ruta /uploads/[...path].
 *
 * Para producción en serverless (Vercel) el disco es efímero: reemplaza
 * `saveUpload` por un driver de Cloudinary / S3 / UploadThing que devuelva
 * la URL https pública; el resto de la app no cambia.
 */

export const UPLOAD_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? "storage/uploads");
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

/** Tipos permitidos. SVG se excluye a propósito: puede contener scripts (XSS). */
const SIGNATURES: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
  { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "webp", mime: "image/webp", test: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  { ext: "gif", mime: "image/gif", test: (b) => b.toString("ascii", 0, 4) === "GIF8" },
  { ext: "avif", mime: "image/avif", test: (b) => b.toString("ascii", 4, 12) === "ftypavif" },
];

export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(SIGNATURES.map((s) => [s.ext, s.mime]));

export class UploadError extends Error {}

/**
 * Valida y guarda una imagen. Devuelve la URL pública (/uploads/AAAA/MM/uuid.ext).
 * El tipo se detecta por los "magic bytes" del contenido, no por el nombre
 * ni por el Content-Type que envía el navegador (ambos falsificables).
 */
export async function saveUpload(file: File): Promise<string> {
  if (file.size === 0) throw new UploadError(`"${file.name}" está vacío.`);
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`"${file.name}" supera el máximo de 5 MB.`);

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = SIGNATURES.find((s) => s.test(buffer));
  if (!type) throw new UploadError(`"${file.name}" no es una imagen válida (usa JPG, PNG, WebP, GIF o AVIF).`);

  const now = new Date();
  const folder = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
  const fileName = `${randomUUID()}.${type.ext}`;

  await mkdir(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, folder), { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, folder, fileName), buffer);

  return `/uploads/${folder.replaceAll(path.sep, "/")}/${fileName}`;
}

/**
 * Lee un archivo subido a partir de los segmentos de la URL.
 * Devuelve null si no existe o si la ruta intenta salir de UPLOAD_DIR.
 */
export async function readUpload(segments: string[]) {
  const filePath = path.resolve(/*turbopackIgnore: true*/ UPLOAD_DIR, ...segments);
  // Protección contra path traversal (/uploads/../../.env)
  if (!filePath.startsWith(UPLOAD_DIR + path.sep)) return null;

  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = MIME_BY_EXT[ext];
  if (!mime) return null;

  try {
    return { data: await readFile(filePath), mime };
  } catch {
    return null;
  }
}
