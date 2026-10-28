import { Money } from '../../../shared/domain/money.js';

export interface PricedItem {
  readonly total: Money;
}

export class QuoteCalculator {
  static calculate(items: readonly PricedItem[]): Money {
    return items.reduce((sum, item) => sum.add(item.total), Money.zero());
  }
}
