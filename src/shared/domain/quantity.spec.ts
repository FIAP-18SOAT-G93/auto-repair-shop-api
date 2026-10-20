import { InvalidQuantityError, Quantity } from './quantity.js';

describe('Quantity', () => {
  describe('criação', () => {
    it('cria a partir de um inteiro', () => {
      expect(Quantity.of(5).value).toBe(5);
    });

    it('cria o valor zero e verifica se é zero', () => {
      expect(Quantity.zero().isZero()).toBe(true);
    });

    it('rejeita valor negativo', () => {
      expect(() => Quantity.of(-1)).toThrow(InvalidQuantityError);
    });

    it('rejeita quantidade fracionada', () => {
      expect(() => Quantity.of(1.5)).toThrow(InvalidQuantityError);
    });

    it('rejeita NaN e infinito', () => {
      expect(() => Quantity.of(Number.NaN)).toThrow(InvalidQuantityError);
      expect(() => Quantity.of(Number.POSITIVE_INFINITY)).toThrow(
        InvalidQuantityError,
      );
    });
  });

  describe('operações', () => {
    it('soma dois valores', () => {
      const total = Quantity.of(3).add(Quantity.of(2));
      expect(total.value).toBe(5);
    });

    it('subtrai dois valores', () => {
      const total = Quantity.of(5).subtract(Quantity.of(2));
      expect(total.value).toBe(3);
    });

    it('resultado de uma subtração pode resultar em zero', () => {
      const total = Quantity.of(5).subtract(Quantity.of(5));
      expect(total.value).toBe(0);
    });

    it('resultado de uma subtração não pode ser negativa', () => {
      expect(() => Quantity.of(2).subtract(Quantity.of(3))).toThrow(
        InvalidQuantityError,
      );
    });

    it('é imutável, as operações devolvem uma nova instância', () => {
      const stock = Quantity.of(5);
      const total = stock.subtract(Quantity.of(2));

      expect(stock.value).toBe(5);
      expect(total).not.toBe(stock);
    });
  });

  describe('comparação', () => {
    it('é maior ou igual quando um valor é maior que o outro', () => {
      expect(Quantity.of(5).isGreaterThanOrEqual(Quantity.of(3))).toBe(true);
    });

    it('é maior ou igual quando os valores são iguais', () => {
      expect(Quantity.of(5).isGreaterThanOrEqual(Quantity.of(5))).toBe(true);
    });

    it('não é maior ou igual quando um valor é maior que o outro', () => {
      expect(Quantity.of(2).isGreaterThanOrEqual(Quantity.of(3))).toBe(false);
    });

    it('é igual a outro Quantity com o mesmo valor', () => {
      expect(Quantity.of(5).equals(Quantity.of(5))).toBe(true);
    });

    it('é diferente de outro Quantity com valor diferente', () => {
      expect(Quantity.of(5).equals(Quantity.of(3))).toBe(false);
    });
  });
});
