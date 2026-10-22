/**
 * DTOs serializables (sin Decimal/Date) para pasar datos de Server
 * Components a Client Components.
 */
export type ProductCardDTO = {
  id: string;
  slug: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  imageUrl: string | null;
  categoryName: string;
  connectorType: string | null;
  powerKw: number | null;
};

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  sku: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  stock: number;
};

/** Estado estándar devuelto por las Server Actions usadas con useActionState. */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};
