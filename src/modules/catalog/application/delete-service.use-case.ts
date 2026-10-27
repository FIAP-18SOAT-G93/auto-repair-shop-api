import { Injectable } from '@nestjs/common';
import { ServiceRepository } from '../domain/service.repository.js';

@Injectable()
export class DeleteServiceUseCase {
  constructor(private readonly services: ServiceRepository) {}

  execute(id: string): Promise<void> {
    return this.services.delete(id);
  }
}
