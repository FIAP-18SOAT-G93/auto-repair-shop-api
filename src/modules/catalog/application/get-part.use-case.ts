import { Injectable } from '@nestjs/common';
import { PartNotFoundError } from '../domain/part.errors.js';
import { PartRepository } from '../domain/part.repository.js';
import { type PartOutput, toPartOutput } from './part.output.js';

@Injectable()
export class GetPartUseCase {
  constructor(private readonly parts: PartRepository) {}

  async execute(id: string): Promise<PartOutput> {
    const part = await this.parts.findById(id);
    if (!part) throw new PartNotFoundError();
    return toPartOutput(part);
  }
}
