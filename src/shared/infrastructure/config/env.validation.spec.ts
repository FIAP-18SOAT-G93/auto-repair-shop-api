import { validateEnv } from './env.validation.js';

const validEnv = {
  NODE_ENV: 'test',
  PORT: '4000',
  DATABASE_URL:
    'postgresql://postgres:postgres@localhost:5432/auto_repair_shop?schema=public',
  JWT_SECRET: 'a'.repeat(32),
  JWT_EXPIRES_IN: '15m',
};

describe('validateEnv', () => {
  it('aceita um ambiente válido', () => {
    const env = validateEnv(validEnv);

    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(env.JWT_EXPIRES_IN).toBe('15m');
  });

  it('aplica valores padrão para NODE_ENV e PORT', () => {
    const env = validateEnv({
      DATABASE_URL: validEnv.DATABASE_URL,
      JWT_SECRET: validEnv.JWT_SECRET,
      JWT_EXPIRES_IN: '1h',
    });

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
  });

  it('rejeita NODE_ENV desconhecido', () => {
    expect(() =>
      validateEnv({ ...validEnv, NODE_ENV: 'desconhecido' }),
    ).toThrow(/NODE_ENV deve ser/);
  });

  it('rejeita PORT fora do intervalo', () => {
    expect(() => validateEnv({ ...validEnv, PORT: '70000' })).toThrow(
      /PORT deve estar entre 1 e 65535/,
    );
  });

  it('rejeita PORT não inteiro', () => {
    expect(() => validateEnv({ ...validEnv, PORT: '3000.5' })).toThrow(
      /PORT deve ser um número inteiro/,
    );
  });

  it('rejeita quando DATABASE_URL está ausente', () => {
    const env: Record<string, unknown> = { ...validEnv };
    delete env.DATABASE_URL;

    expect(() => validateEnv(env)).toThrow(/DATABASE_URL é obrigatória/);
  });

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
