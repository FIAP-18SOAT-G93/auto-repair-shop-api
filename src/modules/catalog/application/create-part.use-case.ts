import { Injectable } from '@nestjs/common';
import { Quantity } from '../../../shared/domain/quantity.js';
import { Part } from '../domain/part.js';
import { PartRepository } from '../domain/part.repository.js';
import { type PartInput, toPartDetails } from './part.input.js';
import { type PartOutput, toPartOutput } from './part.output.js';

export interface CreatePartInput extends PartInput {
  quantity: number;
}

@Injectable()
export class CreatePartUseCase {
  constructor(private readonly parts: PartRepository) {}

  async execute(input: CreatePartInput): Promise<PartOutput> {
    const part = Part.create({
      ...toPartDetails(input),
      quantity: Quantity.of(input.quantity),
    });
    await this.parts.save(part);
    return toPartOutput(part);
  }
}
