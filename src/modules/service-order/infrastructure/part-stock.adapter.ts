import { Injectable } from '@nestjs/common';
import { Money } from '../../../shared/domain/money.js';
import type { Quantity } from '../../../shared/domain/quantity.js';
import { DeductStockUseCase } from '../../catalog/application/deduct-stock.use-case.js';
import { ReverseStockUseCase } from '../../catalog/application/reverse-stock.use-case.js';
import {
  type DeductedPart,
  PartStock,
} from '../application/ports/part-stock.js';

@Injectable()
export class CatalogModulePartStock implements PartStock {
  constructor(
    private readonly deductStock: DeductStockUseCase,
    private readonly reverseStock: ReverseStockUseCase,
  ) {}

  async deduct(partId: string, quantity: Quantity): Promise<DeductedPart> {
    const part = await this.deductStock.execute({
      partId,
      quantity: quantity.value,
    });
    return {
      id: part.id,
      name: part.name,
      unitPrice: Money.fromDecimal(part.price),
    };
  }

  reverse(partId: string, quantity: Quantity): Promise<void> {
    return this.reverseStock.execute({ partId, quantity: quantity.value });
  }
}
