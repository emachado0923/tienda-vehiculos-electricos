import { NextResponse, type NextRequest } from "next/server";
import { getAdminOrNull } from "@/lib/auth-guards";
import { saveUpload, UploadError } from "@/lib/storage";

const MAX_FILES = 10;

/**
 * POST /api/uploads  (solo ADMIN)
 * multipart/form-data con uno o varios campos "files".
 * Respuesta: { urls: string[] }
 *
 * Se usa una Route Handler (y no una Server Action) porque las Server Actions
 * limitan el cuerpo a 1 MB por defecto.
 */
export async function POST(request: NextRequest) {
  if (!(await getAdminOrNull())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const files = (formData?.getAll("files") ?? []).filter((f): f is File => f instanceof File);

  if (files.length === 0) return NextResponse.json({ error: "No se recibieron archivos." }, { status: 400 });
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Máximo ${MAX_FILES} imágenes por subida.` }, { status: 400 });
  }

  try {
    const urls: string[] = [];
    for (const file of files) urls.push(await saveUpload(file));
    return NextResponse.json({ urls }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 422 });
    console.error(error);
    return NextResponse.json({ error: "No se pudo guardar la imagen." }, { status: 500 });
  }
}
