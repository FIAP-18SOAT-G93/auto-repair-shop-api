import { Injectable } from '@nestjs/common';
import { PartRepository } from '../domain/part.repository.js';

@Injectable()
export class DeletePartUseCase {
  constructor(private readonly parts: PartRepository) {}

  execute(id: string): Promise<void> {
    return this.parts.delete(id);
  }
}
