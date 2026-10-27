import { Money } from '../../../shared/domain/money.js';
import { InvalidServiceError } from './service.errors.js';
import { Service } from './service.js';

const validInput = {
  name: '  Alinhamento  ',
  description: '  Alinhamento das rodas dianteiras  ',
  price: Money.fromDecimal(89.9),
  estimatedMinutes: 40,
};

describe('Service', () => {
  describe('create', () => {
    it('cria um serviço com id novo e textos sem espaços nas pontas', () => {
      const service = Service.create(validInput);

      expect(service.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(service.name).toBe('Alinhamento');
      expect(service.description).toBe('Alinhamento das rodas dianteiras');
      expect(service.price.cents).toBe(8990);
      expect(service.estimatedMinutes).toBe(40);
    });

    it('aceita serviço sem descrição, e trata descrição só com espaços como ausente', () => {
      expect(
        Service.create({ ...validInput, description: null }).description,
      ).toBeNull();
      expect(
        Service.create({ ...validInput, description: '   ' }).description,
      ).toBeNull();
    });

    it('aceita preço zero (serviço gratuito, como uma inspeção)', () => {
      expect(
        Service.create({ ...validInput, price: Money.zero() }).price.cents,
      ).toBe(0);
    });

    it('rejeita nome vazio', () => {
      expect(() => Service.create({ ...validInput, name: '  ' })).toThrow(
        InvalidServiceError,
      );
    });

    it('rejeita nome com mais de 100 caracteres', () => {
      expect(() =>
        Service.create({ ...validInput, name: 'A'.repeat(101) }),
      ).toThrow(InvalidServiceError);
    });

    it.each([
      [0, 'zero'],
      [-10, 'negativo'],
      [30.5, 'fracionado'],
    ])('rejeita tempo estimado %s (%s)', (estimatedMinutes) => {
      expect(() => Service.create({ ...validInput, estimatedMinutes })).toThrow(
        InvalidServiceError,
      );
    });
  });

  describe('update', () => {
    it('altera os dados, mantendo o id', () => {
      const service = Service.create(validInput);
      const { id } = service;

      service.update({
        name: 'Alinhamento e balanceamento',
        description: null,
        price: Money.fromDecimal(120),
        estimatedMinutes: 50,
      });

      expect(service.name).toBe('Alinhamento e balanceamento');
      expect(service.description).toBeNull();
      expect(service.price.cents).toBe(12000);
      expect(service.estimatedMinutes).toBe(50);
      expect(service.id).toBe(id);
    });

    it('aplica as mesmas validações da criação', () => {
      const service = Service.create(validInput);

      expect(() =>
        service.update({ ...validInput, estimatedMinutes: 0 }),
      ).toThrow(InvalidServiceError);
    });
  });

  describe('restore', () => {
    it('reconstitui o serviço do banco com o id gravado', () => {
      const service = Service.restore('33333333-3333-3333-3333-333333333333', {
        name: 'Balanceamento',
        description: null,
        price: Money.fromCents(6000),
        estimatedMinutes: 30,
      });

      expect(service.id).toBe('33333333-3333-3333-3333-333333333333');
      expect(service.name).toBe('Balanceamento');
      expect(service.price.toDecimal()).toBe(60);
    });
  });
});
