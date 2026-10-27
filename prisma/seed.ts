import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Credenciais de demonstração.
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

// Serviços de demonstração.
const demoServices = [
  {
    id: '2664b3c2-23cd-4136-b521-afef4f167817',
    name: 'Troca de óleo e filtro',
    description: 'Troca do óleo do motor e do filtro de óleo',
    priceCents: 12000,
    estimatedMinutes: 60,
  },
  {
    id: 'ca50d8f4-3120-48f9-b4d2-70079304d8f6',
    name: 'Alinhamento',
    description: 'Alinhamento da direção nas rodas dianteiras',
    priceCents: 8990,
    estimatedMinutes: 40,
  },
  {
    id: 'c2ce0f6f-f055-42ce-86a7-474eb18224e5',
    name: 'Balanceamento',
    description: 'Balanceamento das quatro rodas',
    priceCents: 6000,
    estimatedMinutes: 30,
  },
  {
    id: 'de86183b-264f-4a12-a082-f89831c5b614',
    name: 'Diagnóstico eletrônico',
    description: 'Leitura de falhas da central eletrônica com scanner',
    priceCents: 15000,
    estimatedMinutes: 45,
  },
  {
    id: '5d22d890-e01b-4ad7-9235-4f54d456e06a',
    name: 'Revisão de freios',
    description: 'Inspeção de pastilhas, discos e fluido de freio',
    priceCents: 18000,
    estimatedMinutes: 90,
  },
  {
    id: '59ce8c28-1cfe-4fd6-9ca8-2bc947d72d89',
    name: 'Inspeção visual',
    description: 'Checagem gratuita de itens de segurança',
    priceCents: 0,
    estimatedMinutes: 20,
  },
];

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

  for (const service of demoServices) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: {},
      create: service,
    });
  }
  console.log(`Seed: ${demoServices.length} serviços de catálogo prontos.`);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
