import type { Money } from '../../../../shared/domain/money.js';
import type { Quantity } from '../../../../shared/domain/quantity.js';

export interface DeductedPart {
  id: string;
  name: string;
  unitPrice: Money;
}

export abstract class PartStock {
  abstract deduct(partId: string, quantity: Quantity): Promise<DeductedPart>;
  abstract reverse(partId: string, quantity: Quantity): Promise<void>;
}
