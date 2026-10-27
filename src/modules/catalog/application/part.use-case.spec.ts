import { InvalidMoneyError } from '../../../shared/domain/money.js';
import {
  InvalidQuantityError,
  Quantity,
} from '../../../shared/domain/quantity.js';
import { PartType } from '../domain/part-type.js';
import {
  InvalidPartError,
  PartNotFoundError,
  PartOutOfStockError,
} from '../domain/part.errors.js';
import { InMemoryPartRepository } from '../testing/fakes.js';
import { CreatePartUseCase } from './create-part.use-case.js';
import { DeductStockUseCase } from './deduct-stock.use-case.js';
import { DeletePartUseCase } from './delete-part.use-case.js';
import { GetPartUseCase } from './get-part.use-case.js';
import { ListPartsUseCase } from './list-parts.use-case.js';
import { RegisterStockEntryUseCase } from './register-stock-entry.use-case.js';
import { ReverseStockUseCase } from './reverse-stock.use-case.js';
import { UpdatePartUseCase } from './update-part.use-case.js';

const input = {
  name: 'Pastilha de freio dianteira',
  type: PartType.PART,
  price: 149.9,
  quantity: 10,
};

function setup() {
  const parts = new InMemoryPartRepository();
  return {
    parts,
    create: new CreatePartUseCase(parts),
    get: new GetPartUseCase(parts),
    list: new ListPartsUseCase(parts),
    update: new UpdatePartUseCase(parts),
    remove: new DeletePartUseCase(parts),
    stockEntry: new RegisterStockEntryUseCase(parts),
    deduct: new DeductStockUseCase(parts),
    reverse: new ReverseStockUseCase(parts),
  };
}

describe('Casos de uso do estoque', () => {
  describe('CreatePartUseCase', () => {
    it('cadastra a peça com o saldo inicial, devolvendo o preço em reais', async () => {
      const { create, parts } = setup();

      const output = await create.execute(input);

      expect(output).toMatchObject({
        name: 'Pastilha de freio dianteira',
        type: 'PART',
        price: 149.9,
        quantity: 10,
      });
      expect((await parts.findById(output.id))?.price.cents).toBe(14990);
    });

    it.each<[Partial<typeof input>, new (message: string) => Error]>([
      [{ price: -1 }, InvalidMoneyError],
      [{ quantity: -1 }, InvalidQuantityError],
      [{ quantity: 1.5 }, InvalidQuantityError],
      [{ name: '' }, InvalidPartError],
    ])('rejeita %o sem gravar nada', async (override, error) => {
      const { create, parts } = setup();

      await expect(create.execute({ ...input, ...override })).rejects.toThrow(
        error,
      );
      expect(parts.parts.size).toBe(0);
    });
  });

  describe('consultas', () => {
    it('detalha a peça', async () => {
      const { create, get } = setup();
      const { id } = await create.execute(input);

      expect(await get.execute(id)).toMatchObject({ id, quantity: 10 });
    });

    it('responde não encontrado para id inexistente', async () => {
      const { get } = setup();

      await expect(get.execute('id-inexistente')).rejects.toThrow(
        PartNotFoundError,
      );
    });

    it('lista todas as peças ou só as indisponíveis', async () => {
      const { create, list } = setup();
      await create.execute(input);
      await create.execute({ ...input, name: 'Disco de freio', quantity: 0 });

      const all = await list.execute({ page: 1, pageSize: 10 });
      const unavailable = await list.execute({
        onlyOutOfStock: true,
        page: 1,
        pageSize: 10,
      });

      expect(all).toMatchObject({ total: 2, page: 1, pageSize: 10 });
      expect(unavailable.items.map((p) => p.name)).toEqual(['Disco de freio']);
    });
  });

  describe('UpdatePartUseCase', () => {
    it('altera os dados cadastrais, mas não o saldo', async () => {
      const { create, update, get } = setup();
      const { id } = await create.execute(input);

      await update.execute(id, {
        name: 'Óleo de motor 5W30 (1 L)',
        type: PartType.SUPPLY,
        price: 45,
      });

      expect(await get.execute(id)).toMatchObject({
        name: 'Óleo de motor 5W30 (1 L)',
        type: 'SUPPLY',
        price: 45,
        quantity: 10,
      });
    });

    it('responde não encontrado para id inexistente', async () => {
      const { update } = setup();

      await expect(update.execute('id-inexistente', input)).rejects.toThrow(
        PartNotFoundError,
      );
    });
  });

  describe('DeletePartUseCase', () => {
    it('apaga a peça', async () => {
      const { create, remove, parts } = setup();
      const { id } = await create.execute(input);

      await remove.execute(id);

      expect(parts.parts.has(id)).toBe(false);
    });

    it('responde não encontrado para id inexistente', async () => {
      const { remove } = setup();

      await expect(remove.execute('id-inexistente')).rejects.toThrow(
        PartNotFoundError,
      );
    });
  });

  describe('RegisterStockEntryUseCase', () => {
    it('soma a entrada ao saldo e devolve a peça atualizada', async () => {
      const { create, stockEntry, get } = setup();
      const { id } = await create.execute({ ...input, quantity: 0 });

      const output = await stockEntry.execute({ partId: id, quantity: 5 });

      expect(output.quantity).toBe(5);
      expect((await get.execute(id)).quantity).toBe(5);
    });

    it('rejeita entrada de quantidade zero', async () => {
      const { create, stockEntry } = setup();
      const { id } = await create.execute(input);

      await expect(
        stockEntry.execute({ partId: id, quantity: 0 }),
      ).rejects.toThrow(InvalidQuantityError);
    });

    it('responde não encontrado para peça inexistente', async () => {
      const { stockEntry } = setup();

      await expect(
        stockEntry.execute({ partId: 'id-inexistente', quantity: 1 }),
      ).rejects.toThrow(PartNotFoundError);
    });
  });

  describe('DeductStockUseCase', () => {
    it('dá baixa no saldo e devolve a peça com o preço ', async () => {
      const { create, deduct, get } = setup();
      const { id } = await create.execute(input);

      const output = await deduct.execute({ partId: id, quantity: 3 });

      expect(output).toMatchObject({ id, price: 149.9 });
      expect((await get.execute(id)).quantity).toBe(7);
    });

    it('rejeita baixa maior que o saldo, sem alterar nada', async () => {
      const { create, deduct, get } = setup();
      const { id } = await create.execute({ ...input, quantity: 2 });

      await expect(deduct.execute({ partId: id, quantity: 3 })).rejects.toThrow(
        PartOutOfStockError,
      );
      expect((await get.execute(id)).quantity).toBe(2);
    });

    it('rejeita a baixa se outra OS levou o saldo depois da leitura', async () => {
      const { create, deduct, parts } = setup();
      const { id } = await create.execute({ ...input, quantity: 1 });
      const read = parts.findById.bind(parts);
      vi.spyOn(parts, 'findById').mockImplementationOnce(async (partId) => {
        const snapshot = await read(partId);
        await parts.deductStock(partId, Quantity.of(1));
        return snapshot;
      });

      await expect(deduct.execute({ partId: id, quantity: 1 })).rejects.toThrow(
        PartOutOfStockError,
      );
      expect((await parts.findById(id))?.quantity.value).toBe(0);
    });

    it('responde não encontrado para peça inexistente', async () => {
      const { deduct } = setup();

      await expect(
        deduct.execute({ partId: 'id-inexistente', quantity: 1 }),
      ).rejects.toThrow(PartNotFoundError);
    });
  });

  describe('ReverseStockUseCase', () => {
    it('devolve ao saldo a quantidade baixada', async () => {
      const { create, deduct, reverse, get } = setup();
      const { id } = await create.execute(input);
      await deduct.execute({ partId: id, quantity: 4 });

      await reverse.execute({ partId: id, quantity: 4 });

      expect((await get.execute(id)).quantity).toBe(10);
    });

    it('responde não encontrado para peça inexistente', async () => {
      const { reverse } = setup();

      await expect(
        reverse.execute({ partId: 'id-inexistente', quantity: 1 }),
      ).rejects.toThrow(PartNotFoundError);
    });
  });
});
