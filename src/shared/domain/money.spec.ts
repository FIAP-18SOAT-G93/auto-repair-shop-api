import { InvalidMoneyError, Money } from './money.js';

describe('Money', () => {
  describe('criação', () => {
    it('cria a partir de centavos', () => {
      expect(Money.fromCents(1999).cents).toBe(1999);
    });

    it('cria a partir de reais sem erro de ponto flutuante', () => {
      // 19.99 * 100 = 1998.9999999999998 em JavaScript
      expect(Money.fromDecimal(19.99).cents).toBe(1999);
      expect(Money.fromDecimal(0.1 + 0.2).cents).toBe(30);
    });

    it('cria o valor zero', () => {
      expect(Money.zero().cents).toBe(0);
    });

    it('rejeita mais de duas casas decimais', () => {
      expect(() => Money.fromDecimal(10.555)).toThrow(InvalidMoneyError);
    });

    it('rejeita valor negativo', () => {
      expect(() => Money.fromCents(-1)).toThrow(InvalidMoneyError);
    });

    it('rejeita centavos fracionados', () => {
      expect(() => Money.fromCents(10.5)).toThrow(InvalidMoneyError);
    });

    it('rejeita NaN e infinito', () => {
      expect(() => Money.fromCents(Number.NaN)).toThrow(InvalidMoneyError);
      expect(() => Money.fromCents(Number.POSITIVE_INFINITY)).toThrow(
        InvalidMoneyError,
      );
    });
  });

  describe('operações', () => {
    it('soma dois valores', () => {
      const total = Money.fromDecimal(10).add(Money.fromDecimal(5.5));
      expect(total.toDecimal()).toBe(15.5);
    });

    it('multiplica por uma quantidade sem erro de arredondamento', () => {
      expect(Money.fromDecimal(19.99).multiply(3).toDecimal()).toBe(59.97);
    });

    it('não permite multiplicar por número negativo', () => {
      expect(() => Money.fromDecimal(10).multiply(-1)).toThrow(
        InvalidMoneyError,
      );
    });

    it('é imutável, as operações devolvem uma nova instância', () => {
      const price = Money.fromDecimal(10);
      const total = price.add(Money.fromDecimal(1));

      expect(price.toDecimal()).toBe(10);
      expect(total).not.toBe(price);
    });
  });

  describe('igualdade', () => {
    it('é igual a outro Money com o mesmo valor', () => {
      expect(Money.fromCents(500).equals(Money.fromDecimal(5))).toBe(true);
    });

    it('é diferente de outro Money com valor diferente', () => {
      expect(Money.fromCents(500).equals(Money.fromCents(501))).toBe(false);
    });
  });
});
