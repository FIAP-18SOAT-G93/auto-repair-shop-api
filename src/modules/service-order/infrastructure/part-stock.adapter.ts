import { Injectable, Logger } from '@nestjs/common';
import { Money } from '../../../shared/domain/money.js';
import type { Quantity } from '../../../shared/domain/quantity.js';
import { DeductStockUseCase } from '../../catalog/application/deduct-stock.use-case.js';
import { ReverseStockUseCase } from '../../catalog/application/reverse-stock.use-case.js';
import { PartNotFoundError } from '../../catalog/domain/part.errors.js';
import {
  type DeductedPart,
  PartStock,
} from '../application/ports/part-stock.js';

@Injectable()
export class CatalogModulePartStock implements PartStock {
  readonly #logger = new Logger(CatalogModulePartStock.name);

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

  async reverse(partId: string, quantity: Quantity): Promise<void> {
    try {
      await this.reverseStock.execute({ partId, quantity: quantity.value });
    } catch (error) {
      if (!(error instanceof PartNotFoundError)) throw error;
      this.#logger.warn(
        `Estorno de ${quantity.value} unidade(s) ignorado, a peça ${partId} foi removida do catálogo`,
      );
    }
  }
}
