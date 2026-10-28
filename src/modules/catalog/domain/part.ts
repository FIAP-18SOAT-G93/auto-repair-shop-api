import { randomUUID } from 'node:crypto';
import { AggregateRoot } from '../../../shared/domain/aggregate-root.js';
import type { Money } from '../../../shared/domain/money.js';
import {
  InvalidQuantityError,
  type Quantity,
} from '../../../shared/domain/quantity.js';
import { PartType } from './part-type.js';
import { InvalidPartError, PartOutOfStockError } from './part.errors.js';

export interface PartDetails {
  name: string;
  type: PartType;
  price: Money;
}

interface PartProps extends PartDetails {
  quantity: Quantity;
}

const NAME_MAX_LENGTH = 100;
const PART_TYPES: readonly string[] = Object.values(PartType);

export class Part extends AggregateRoot {
  private constructor(
    id: string,
    private props: PartProps,
  ) {
    super(id);
  }

  static create(details: PartDetails & { quantity: Quantity }): Part {
    return new Part(randomUUID(), {
      ...Part.normalize(details),
      quantity: details.quantity,
    });
  }

  static restore(id: string, props: PartProps): Part {
    return new Part(id, props);
  }

  update(details: PartDetails): void {
    this.props = { ...this.props, ...Part.normalize(details) };
  }

  deduct(amount: Quantity): void {
    Part.assertPositive(amount);
    if (!this.quantity.isGreaterThanOrEqual(amount)) {
      throw new PartOutOfStockError();
    }
    this.props = { ...this.props, quantity: this.quantity.subtract(amount) };
  }

  reverse(amount: Quantity): void {
    this.increase(amount);
  }

  restock(amount: Quantity): void {
    this.increase(amount);
  }

  get name(): string {
    return this.props.name;
  }

  get type(): PartType {
    return this.props.type;
  }

  get price(): Money {
    return this.props.price;
  }

  get quantity(): Quantity {
    return this.props.quantity;
  }

  get isOutOfStock(): boolean {
    return this.props.quantity.isZero();
  }

  private increase(amount: Quantity): void {
    Part.assertPositive(amount);
    this.props = { ...this.props, quantity: this.quantity.add(amount) };
  }

  private static assertPositive(amount: Quantity): void {
    if (amount.isZero()) {
      throw new InvalidQuantityError(
        'A quantidade movimentada deve ser maior que zero',
      );
    }
  }

  private static normalize(details: PartDetails): PartDetails {
    const normalizedName = details.name.trim();

    if (normalizedName.length < 1) {
      throw new InvalidPartError('O nome não deve ser vazio.');
    }
    if (normalizedName.length > NAME_MAX_LENGTH) {
      throw new InvalidPartError(
        `O nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`,
      );
    }
    if (!PART_TYPES.includes(details.type)) {
      throw new InvalidPartError(
        'O tipo deve ser PART (peça) ou SUPPLY (insumo).',
      );
    }

    return { name: normalizedName, type: details.type, price: details.price };
  }
}
