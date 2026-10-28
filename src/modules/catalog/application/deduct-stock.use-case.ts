import { Injectable } from '@nestjs/common';
import { Quantity } from '../../../shared/domain/quantity.js';
import {
  PartNotFoundError,
  PartOutOfStockError,
} from '../domain/part.errors.js';
import { PartRepository } from '../domain/part.repository.js';
import type { StockMovementInput } from './part.input.js';
import { type PartOutput, toPartOutput } from './part.output.js';

@Injectable()
export class DeductStockUseCase {
  constructor(private readonly parts: PartRepository) {}

  async execute({ partId, quantity }: StockMovementInput): Promise<PartOutput> {
    const amount = Quantity.of(quantity);
    const part = await this.parts.findById(partId);
    if (!part) throw new PartNotFoundError();

    part.deduct(amount);
    // Outra OS pode ter levado o saldo entre a leitura e a baixa.
    if (!(await this.parts.deductStock(part.id, amount))) {
      throw new PartOutOfStockError();
    }
    return toPartOutput(part);
  }
}
