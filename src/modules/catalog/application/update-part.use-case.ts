import { Injectable } from '@nestjs/common';
import { PartNotFoundError } from '../domain/part.errors.js';
import { PartRepository } from '../domain/part.repository.js';
import { type PartInput, toPartDetails } from './part.input.js';
import { type PartOutput, toPartOutput } from './part.output.js';

@Injectable()
export class UpdatePartUseCase {
  constructor(private readonly parts: PartRepository) {}

  async execute(id: string, input: PartInput): Promise<PartOutput> {
    const part = await this.parts.findById(id);
    if (!part) throw new PartNotFoundError();

    part.update(toPartDetails(input));
    await this.parts.save(part);
    return toPartOutput(part);
  }
}
