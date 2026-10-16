import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'], {
      error: 'NODE_ENV deve ser development, production ou test',
    })
    .default('development'),

  PORT: z.coerce
    .number()
    .int({ error: 'PORT deve ser um número inteiro' })
    .min(1, { error: 'PORT deve estar entre 1 e 65535' })
    .max(65535, { error: 'PORT deve estar entre 1 e 65535' })
    .default(3000),
  DATABASE_URL: z.url({
    error: (issue) =>
      issue.input === undefined
        ? 'DATABASE_URL é obrigatória'
        : 'DATABASE_URL deve ser uma URL válida',
  }),
  JWT_SECRET: z
    .string()
    .min(32, { error: 'JWT_SECRET deve ter pelo menos 32 caracteres' }),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, {
    error: 'JWT_EXPIRES_IN deve estar no formato número + unidade (s, m, h, d)',
  }),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(
      `Variáveis de ambiente inválidas:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
