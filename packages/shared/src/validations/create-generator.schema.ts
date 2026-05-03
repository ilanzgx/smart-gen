import { z } from "zod";

export const createGeneratorSchema = z.object({
  name: z
    .string({ error: "O nome do gerador é obrigatório" })
    .min(1, "Informe um nome para o gerador"),
  description: z.string().optional(),
  mac_address: z
    .string({ error: "O endereço MAC do gerador é obrigatório" })
    .min(1, "Informe o endereço MAC do gerador"),
});

export type CreateGeneratorDTO = z.infer<typeof createGeneratorSchema>;
