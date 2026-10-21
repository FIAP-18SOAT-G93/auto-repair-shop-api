import { ValidationError } from './domain-error.js';

export class InvalidMoneyError extends ValidationError {}

export class Money {
  private constructor(readonly cents: number) {}

  static fromCents(cents: number): Money {
    Money.assertValid(cents);
    return new Money(cents);
  }

  /** Aceita no máximo duas casas decimais. */
  static fromDecimal(value: number): Money {
    const raw = value * 100;
    const cents = Math.round(raw);
    // Tolera o ruído do ponto flutuante (1998.9999999999998), mas não 10.555.
    if (Math.abs(raw - cents) > 1e-6) {
      throw new InvalidMoneyError(
        'O valor deve ter no máximo duas casas decimais',
      );
    }
    return Money.fromCents(cents);
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  multiply(factor: number): Money {
    return Money.fromCents(this.cents * factor);
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  toDecimal(): number {
    return this.cents / 100;
  }

  private static assertValid(cents: number): void {
    if (!Number.isInteger(cents)) {
      throw new InvalidMoneyError(
        'O valor monetário deve ser um número inteiro de centavos',
      );
    }
    if (cents < 0) {
      throw new InvalidMoneyError('O valor monetário não pode ser negativo');
    }
  }
}
