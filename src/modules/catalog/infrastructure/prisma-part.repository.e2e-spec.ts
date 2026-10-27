import { randomUUID } from 'node:crypto';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { Money } from '../../../shared/domain/money.js';
import { Quantity } from '../../../shared/domain/quantity.js';
import { validateEnv } from '../../../shared/infrastructure/config/env.validation.js';
import { PrismaModule } from '../../../shared/infrastructure/database/prisma.module.js';
import { PrismaTransactionHost } from '../../../shared/infrastructure/database/prisma-transaction-host.js';
import { PartType } from '../domain/part-type.js';
import { PartNotFoundError } from '../domain/part.errors.js';
import { Part } from '../domain/part.js';
import { PrismaPartRepository } from './prisma-part.repository.js';

describe('PrismaPartRepository (integração)', () => {
  let moduleRef: TestingModule;
  let parts: PrismaPartRepository;
  let host: PrismaTransactionHost;
  const partIds: string[] = [];

  async function newPart(quantity = 10): Promise<Part> {
    const part = Part.create({
      name: `Peça E2E ${randomUUID()}`,
      type: PartType.PART,
      price: Money.fromDecimal(149.9),
      quantity: Quantity.of(quantity),
    });
    await parts.save(part);
    partIds.push(part.id);
    return part;
  }

  const quantityOf = async (id: string) =>
    (await parts.findById(id))?.quantity.value;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
        PrismaModule,
      ],
      providers: [PrismaPartRepository],
    }).compile();
    await moduleRef.init();

    parts = moduleRef.get(PrismaPartRepository);
    host = moduleRef.get(PrismaTransactionHost);
  });

  afterAll(async () => {
    await host?.client.part.deleteMany({ where: { id: { in: partIds } } });
    await moduleRef?.close();
  });

  it('grava e lê a peça de volta, com preço em centavos e saldo', async () => {
    const created = await newPart(10);

    const found = await parts.findById(created.id);

    expect(found?.name).toBe(created.name);
    expect(found?.type).toBe('PART');
    expect(found?.price.cents).toBe(14990);
    expect(found?.quantity.value).toBe(10);
  });

  it('responde null para id inexistente', async () => {
    expect(await parts.findById(randomUUID())).toBeNull();
  });

  it('o save de uma peça existente não sobrescreve o saldo', async () => {
    const stale = await newPart(10);
    await parts.deductStock(stale.id, Quantity.of(3));

    stale.update({
      name: 'Pastilha de freio cerâmica',
      type: PartType.PART,
      price: Money.fromDecimal(199.9),
    });
    await parts.save(stale);

    const found = await parts.findById(stale.id);
    expect(found?.name).toBe('Pastilha de freio cerâmica');
    expect(found?.quantity.value).toBe(7);
  });

  describe('deductStock (baixa atômica)', () => {
    it('subtrai a quantidade quando há saldo', async () => {
      const part = await newPart(5);

      expect(await parts.deductStock(part.id, Quantity.of(5))).toBe(true);
      expect(await quantityOf(part.id)).toBe(0);
    });

    it('não altera nada quando o saldo não basta', async () => {
      const part = await newPart(2);

      expect(await parts.deductStock(part.id, Quantity.of(3))).toBe(false);
      expect(await quantityOf(part.id)).toBe(2);
    });

    it('devolve false para peça inexistente', async () => {
      expect(await parts.deductStock(randomUUID(), Quantity.of(1))).toBe(
        false,
      );
    });

    it('baixas simultâneas nunca consomem mais que o saldo', async () => {
      const part = await newPart(3);

      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          parts.deductStock(part.id, Quantity.of(1)),
        ),
      );

      expect(results.filter(Boolean)).toHaveLength(3);
      expect(await quantityOf(part.id)).toBe(0);
    });
  });

  describe('addStock', () => {
    it('soma a quantidade ao saldo', async () => {
      const part = await newPart(0);

      await parts.addStock(part.id, Quantity.of(4));

      expect(await quantityOf(part.id)).toBe(4);
    });

    it('converte peça inexistente em PartNotFoundError', async () => {
      await expect(
        parts.addStock(randomUUID(), Quantity.of(1)),
      ).rejects.toThrow(PartNotFoundError);
    });
  });

  it('filtra a listagem pelas peças sem saldo', async () => {
    const outOfStock = await newPart(0);
    const inStock = await newPart(3);

    const page = await parts.list({ onlyOutOfStock: true }, 1, 100);
    const all = await parts.list({}, 1, 100);

    const ids = page.items.map((p) => p.id);
    expect(ids).toContain(outOfStock.id);
    expect(ids).not.toContain(inStock.id);
    expect(all.items.map((p) => p.id)).toEqual(
      expect.arrayContaining([outOfStock.id, inStock.id]),
    );
  });

  describe('delete', () => {
    it('apaga a linha do banco', async () => {
      const part = await newPart();

      await parts.delete(part.id);

      expect(await parts.findById(part.id)).toBeNull();
    });

    it('converte peça inexistente em PartNotFoundError', async () => {
      await expect(parts.delete(randomUUID())).rejects.toThrow(
        PartNotFoundError,
      );
    });
  });
});
