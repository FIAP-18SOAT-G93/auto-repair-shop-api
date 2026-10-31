import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_USER = '',
  DB_PASSWORD = '',
  DB_NAME = '',
} = process.env;
const user = encodeURIComponent(DB_USER);
const password = encodeURIComponent(DB_PASSWORD);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: `postgresql://${user}:${password}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`,
  },
});
