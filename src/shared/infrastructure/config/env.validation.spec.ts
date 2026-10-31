import { validateEnv } from './env.validation.js';

const validEnv = {
  NODE_ENV: 'test',
  PORT: '4000',
  DB_HOST: 'localhost',
  DB_PORT: '5433',
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'auto_repair_shop',
  JWT_SECRET: 'a'.repeat(32),
  JWT_EXPIRES_IN: '15m',
};

describe('validateEnv', () => {
  it('aceita um ambiente válido', () => {
    const env = validateEnv(validEnv);

    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe(4000);
    expect(env.DB_HOST).toBe('localhost');
    expect(env.DB_PORT).toBe(5433);
    expect(env.JWT_EXPIRES_IN).toBe('15m');
  });

  it('aplica valores padrão para NODE_ENV, PORT e DB_PORT', () => {
    const env: Record<string, unknown> = { ...validEnv };
    delete env.NODE_ENV;
    delete env.PORT;
    delete env.DB_PORT;

    const parsed = validateEnv(env);

    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.PORT).toBe(3000);
    expect(parsed.DB_PORT).toBe(5432);
  });

  it('rejeita NODE_ENV desconhecido', () => {
    expect(() =>
      validateEnv({ ...validEnv, NODE_ENV: 'desconhecido' }),
    ).toThrow(/NODE_ENV deve ser/);
  });

  it.each(['PORT', 'DB_PORT'])('rejeita %s fora do intervalo', (key) => {
    expect(() => validateEnv({ ...validEnv, [key]: '70000' })).toThrow(
      new RegExp(`${key} deve estar entre 1 e 65535`),
    );
  });

  it('rejeita PORT não inteiro', () => {
    expect(() => validateEnv({ ...validEnv, PORT: '3000.5' })).toThrow(
      /PORT deve ser um número inteiro/,
    );
  });

  it.each(['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'])(
    'rejeita quando %s está ausente',
    (key) => {
      const env: Record<string, unknown> = { ...validEnv };
      delete env[key];

      expect(() => validateEnv(env)).toThrow(
        new RegExp(`${key} é obrigatória`),
      );
    },
  );

  it('rejeita JWT_SECRET com menos de 32 caracteres', () => {
    expect(() => validateEnv({ ...validEnv, JWT_SECRET: 'curto' })).toThrow(
      /pelo menos 32 caracteres/,
    );
  });

  it('rejeita JWT_EXPIRES_IN em formato inválido', () => {
    expect(() =>
      validateEnv({ ...validEnv, JWT_EXPIRES_IN: 'uma hora' }),
    ).toThrow(/JWT_EXPIRES_IN deve estar no formato/);
  });
});
