import { randomUUID } from 'node:crypto';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { validateEnv } from '../../../shared/infrastructure/config/env.validation.js';
import { PrismaModule } from '../../../shared/infrastructure/database/prisma.module.js';
import { PrismaTransactionHost } from '../../../shared/infrastructure/database/prisma-transaction-host.js';
import { Customer } from '../domain/customer.js';
import { DocumentAlreadyRegisteredError } from '../domain/customer.errors.js';
import { Document } from '../domain/document.js';
import { generateCpf } from '../testing/document-generator.js';
import { PrismaCustomerRepository } from './prisma-customer.repository.js';

describe('PrismaCustomerRepository (integração)', () => {
  let moduleRef: TestingModule;
  let repository: PrismaCustomerRepository;
  let host: PrismaTransactionHost;
  const createdIds: string[] = [];

  async function saveNewCustomer(document?: string): Promise<Customer> {
    const customer = Customer.create({
      name: 'Cliente de Teste',
      document: Document.create(document ?? generateCpf()),
      email: 'cliente@teste.com',
      phone: '11987654321',
    });
    await repository.save(customer);
    createdIds.push(customer.id);
    return customer;
  }

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
        PrismaModule,
      ],
      providers: [PrismaCustomerRepository],
    }).compile();
    await moduleRef.init();

    repository = moduleRef.get(PrismaCustomerRepository);
    host = moduleRef.get(PrismaTransactionHost);
  });

  afterAll(async () => {
    await host?.client.customer.deleteMany({
      where: { id: { in: createdIds } },
    });
    await moduleRef?.close();
  });

  it('grava e lê o cliente de volta, por id e por documento', async () => {
    const customer = await saveNewCustomer();

    const byId = await repository.findById(customer.id);
    const byDocument = await repository.findByDocument(customer.document);

    expect(byId?.name).toBe('Cliente de Teste');
    expect(byId?.document.equals(customer.document)).toBe(true);
    expect(byId?.phone).toBe('11987654321');
    expect(byDocument?.id).toBe(customer.id);
  });

  it('atualiza o cliente existente em vez de criar outro', async () => {
    const customer = await saveNewCustomer();

    customer.update({ name: 'Nome Atualizado', email: null, phone: null });
    await repository.save(customer);

    const reloaded = await repository.findById(customer.id);
    expect(reloaded?.name).toBe('Nome Atualizado');
    expect(reloaded?.email).toBeNull();
  });

  it('converte documento duplicado em DocumentAlreadyRegisteredError', async () => {
    const document = generateCpf();
    await saveNewCustomer(document);

    await expect(saveNewCustomer(document)).rejects.toThrow(
      DocumentAlreadyRegisteredError,
    );
  });

  it('esconde o cliente removido das buscas, mas mantém o registro no banco', async () => {
    const customer = await saveNewCustomer();

    customer.delete(new Date());
    await repository.save(customer);

    expect(await repository.findById(customer.id)).toBeNull();
    expect(await repository.findByDocument(customer.document)).toBeNull();
    const row = await host.client.customer.findUnique({
      where: { id: customer.id },
    });
    expect(row?.deletedAt).toBeInstanceOf(Date);
  });

  it('permite cadastrar de novo o documento de um cliente removido', async () => {
    const removed = await saveNewCustomer();
    removed.delete(new Date());
    await repository.save(removed);

    const recreated = await saveNewCustomer(removed.document.value);

    expect((await repository.findByDocument(removed.document))?.id).toBe(
      recreated.id,
    );
  });

  it('devolve null para id inexistente', async () => {
    expect(await repository.findById(randomUUID())).toBeNull();
  });

  it('pagina a listagem sem repetir clientes entre as páginas', async () => {
    await saveNewCustomer();
    await saveNewCustomer();
    await saveNewCustomer();

    const first = await repository.list(1, 2);
    const second = await repository.list(2, 2);

    expect(first.items).toHaveLength(2);
    expect(first.total).toBeGreaterThanOrEqual(3);
    expect(second.items.length).toBeGreaterThan(0);
    expect(second.total).toBe(first.total);
    const firstIds = first.items.map((c) => c.id);
    expect(second.items.every((c) => !firstIds.includes(c.id))).toBe(true);
  });
});
