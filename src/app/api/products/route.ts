import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminOrNull } from "@/lib/auth-guards";
import { getProducts, parseProductFilters } from "@/lib/queries/products";
import { productSchema } from "@/lib/validations/product";
import { createProduct, productErrorMessage } from "@/lib/services/products";
import { findInvalidImageUrl } from "@/lib/services/image-check";

/**
 * GET /api/products
 * Lista pública y paginada. Acepta los mismos filtros que el catálogo:
 *   ?q=tipo2&connector=TYPE2,CCS2&power=7.4-11&kind=EV_ACCESSORY&sort=price_asc&page=2
 */
export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const filters = parseProductFilters(params);
  const pageSize = Math.min(Number(params.pageSize) || 12, 100);

  const result = await getProducts(filters, pageSize);
  return NextResponse.json(result);
}

/**
 * POST /api/products  (solo ADMIN — cookie de sesión de Auth.js)
 * Body JSON con la forma de `productSchema`. Útil para integraciones
 * (importación masiva, ERP, scripts).
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminOrNull();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validación fallida", details: z.flattenError(parsed.error).fieldErrors },
      { status: 422 },
    );
  }

  const imageError = await findInvalidImageUrl(parsed.data.images);
  if (imageError) {
    return NextResponse.json({ error: imageError }, { status: 422 });
  }

  try {
    const product = await createProduct(parsed.data);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: productErrorMessage(error) }, { status: 409 });
  }
}
