import { z } from "zod";

export const userStatusSchema = z.enum(["active", "disabled"]);
export type UserStatus = z.infer<typeof userStatusSchema>;

export const roleSchema = z.enum([
  "admin",
  "diretor",
  "juiz",
  "supervisor",
  "servidor",
  "estagiario",
  "terceirizado",
]);

export const accessListUserSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  role: roleSchema,
  status: userStatusSchema,
  createdAt: z.date().nullable().optional(),
  updatedAt: z.date().nullable().optional(),
});
export type AccessListUser = z.infer<typeof accessListUserSchema>;

export const createUserFormSchema = z.object({
  email: z.string().min(1, "E-mail obrigatório.").email("Formato de e-mail inválido."),
  fullName: z
    .string()
    .min(2, "Mínimo 2 caracteres.")
    .max(120, "Máximo 120 caracteres."),
  role: roleSchema,
});
export type CreateUserForm = z.infer<typeof createUserFormSchema>;
