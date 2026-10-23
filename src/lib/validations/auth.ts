import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Correo inválido");
/** Política mínima de contraseña: 8+ caracteres con letras y números. */
const password = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres") // límite de bcrypt
  .regex(/[A-Za-z]/, "Debe incluir al menos una letra")
  .regex(/\d/, "Debe incluir al menos un número");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Ingresa tu nombre"),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

/** Cliente/admin: cambiar su propia contraseña. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "La nueva contraseña debe ser distinta a la actual",
  });

/** Admin: crear un usuario (cliente o administrador). */
export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre"),
  email,
  password,
  role: z.enum(["CUSTOMER", "ADMIN"]),
});

/** Admin: asignar una nueva contraseña a otro usuario. */
export const adminSetPasswordSchema = z.object({
  userId: z.string().min(1),
  password,
});
