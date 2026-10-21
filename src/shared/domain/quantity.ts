import { ValidationError } from './domain-error.js';

export class InvalidQuantityError extends ValidationError {}

export class Quantity {
  private constructor(readonly value: number) {}

  static of(value: number): Quantity {
    if (!Number.isInteger(value)) {
      throw new InvalidQuantityError('A quantidade deve ser um número inteiro');
    }
    if (value < 0) {
      throw new InvalidQuantityError('A quantidade não pode ser negativa');
    }
    return new Quantity(value);
  }

  static zero(): Quantity {
    return new Quantity(0);
  }

  add(other: Quantity): Quantity {
    return Quantity.of(this.value + other.value);
  }

  subtract(other: Quantity): Quantity {
    return Quantity.of(this.value - other.value);
  }

  isGreaterThanOrEqual(other: Quantity): boolean {
    return this.value >= other.value;
  }

  isZero(): boolean {
    return this.value === 0;
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }
}
