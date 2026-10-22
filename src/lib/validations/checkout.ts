import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const addressSchema = z.object({
  label: z.string().trim().max(60).optional(),
  fullName: z.string().trim().min(3, "Nombre requerido"),
  phone: z.string().trim().min(7, "Teléfono inválido"),
  line1: z.string().trim().min(5, "Dirección requerida"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, "Ciudad requerida"),
  state: z.string().trim().min(2, "Departamento requerido"),
  postalCode: z.string().trim().optional(),
  country: z.string().length(2).default("CO"),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "El carrito está vacío"),
  address: addressSchema,
  paymentMethod: z.enum(PaymentMethod),
  saveAddress: z.boolean().default(false),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
