import type { Money } from '../../../shared/domain/money.js';
import { assertQuoteVersion } from './quote.js';

export interface ServiceItemProps {
  serviceId: string;
  name: string;
  price: Money;
  quoteVersion: number;
}

export class ServiceItem {
  private constructor(
    readonly serviceId: string,
    readonly name: string,
    readonly price: Money,
    readonly quoteVersion: number,
  ) {}

  static create(props: ServiceItemProps): ServiceItem {
    assertQuoteVersion(props.quoteVersion);
    return new ServiceItem(
      props.serviceId,
      props.name,
      props.price,
      props.quoteVersion,
    );
  }

  get total(): Money {
    return this.price;
  }
}
