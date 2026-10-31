import { z } from 'zod';

const port = (name: string, fallback: number) =>
  z.coerce
    .number()
    .int({ error: `${name} deve ser um número inteiro` })
    .min(1, { error: `${name} deve estar entre 1 e 65535` })
    .max(65535, { error: `${name} deve estar entre 1 e 65535` })
    .default(fallback);

const requiredText = (name: string) =>
  z
    .string({ error: `${name} é obrigatória` })
    .min(1, { error: `${name} é obrigatória` });

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'], {
      error: 'NODE_ENV deve ser development, production ou test',
    })
    .default('development'),

  PORT: port('PORT', 3000),

  DB_HOST: requiredText('DB_HOST'),
  DB_PORT: port('DB_PORT', 5432),
  DB_USER: requiredText('DB_USER'),
  DB_PASSWORD: requiredText('DB_PASSWORD'),
  DB_NAME: requiredText('DB_NAME'),

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
