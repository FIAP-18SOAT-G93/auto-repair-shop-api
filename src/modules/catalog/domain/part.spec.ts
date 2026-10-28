import { Money } from '../../../shared/domain/money.js';
import {
  InvalidQuantityError,
  Quantity,
} from '../../../shared/domain/quantity.js';
import { PartType } from './part-type.js';
import { InvalidPartError, PartOutOfStockError } from './part.errors.js';
import { Part } from './part.js';

const validInput = {
  name: '  Pastilha de freio dianteira  ',
  type: PartType.PART,
  price: Money.fromDecimal(149.9),
  quantity: Quantity.of(10),
};

const newPart = (quantity = 10) =>
  Part.create({ ...validInput, quantity: Quantity.of(quantity) });

describe('Part', () => {
  describe('create', () => {
    it('cria a peça com id novo, nome sem espaços nas pontas e o saldo inicial', () => {
      const part = Part.create(validInput);

      expect(part.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(part.name).toBe('Pastilha de freio dianteira');
      expect(part.type).toBe('PART');
      expect(part.price.cents).toBe(14990);
      expect(part.quantity.value).toBe(10);
      expect(part.isOutOfStock).toBe(false);
    });

    it('aceita insumo cadastrado sem saldo', () => {
      const supply = Part.create({
        ...validInput,
        type: PartType.SUPPLY,
        quantity: Quantity.zero(),
      });

      expect(supply.type).toBe('SUPPLY');
      expect(supply.isOutOfStock).toBe(true);
    });

    it('rejeita nome vazio', () => {
      expect(() => Part.create({ ...validInput, name: '   ' })).toThrow(
        InvalidPartError,
      );
    });

    it('rejeita nome com mais de 100 caracteres', () => {
      expect(() =>
        Part.create({ ...validInput, name: 'A'.repeat(101) }),
      ).toThrow(InvalidPartError);
    });

    it('rejeita tipo desconhecido', () => {
      expect(() =>
        Part.create({ ...validInput, type: 'TOOL' as PartType }),
      ).toThrow(InvalidPartError);
    });
  });

  describe('update', () => {
    it('altera os dados cadastrais sem mexer na quantidade', () => {
      const part = newPart(7);

      part.update({
        name: 'Pastilha de freio cerâmica',
        type: PartType.PART,
        price: Money.fromDecimal(199.9),
      });

      expect(part.name).toBe('Pastilha de freio cerâmica');
      expect(part.price.cents).toBe(19990);
      expect(part.quantity.value).toBe(7);
    });

    it('aplica as mesmas validações da criação', () => {
      const part = newPart();

      expect(() => part.update({ ...validInput, name: '' })).toThrow(
        InvalidPartError,
      );
    });
  });

  describe('deduct (baixa)', () => {
    it('subtrai a quantidade do saldo', () => {
      const part = newPart(10);

      part.deduct(Quantity.of(3));

      expect(part.quantity.value).toBe(7);
    });

    it('pode consumir o saldo inteiro, deixando a peça indisponível', () => {
      const part = newPart(2);

      part.deduct(Quantity.of(2));

      expect(part.quantity.value).toBe(0);
      expect(part.isOutOfStock).toBe(true);
    });

    it('rejeita baixa maior que o saldo, sem alterar a quantidade', () => {
      const part = newPart(2);

      expect(() => part.deduct(Quantity.of(3))).toThrow(PartOutOfStockError);
      expect(part.quantity.value).toBe(2);
    });

    it('rejeita baixa de quantidade zero', () => {
      expect(() => newPart().deduct(Quantity.zero())).toThrow(
        InvalidQuantityError,
      );
    });
  });

  describe('reverse (estorno) e restock (entrada)', () => {
    it('o estorno devolve a quantidade ao saldo', () => {
      const part = newPart(10);
      part.deduct(Quantity.of(4));

      part.reverse(Quantity.of(4));

      expect(part.quantity.value).toBe(10);
    });

    it('a entrada de estoque torna disponível uma peça sem saldo', () => {
      const part = newPart(0);

      part.restock(Quantity.of(5));

      expect(part.quantity.value).toBe(5);
      expect(part.isOutOfStock).toBe(false);
    });

    it.each<[string, (part: Part) => void]>([
      ['estorno', (part) => part.reverse(Quantity.zero())],
      ['entrada', (part) => part.restock(Quantity.zero())],
    ])('rejeita %s de quantidade zero', (_operation, move) => {
      expect(() => move(newPart())).toThrow(InvalidQuantityError);
    });
  });

  describe('restore', () => {
    it('reconstitui a peça do banco com o id e o saldo gravados', () => {
      const part = Part.restore('44444444-4444-4444-4444-444444444444', {
        name: 'Óleo 5W30 (1 L)',
        type: PartType.SUPPLY,
        price: Money.fromCents(4500),
        quantity: Quantity.of(12),
      });

      expect(part.id).toBe('44444444-4444-4444-4444-444444444444');
      expect(part.type).toBe('SUPPLY');
      expect(part.quantity.value).toBe(12);
    });
  });
});
