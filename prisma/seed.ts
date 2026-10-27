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

// Peças e insumos de demonstração.
const demoParts = [
  {
    id: '7589ceda-f324-4e71-8eac-aedd171f08c2',
    name: 'Filtro de óleo',
    type: 'PART',
    priceCents: 3590,
    quantity: 20,
  },
  {
    id: '20d369bb-cef4-4738-ad63-2d351df8f120',
    name: 'Pastilha de freio dianteira',
    type: 'PART',
    priceCents: 14990,
    quantity: 8,
  },
  {
    id: '9a89122e-3041-4196-82ca-2c3e37a893d8',
    name: 'Disco de freio dianteiro',
    type: 'PART',
    priceCents: 21900,
    quantity: 0,
  },
  {
    id: '553f33f5-60ec-4d50-b248-f6f4fbed9a6e',
    name: 'Óleo de motor 5W30 (1 L)',
    type: 'SUPPLY',
    priceCents: 4500,
    quantity: 40,
  },
  {
    id: '470b5fe3-903f-4321-8d98-0f71cdbb45f6',
    name: 'Fluido de freio DOT 4 (500 mL)',
    type: 'SUPPLY',
    priceCents: 3200,
    quantity: 12,
  },
  {
    id: '83daa856-df95-42a6-9c7f-d99f7995f627',
    name: 'Aditivo de radiador (1 L)',
    type: 'SUPPLY',
    priceCents: 2800,
    quantity: 0,
  },
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

  for (const service of demoServices) {
    await prisma.service.upsert({
      where: { id: service.id },
      update: {},
      create: service,
    });
  }
  console.log(`Seed: ${demoServices.length} serviços de catálogo prontos.`);

  for (const part of demoParts) {
    await prisma.part.upsert({
      where: { id: part.id },
      update: {},
      create: part,
    });
  }
  console.log(`Seed: ${demoParts.length} peças e insumos em estoque prontos.`);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
