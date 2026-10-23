import { readUpload } from "@/lib/storage";

type Context = { params: Promise<{ path: string[] }> };

/**
 * GET /uploads/AAAA/MM/archivo.ext
 * Sirve las imágenes guardadas por /api/uploads desde UPLOAD_DIR.
 * Los nombres son UUID inmutables, así que se pueden cachear "para siempre".
 */
export async function GET(_request: Request, { params }: Context) {
  const { path } = await params;
  const file = await readUpload(path);
  if (!file) return new Response("No encontrado", { status: 404 });

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
