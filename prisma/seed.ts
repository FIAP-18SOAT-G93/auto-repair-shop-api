import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Credenciais de demonstração documentadas no README.
const DEMO_PASSWORD = 'Oficina@123';

const demoUsers = [
  {
    name: 'Gustavo Machado',
    email: 'atendente@oficina.com',
    role: 'ATTENDANT',
  },
  { name: 'Marco Antônio', email: 'mecanico@oficina.com', role: 'MECHANIC' },
  { name: 'Jorge Christino', email: 'gestor@oficina.com', role: 'MANAGER' },
] as const;

async function main(): Promise<void> {
  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: randomUUID(),
        ...user,
        passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      },
    });
  }
  console.log(`Seed: ${demoUsers.length} usuários de demonstração prontos.`);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
