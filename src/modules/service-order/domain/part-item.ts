import type { Money } from '../../../shared/domain/money.js';
import type { Quantity } from '../../../shared/domain/quantity.js';
import { assertQuoteVersion } from './quote.js';
import { InvalidServiceOrderError } from './service-order.errors.js';

export interface PartItemProps {
  partId: string;
  name: string;
  unitPrice: Money;
  quantity: Quantity;
  quoteVersion: number;
}

export class PartItem {
  private constructor(
    readonly partId: string,
    readonly name: string,
    readonly unitPrice: Money,
    readonly quantity: Quantity,
    readonly quoteVersion: number,
  ) {}

  static create(props: PartItemProps): PartItem {
    assertQuoteVersion(props.quoteVersion);
    if (props.quantity.isZero()) {
      throw new InvalidServiceOrderError(
        'A quantidade da peça deve ser maior que zero',
      );
    }
    return new PartItem(
      props.partId,
      props.name,
      props.unitPrice,
      props.quantity,
      props.quoteVersion,
    );
  }

  get total(): Money {
    return this.unitPrice.multiply(this.quantity.value);
  }
}
