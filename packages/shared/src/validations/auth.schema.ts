import { z } from "zod";

const emailField = z.email({
  error: (issue) =>
    issue.input === undefined ? "O e-mail é obrigatório" : "Formato de e-mail inválido",
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ message: "A senha é obrigatória" }).min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export type LoginDTO = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string({ message: "O nome é obrigatório" }).min(3, "O nome deve ter no mínimo 3 caracteres"),
    email: emailField,
    password: z.string({ message: "A senha é obrigatória" }).min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string({ message: "Você deve confirmar a senha" }).min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type RegisterDTO = z.infer<typeof registerSchema>;

