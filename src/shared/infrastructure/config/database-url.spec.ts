import { databaseUrl } from './database-url.js';

const connection = {
  DB_HOST: 'localhost',
  DB_PORT: 5432,
  DB_USER: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'auto_repair_shop',
};

describe('databaseUrl', () => {
  it('monta a URL de conexão do PostgreSQL', () => {
    expect(databaseUrl(connection)).toBe(
      'postgresql://postgres:postgres@localhost:5432/auto_repair_shop?schema=public',
    );
  });
});
